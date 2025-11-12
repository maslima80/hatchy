import ImageKit from 'imagekit';

// Server-side ImageKit instance (with private key)
export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

/**
 * Generate authentication parameters for client-side uploads
 */
export function getImageKitAuthParams() {
  const authenticationParameters = imagekit.getAuthenticationParameters();
  return authenticationParameters;
}

/**
 * Upload image to ImageKit from server
 */
export async function uploadToImageKit(
  file: Buffer | string,
  fileName: string,
  folder: string = 'products'
) {
  try {
    const result = await imagekit.upload({
      file,
      fileName,
      folder,
      useUniqueFileName: true,
    });

    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      thumbnailUrl: result.thumbnailUrl,
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
}

/**
 * Delete image from ImageKit
 */
export async function deleteFromImageKit(fileId: string) {
  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error('ImageKit delete error:', error);
    throw error;
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
) {
  const transformations = [];
  
  if (options.width) transformations.push(`w-${options.width}`);
  if (options.height) transformations.push(`h-${options.height}`);
  if (options.quality) transformations.push(`q-${options.quality}`);
  if (options.format) transformations.push(`f-${options.format}`);
  
  if (transformations.length === 0) return url;
  
  // Insert transformations into ImageKit URL
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT!;
  const path = url.replace(urlEndpoint, '');
  
  return `${urlEndpoint}/tr:${transformations.join(',')}${path}`;
}
