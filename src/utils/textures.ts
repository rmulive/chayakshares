import * as THREE from 'three';
import type { GalleryTheme } from '../types/exhibition';

// Cache generated textures so we don't recreate them needlessly
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a procedural noise/pattern canvas
 */
function createNoiseCanvas(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawFn(ctx, width, height);
  }
  return canvas;
}

/**
 * Generates Wall Textures depending on the gallery theme
 */
export function getWallTexture(theme: GalleryTheme): THREE.CanvasTexture {
  const cacheKey = `wall_${theme}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = createNoiseCanvas(1024, 1024, (ctx, w, h) => {
    if (theme === 'minimalist-alabaster') {
      // Clean museum alabaster wall with very subtle stippling
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, w, h);
      
      // Subtle micro-grain
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 6;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

    } else if (theme === 'dark-noir') {
      // Deep charcoal/matte obsidian acoustic wall
      ctx.fillStyle = '#111317';
      ctx.fillRect(0, 0, w, h);
      
      // Fine acoustic fabric/velvet grain
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

    } else if (theme === 'warm-travertine') {
      // Warm limestone / Roman travertine with horizontal sediment strata
      ctx.fillStyle = '#eae2cf';
      ctx.fillRect(0, 0, w, h);
      
      // Natural stone striations
      ctx.fillStyle = 'rgba(210, 195, 175, 0.35)';
      for (let y = 0; y < h; y += 8 + Math.random() * 12) {
        ctx.fillRect(0, y, w, 2 + Math.random() * 4);
      }
      
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 14;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

    } else {
      // Brutalist Architectural Concrete with formwork lines & tie holes
      ctx.fillStyle = '#7a7d82';
      ctx.fillRect(0, 0, w, h);
      
      // Board formwork horizontal seams
      const boardHeight = h / 4;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#4e5156';
      for (let b = 1; b < 4; b++) {
        ctx.beginPath();
        ctx.moveTo(0, b * boardHeight);
        ctx.lineTo(w, b * boardHeight);
        ctx.stroke();
      }

      // Tie bolt holes
      for (let bx = 120; bx < w; bx += 260) {
        for (let by = boardHeight / 2; by < h; by += boardHeight) {
          ctx.beginPath();
          ctx.arc(bx, by, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#3a3c40';
          ctx.fill();
          ctx.strokeStyle = '#2b2d30';
          ctx.stroke();
        }
      }

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generates Floor Textures depending on theme
 */
export function getFloorTexture(theme: GalleryTheme): THREE.CanvasTexture {
  const cacheKey = `floor_${theme}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = createNoiseCanvas(1024, 1024, (ctx, w, h) => {
    if (theme === 'minimalist-alabaster') {
      // Large format Carrara marble slabs with subtle grey veining
      ctx.fillStyle = '#e8ebed';
      ctx.fillRect(0, 0, w, h);

      // Marble veins
      ctx.strokeStyle = 'rgba(180, 190, 200, 0.45)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        let curX = Math.random() * w;
        let curY = 0;
        ctx.moveTo(curX, curY);
        while (curY < h) {
          curX += (Math.random() - 0.5) * 80;
          curY += 40 + Math.random() * 40;
          ctx.lineTo(curX, curY);
        }
        ctx.stroke();
      }

      // Tile grout grid (large 512x512 tiles)
      ctx.strokeStyle = 'rgba(160, 170, 180, 0.5)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

    } else if (theme === 'dark-noir') {
      // Dark chevron walnut hardwood
      ctx.fillStyle = '#181512';
      ctx.fillRect(0, 0, w, h);

      // Wood plank lines
      ctx.strokeStyle = '#0d0b09';
      ctx.lineWidth = 3;
      const plankW = w / 8;
      for (let x = 0; x <= w; x += plankW) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Wood grain lines
      ctx.strokeStyle = 'rgba(45, 38, 30, 0.3)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (Math.random() - 0.5) * 3);
        ctx.stroke();
      }

    } else if (theme === 'warm-travertine') {
      // Warm Italian Roman stone tiles with natural variation
      ctx.fillStyle = '#d8cbba';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#bdafa0';
      ctx.lineWidth = 4;
      const step = w / 4;
      for (let x = 0; x <= w; x += step) {
        for (let y = 0; y <= h; y += step) {
          ctx.strokeRect(x, y, step, step);
          // subtle warm shade per tile
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(195, 178, 160, 0.15)';
            ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
          }
        }
      }

    } else {
      // Brutalist: Polished industrial poured concrete slab with expansion joints
      ctx.fillStyle = '#4f5257';
      ctx.fillRect(0, 0, w, h);

      // Expansion joints
      ctx.strokeStyle = '#2d2f33';
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Industrial aggregate specks
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 12);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates metallic plaque canvas texture
 */
export function createPlaqueTexture(
  title: string,
  photographer: string,
  award: string,
  isAward: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (isAward) {
    // Brushed gold brass
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.3, '#ca8a04');
    grad.addColorStop(0.7, '#eab308');
    grad.addColorStop(1, '#a16207');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Border bevel
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 244);
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 488, 232);

    // Text in deep etched bronze
    ctx.fillStyle = '#422006';
    ctx.textAlign = 'center';
    
    ctx.font = 'bold 22px serif';
    ctx.fillText(award.toUpperCase(), 256, 52);

    ctx.font = 'italic 28px serif';
    ctx.fillText(`"${title}"`, 256, 115);

    ctx.font = '22px sans-serif';
    ctx.fillText(photographer, 256, 170);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#713f12';
    ctx.fillText('CHAYAKSHA SALON 2026', 256, 215);

  } else {
    // Sleek matte slate plaque
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Border
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 500, 244);

    // Text in clean platinum white
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(award.toUpperCase(), 256, 52);

    ctx.font = 'italic 26px serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`"${title}"`, 256, 115);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(photographer, 256, 170);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('SALON ACCEPTANCE', 256, 215);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates museum wall label signage texture (Category headers, intro wall)
 */
export function createSignageTexture(
  heading: string,
  subheading: string,
  accentColor: string = '#d97706'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 300;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 300);

  // Elegant typographic banner
  ctx.textAlign = 'center';

  // Accent rule line
  ctx.fillStyle = accentColor;
  ctx.fillRect(362, 30, 300, 3);

  // Main Category / Room Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 48px "Cinzel", Georgia, serif';
  ctx.fillText(heading.toUpperCase(), 512, 110);

  // Subtitle
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '300 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subheading, 512, 165);

  // Accent dot
  ctx.beginPath();
  ctx.arc(512, 205, 4, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
