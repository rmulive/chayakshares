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
      // Pristine Architectural Honed Concrete - Smooth museum finish (no dots, no holes)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12;
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
 * Creates metallic museum plaque canvas texture with Name, Place, School, and Award
 * Ultra-high-definition (2048x512, 4:1 ratio) with crisp typography, maximum contrast,
 * and zero vertical distortion.
 */
export function createPlaqueTexture(
  title: string,
  photographer: string,
  award: string,
  isAward: boolean,
  place?: string,
  school?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  // 4:1 ratio strictly matching 3D plaque plane geometry (2.4m x 0.6m)
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const lowerAward = `${place || ''} ${award || ''}`.toLowerCase();
  const isGold = lowerAward.includes('gold') || lowerAward.includes('best of show') || lowerAward.includes('1st') || lowerAward.includes('trophy');
  const isSilver = lowerAward.includes('silver') || lowerAward.includes('2nd');
  const isBronze = lowerAward.includes('bronze') || lowerAward.includes('3rd');

  if (isAward || isGold || isSilver || isBronze) {
    // 1. High-Luminance Metallic Plaque Background
    const grad = ctx.createLinearGradient(0, 0, 2048, 512);
    if (isSilver) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#f1f5f9');
      grad.addColorStop(0.7, '#e2e8f0');
      grad.addColorStop(1, '#cbd5e1');
    } else if (isBronze) {
      grad.addColorStop(0, '#fff7ed');
      grad.addColorStop(0.3, '#fed7aa');
      grad.addColorStop(0.7, '#fdba74');
      grad.addColorStop(1, '#ea580c');
    } else {
      // 24K Radiant Polished High-Contrast Gold (bright background for maximum text contrast)
      grad.addColorStop(0, '#fef9c3');
      grad.addColorStop(0.25, '#fef08a');
      grad.addColorStop(0.6, '#fde047');
      grad.addColorStop(0.85, '#eab308');
      grad.addColorStop(1, '#ca8a04');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 512);

    // Bevel borders
    ctx.strokeStyle = isSilver ? '#ffffff' : (isBronze ? '#ffedd5' : '#ffffff');
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 2028, 492);

    ctx.strokeStyle = isSilver ? '#475569' : (isBronze ? '#7c2d12' : '#854d0e');
    ctx.lineWidth = 4;
    ctx.strokeRect(26, 26, 1996, 460);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. PLACE & AWARD TIER (Prominently Highlighted with Stars)
    const displayPlace = (place ? place : award).toUpperCase();
    ctx.fillStyle = isSilver ? '#0f172a' : (isBronze ? '#431407' : '#422006');
    ctx.font = 'bold 36px "Cinzel", Georgia, serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(`★   ${displayPlace}   ★`, 1024, 76);

    // Header divider
    ctx.strokeStyle = isSilver ? 'rgba(71, 85, 105, 0.45)' : (isBronze ? 'rgba(124, 45, 18, 0.45)' : 'rgba(133, 77, 14, 0.5)');
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(350, 108);
    ctx.lineTo(1698, 108);
    ctx.stroke();

    // 2. PHOTO TITLE (Large, Deep Obsidian Black, High-Contrast)
    ctx.font = 'italic bold 64px "Cinzel", Georgia, serif';
    ctx.fillStyle = isSilver ? '#020617' : (isBronze ? '#1c1917' : '#0a0a0a');
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText(`"${title}"`, 1024, 196);
    ctx.shadowColor = 'transparent';

    // 3. PHOTOGRAPHER NAME (Bold, Clean, Extra Legible)
    ctx.font = 'bold 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isSilver ? '#0f172a' : (isBronze ? '#271006' : '#1c1917');
    ctx.fillText(photographer.toUpperCase(), 1024, 298);

    // 4. SCHOOL / INSTITUTION
    ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isSilver ? '#334155' : (isBronze ? '#7c2d12' : '#713f12');
    const schoolText = school || 'Rajapaksa Central College, Weeraketiya';
    ctx.fillText(schoolText, 1024, 384);

    // Accent footer line
    ctx.strokeStyle = isSilver ? 'rgba(71, 85, 105, 0.35)' : (isBronze ? 'rgba(124, 45, 18, 0.35)' : 'rgba(133, 77, 14, 0.4)');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(420, 424);
    ctx.lineTo(1628, 424);
    ctx.stroke();

    // Footer Attribution
    ctx.font = 'bold 22px "Cinzel", Georgia, serif';
    ctx.fillStyle = isSilver ? '#475569' : (isBronze ? '#7c2d12' : '#78350f');
    ctx.letterSpacing = '2px';
    ctx.fillText('CHAYAKSHA 26’ • RADAPASA MEDIA UNIT • RCCW', 1024, 468);

  } else {
    // Premium Obsidian Matte Plaque (Acceptances & Salon Entries)
    const grad = ctx.createLinearGradient(0, 0, 2048, 512);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 512);

    // Bevel outer & inner border
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 2028, 492);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 1996, 460);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. PLACE & AWARD TIER
    ctx.font = 'bold 36px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fbbf24';
    ctx.letterSpacing = '3px';
    const displayPlace = (place ? place : award).toUpperCase();
    ctx.fillText(`★   ${displayPlace}   ★`, 1024, 76);

    // Divider
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(380, 108);
    ctx.lineTo(1668, 108);
    ctx.stroke();

    // 2. PHOTO TITLE (Crisp Pure White)
    ctx.font = 'italic bold 64px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`"${title}"`, 1024, 196);

    // 3. PHOTOGRAPHER NAME
    ctx.font = 'bold 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(photographer.toUpperCase(), 1024, 298);

    // 4. SCHOOL
    ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#38bdf8';
    const schoolText = school || 'Rajapaksa Central College, Weeraketiya';
    ctx.fillText(schoolText, 1024, 384);

    // Accent line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(420, 424);
    ctx.lineTo(1628, 424);
    ctx.stroke();

    // Footer
    ctx.font = 'bold 22px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '2px';
    ctx.fillText('CHAYAKSHA 26’ • RADAPASA MEDIA UNIT • RCCW', 1024, 468);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates museum wall label signage texture (Category headers, intro wall)
 * Highlighted text with glowing bloom and completely transparent background (no liquid glass)
 */
export function createSignageTexture(
  heading: string,
  subheading: string,
  accentColor: string = '#d97706'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // 100% transparent background - no liquid glass plane!
  ctx.clearRect(0, 0, 1200, 320);

  ctx.textAlign = 'center';

  // Highlight glow effect
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 24;

  // Luminous Accent Top Bar
  ctx.fillStyle = accentColor;
  ctx.fillRect(400, 24, 400, 4);

  // Main Category / Title (Radiant Highlighted Luminous Text)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 58px "Cinzel", Georgia, serif';
  ctx.fillText(heading.toUpperCase(), 600, 115);

  // Extra pass for intense text highlight glow
  ctx.shadowBlur = 12;
  ctx.fillText(heading.toUpperCase(), 600, 115);

  // Reset shadow for crisp subtext
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subheading, 600, 175);

  // Underline highlight with accent dots
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(480, 215);
  ctx.lineTo(720, 215);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(600, 215, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

