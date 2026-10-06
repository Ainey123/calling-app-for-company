/**
 * Utility functions for handling custom employee profile photos.
 * Allows uploading real photos from device (computer, phone, camera)
 * with client-side center-cropping, resizing to 320x320, and compression.
 */

export const processUploadedImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const TARGET_SIZE = 320;
          const width = img.width;
          const height = img.height;

          // Crop center square
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            TARGET_SIZE,
            TARGET_SIZE
          );

          // Compress to JPEG with 0.88 quality (approx 20-40 KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressedDataUrl);
        } catch (err) {
          // Fallback to original read result if canvas processing fails
          resolve(result);
        }
      };

      img.onerror = () => {
        resolve(result);
      };

      img.src = result;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Generates an SVG Data-URI with employee initials if no photo is uploaded.
 */
export const getInitialsAvatar = (name: string, extension: string): string => {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name.slice(0, 2) || 'OP').toUpperCase();

  // Distinct background hue derived from extension or name
  const hues = [
    ['#4f46e5', '#3730a3'], // Indigo
    ['#059669', '#065f46'], // Emerald
    ['#d97706', '#92400e'], // Amber
    ['#0284c7', '#075985'], // Sky
    ['#7c3aed', '#5b21b6'], // Violet
    ['#e11d48', '#9f1239'], // Rose
  ];
  const charCode = (name.charCodeAt(0) || 65) + parseInt(extension.replace(/\D/g, '') || '101', 10);
  const [c1, c2] = hues[charCode % hues.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="32" fill="url(#grad)" />
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="44" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
