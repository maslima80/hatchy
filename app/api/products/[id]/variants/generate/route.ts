import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, productOptions, productOptionValues, variants } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateVariantCombinations, generateVariantSKU, areOptionValuesEqual } from '@/lib/variants';

/**
 * POST /api/products/[id]/variants/generate
 * Generate all variant combinations from option groups
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    // Verify product ownership
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.userId, session.user.id),
          isNull(products.deletedAt)
        )
      );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get all options and their values
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId))
      .orderBy(productOptions.position);

    if (options.length === 0) {
      return NextResponse.json(
        { error: 'No options defined. Add at least one option group first.' },
        { status: 400 }
      );
    }

    // Get values for each option
    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        const values = await db
          .select()
          .from(productOptionValues)
          .where(eq(productOptionValues.optionId, option.id))
          .orderBy(productOptionValues.position);

        return {
          name: option.name,
          values: values.map(v => v.value),
        };
      })
    );

    // Check if all options have at least one value
    const invalidOptions = optionsWithValues.filter(opt => opt.values.length === 0);
    if (invalidOptions.length > 0) {
      return NextResponse.json(
        { error: `Option "${invalidOptions[0].name}" has no values. Add at least one value to each option.` },
        { status: 400 }
      );
    }

    // Generate combinations
    const combinations = generateVariantCombinations(optionsWithValues);

    if (combinations.length === 0) {
      return NextResponse.json(
        { error: 'No combinations generated' },
        { status: 400 }
      );
    }

    // Get existing variants to avoid duplicates
    const existingVariants = await db
      .select()
      .from(variants)
      .where(
        and(
          eq(variants.productId, productId),
          isNull(variants.deletedAt)
        )
      );

    // Filter out existing combinations
    const newCombinations = combinations.filter(combo => {
      return !existingVariants.some(existing => {
        if (!existing.optionValuesJson) return false;
        try {
          const existingOptions = JSON.parse(existing.optionValuesJson);
          return areOptionValuesEqual(combo, existingOptions);
        } catch {
          return false;
        }
      });
    });

    if (newCombinations.length === 0) {
      return NextResponse.json({
        message: 'All combinations already exist',
        variants: existingVariants,
        created: 0,
      });
    }

    // Generate base SKU from product title or existing variant
    let baseSku = 'VAR';
    if (existingVariants.length > 0 && existingVariants[0].sku) {
      // Extract base from existing SKU (remove suffix after last dash)
      const parts = existingVariants[0].sku.split('-');
      baseSku = parts.slice(0, -optionsWithValues.length).join('-') || 'VAR';
    } else if (product.title) {
      // Generate from product title
      baseSku = product.title
        .substring(0, 10)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    }

    // Create new variants
    const createdVariants = await Promise.all(
      newCombinations.map(async (combo) => {
        const sku = generateVariantSKU(baseSku, combo);
        
        const [variant] = await db
          .insert(variants)
          .values({
            productId,
            sku,
            optionValuesJson: JSON.stringify(combo),
            priceCents: null,
            costCents: null,
            stock: null,
            imageUrl: null,
          })
          .returning();

        return variant;
      })
    );

    // Get all variants (existing + new)
    const allVariants = await db
      .select()
      .from(variants)
      .where(
        and(
          eq(variants.productId, productId),
          isNull(variants.deletedAt)
        )
      );

    return NextResponse.json({
      message: `Generated ${createdVariants.length} new variant(s)`,
      variants: allVariants,
      created: createdVariants.length,
      total: allVariants.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating variants:', error);
    return NextResponse.json(
      { error: 'Failed to generate variants' },
      { status: 500 }
    );
  }
}
