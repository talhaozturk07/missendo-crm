/**
 * Convert an image File to WebP format in the browser.
 * Falls back gracefully when OffscreenCanvas is unavailable.
 */
async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  if (file.type === 'image/webp' || !file.type.startsWith('image/')) {
    return file;
  }

  if (file.type === 'image/svg+xml') {
    return file;
  }

  try {
    if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;

      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
      const baseName = file.name.replace(/\.[^.]+$/, '');
      return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
    }

    const image = await loadImageElement(file);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  } catch (err) {
    console.warn('WebP conversion failed, using original file:', err);
    return file;
  }
}
