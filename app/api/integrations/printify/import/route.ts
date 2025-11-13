import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { printifyConnections, products, variants, productOptions, productOptionValues, productMedia } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getProductDetails, PrintifyProductDetails } from '@/lib/printify';
import { generateVariantSKU } from '@/lib/variants-client';

/**
 * POST /api/integrations/printify/import
 * Import a Printify product into Hatchy
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, productId } = body;

    if (!shopId || !productId) {
      return NextResponse.json(
        { error: 'Shop ID and Product ID are required' },
        { status: 400 }
      );
    }

    // Get connection
    const [connection] = await db
      .select()
      .from(printifyConnections)
      .where(eq(printifyConnections.userId, session.user.id));

    if (!connection) {
      return NextResponse.json(
        { error: 'No Printify connection found' },
        { status: 404 }
      );
    }

    // Fetch full product details from Printify
    const printifyProduct = await getProductDetails(
      connection.apiKey,
      String(shopId),
      String(productId)
    );

    // Log the raw Printify response for debugging
    console.log('=== PRINTIFY PRODUCT IMPORT DEBUG ===');
    console.log('Product ID:', printifyProduct.id);
    console.log('Title:', printifyProduct.title);
    console.log('Description length:', printifyProduct.description?.length || 0);
    console.log('Images count:', printifyProduct.images?.length || 0);
    console.log('Images:', JSON.stringify(printifyProduct.images, null, 2));
    console.log('Options:', JSON.stringify(printifyProduct.options, null, 2));
    console.log('Variants count:', printifyProduct.variants?.length || 0);
    console.log('First variant sample:', JSON.stringify(printifyProduct.variants?.[0], null, 2));
    console.log('===================================');

    // Check if product already imported
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.externalId, String(printifyProduct.id)));

    if (existing) {
      return NextResponse.json(
        { error: 'This product has already been imported' },
        { status: 400 }
      );
    }

    // Import the product
    const result = await importPrintifyProduct(
      session.user.id,
      printifyProduct
    );

    return NextResponse.json({
      success: true,
      productId: result.productId,
      variantCount: result.variantCount,
      message: 'Product imported successfully',
    });
  } catch (error: any) {
    console.error('Printify import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import product' },
      { status: 500 }
    );
  }
}

/**
 * Import a Printify product into Hatchy database
 */
async function importPrintifyProduct(
  userId: string,
  printifyProduct: PrintifyProductDetails
): Promise<{ productId: string; variantCount: number }> {
  // Validate required data
  if (!printifyProduct.title) {
    throw new Error('Printify product has no title');
  }

  if (!printifyProduct.variants || printifyProduct.variants.length === 0) {
    throw new Error('Printify product has no variants');
  }

  // Get images - Printify images array
  const productImages = printifyProduct.images || [];
  if (productImages.length === 0) {
    console.warn('Warning: Printify product has no images');
  }
  // 1. Create the product
  const defaultImage = productImages.find(img => img.is_default) || productImages[0];
  
  const [product] = await db
    .insert(products)
    .values({
      userId,
      title: printifyProduct.title,
      description: printifyProduct.description || '',
      type: 'POD', // Print on Demand
      status: 'DRAFT', // Start as draft
      source: 'printify',
      externalId: String(printifyProduct.id),
      externalProvider: 'printify',
      defaultImageUrl: defaultImage?.src || null,
      variationsEnabled: printifyProduct.options.length > 0,
    })
    .returning();

  console.log('Created product:', product.id, 'with', productImages.length, 'images');

  // 1.5. Import product images into media gallery
  for (let i = 0; i < productImages.length; i++) {
    const image = productImages[i];
    try {
      await db.insert(productMedia).values({
        productId: product.id,
        url: image.src,
        alt: printifyProduct.title,
        position: i,
      });
      console.log(`Imported image ${i + 1}/${productImages.length}:`, image.src);
    } catch (error) {
      console.error(`Failed to import image ${i + 1}:`, error);
    }
  }

  // 2. Create product options (Size, Color, etc.)
  const optionMap = new Map<string, { id: string; valueMap: Map<number, string> }>();

  for (let optIdx = 0; optIdx < printifyProduct.options.length; optIdx++) {
    const printifyOption = printifyProduct.options[optIdx];
    
    const [option] = await db
      .insert(productOptions)
      .values({
        productId: product.id,
        name: printifyOption.name,
        position: optIdx,
      })
      .returning();

    console.log(`Created option: ${printifyOption.name} (${printifyOption.values.length} values)`);

    const valueMap = new Map<number, string>();

    // Create option values
    for (let valIdx = 0; valIdx < printifyOption.values.length; valIdx++) {
      const printifyValue = printifyOption.values[valIdx];
      
      const [value] = await db
        .insert(productOptionValues)
        .values({
          optionId: option.id,
          value: printifyValue.title,
          position: valIdx,
        })
        .returning();

      valueMap.set(printifyValue.id, printifyValue.title);
      console.log(`  - Value: ${printifyValue.title} (ID: ${printifyValue.id})`);
    }

    optionMap.set(printifyOption.name, { id: option.id, valueMap });
  }

  // 3. Create variants
  let variantCount = 0;
  let skippedCount = 0;

  console.log(`Processing ${printifyProduct.variants.length} variants...`);

  for (const printifyVariant of printifyProduct.variants) {
    // Skip disabled variants
    if (!printifyVariant.is_enabled) {
      skippedCount++;
      console.log(`Skipped disabled variant ID ${printifyVariant.id}`);
      continue;
    }

    // Build option values JSON from Printify variant options
    const optionValuesJson: Record<string, string> = {};
    
    for (let i = 0; i < printifyProduct.options.length; i++) {
      const printifyOption = printifyProduct.options[i];
      const printifyValueId = printifyVariant.options[i];
      const optionData = optionMap.get(printifyOption.name);
      
      if (optionData) {
        const valueName = optionData.valueMap.get(printifyValueId);
        if (valueName) {
          optionValuesJson[printifyOption.name] = valueName;
        } else {
          console.warn(`Could not find value name for option ${printifyOption.name}, value ID ${printifyValueId}`);
        }
      } else {
        console.warn(`Could not find option data for ${printifyOption.name}`);
      }
    }

    // Validate we have all options mapped
    if (Object.keys(optionValuesJson).length !== printifyProduct.options.length) {
      console.error(`Variant ${printifyVariant.id} missing options. Expected ${printifyProduct.options.length}, got ${Object.keys(optionValuesJson).length}`);
      console.error('Option values:', optionValuesJson);
      continue;
    }

    // Generate SKU if not provided
    const sku = printifyVariant.sku || generateVariantSKU(
      `PRINT-${printifyProduct.id}`,
      optionValuesJson
    );

    // Printify cost is in cents (already)
    const costCents = Math.round(printifyVariant.cost);

    console.log(`Creating variant ${variantCount + 1}:`, {
      sku,
      options: optionValuesJson,
      costCents,
      externalId: printifyVariant.id,
    });

    // Create variant
    try {
      await db
        .insert(variants)
        .values({
          productId: product.id,
          sku,
          optionValuesJson: JSON.stringify(optionValuesJson),
          costCents,
          priceCents: null, // User will set pricing
          stock: null, // Printify manages stock
          externalId: String(printifyVariant.id),
          externalProvider: 'printify',
        });

      variantCount++;
    } catch (error) {
      console.error(`Failed to create variant ${printifyVariant.id}:`, error);
      throw error;
    }
  }

  console.log(`Import complete: ${variantCount} variants created, ${skippedCount} skipped`);

  return {
    productId: product.id,
    variantCount,
  };
}
