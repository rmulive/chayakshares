/**
 * Image Optimizer and IndexedDB Storage Engine for Chayaksha 26'
 * Ensures images never exceed browser quotas, load instantaneously in Three.js WebGL,
 * and preserve exact camera aspect ratios.
 */

const DB_NAME = 'chayaksha_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'artwork_images';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Persists an image in browser IndexedDB (hundreds of MB quota)
 */
export async function saveImageToIndexedDb(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save image to IndexedDB:', err);
  }
}

/**
 * Retrieves an image from browser IndexedDB
 */
export async function getImageFromIndexedDb(key: string): Promise<string | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export interface OptimizedImageResult {
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  fileSizeBytes: number;
}

/**
 * Compresses and calibrates any high-resolution photograph (JPEG, PNG, WebP)
 * to an optimized WebGL texture with exact natural aspect ratio.
 */
export function optimizeImageFile(
  file: File,
  maxDimension: number = 2048,
  quality: number = 0.88
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;
      const aspectRatio = Number((naturalWidth / naturalHeight).toFixed(3));

      // Calculate scaled dimensions fitting within maxDimension
      let targetWidth = naturalWidth;
      let targetHeight = naturalHeight;

      if (targetWidth > maxDimension || targetHeight > maxDimension) {
        if (targetWidth > targetHeight) {
          targetWidth = maxDimension;
          targetHeight = Math.round(maxDimension / aspectRatio);
        } else {
          targetHeight = maxDimension;
          targetWidth = Math.round(maxDimension * aspectRatio);
        }
      }

      // Draw to offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not obtain canvas 2D rendering context'));
        return;
      }

      // High quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Export as high-fidelity JPEG
      const mime = file.type === 'image/png' && hasTransparency(ctx, targetWidth, targetHeight)
        ? 'image/png'
        : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, quality);

      URL.revokeObjectURL(objectUrl);

      resolve({
        dataUrl,
        naturalWidth,
        naturalHeight,
        aspectRatio,
        fileSizeBytes: Math.round((dataUrl.length * 3) / 4),
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  // Check small sampling to see if alpha is used
  try {
    const sample = ctx.getImageData(0, 0, Math.min(w, 50), Math.min(h, 50));
    for (let i = 3; i < sample.data.length; i += 4) {
      if (sample.data[i] < 250) return true;
    }
  } catch (_) {}
  return false;
}
