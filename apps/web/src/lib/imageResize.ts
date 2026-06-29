// Resizes an image File to a square-ish avatar and returns a compressed JPEG data URL.
// Keeps the payload tiny (~15-40KB) so it can be stored directly as a string.

export const MAX_AVATAR_SOURCE_BYTES = 8 * 1024 * 1024; // 8MB raw upload cap

export async function fileToAvatarDataUrl(file: File, maxSize = 320, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("not-an-image");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, maxSize);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("canvas-unsupported");
    }
    ctx.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = src;
  });
}

function fitWithin(width: number, height: number, maxSize: number) {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }
  const scale = Math.min(maxSize / width, maxSize / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}
