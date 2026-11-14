/**
 * Client-side image compressor for bill receipts and documents.
 * Reduces 5MB-10MB mobile camera photos to ~50-90KB without losing receipt readability.
 * Solves system slowdowns caused by massive Base64 strings in the database and LocalStorage.
 */

export async function compressImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.75 } = {}) {
  if (!file) return null;

  // If it's a PDF or not an image, return original data URL
  if (file.type === 'application/pdf' || !file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, blob: file, isCompressed: false });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: event.target.result, blob: file, isCompressed: false });
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            resolve({
              dataUrl: compressedDataUrl,
              blob: blob || file,
              isCompressed: true,
              originalSize: file.size,
              compressedSize: blob ? blob.size : compressedDataUrl.length,
              width,
              height
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
