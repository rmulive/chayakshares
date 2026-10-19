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
 * Creates metallic plaque canvas texture with Name, Place, School, and Camera Data
 */
export function createPlaqueTexture(
  title: string,
  photographer: string,
  award: string,
  isAward: boolean,
  place?: string,
  school?: string,
  cameraData?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  if (isAward) {
    // Brushed gold brass
    const grad = ctx.createLinearGradient(0, 0, 640, 340);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.3, '#ca8a04');
    grad.addColorStop(0.7, '#eab308');
    grad.addColorStop(1, '#a16207');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 340);

    // Bevel borders
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 628, 328);
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 612, 312);

    ctx.textAlign = 'center';

    // 1. PLACE & AWARD TIER (Prominently Highlighted)
    ctx.fillStyle = '#422006';
    ctx.font = 'bold 24px "Cinzel", Georgia, serif';
    const displayPlace = place ? `${place.toUpperCase()}` : award.toUpperCase();
    ctx.fillText(displayPlace, 320, 52);

    // Title
    ctx.font = 'italic bold 26px serif';
    ctx.fillStyle = '#1c1917';
    ctx.fillText(`"${title}"`, 320, 102);

    // 2. PHOTOGRAPHER NAME (Prominently Highlighted)
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#451a03';
    ctx.fillText(photographer.toUpperCase(), 320, 150);

    // 3. SCHOOL (Prominently Highlighted)
    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#78350f';
    const schoolText = school || 'Rajapaksa Central College, Weeraketiya';
    ctx.fillText(schoolText, 320, 192);

    // Accent line
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, 215);
    ctx.lineTo(520, 215);
    ctx.stroke();

    // 4. CAMERA SETTINGS & DATA
    ctx.font = '500 15px monospace';
    ctx.fillStyle = '#5c2b07';
    const camText = cameraData || 'SONY A1 • 50mm • f/2.8 • 1/2000s • ISO 100';
    ctx.fillText(camText, 320, 248);

    // Footer
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#713f12';
    ctx.fillText('CHAYAKSHA 26’ • RADAPASA MEDIA UNIT', 320, 298);

  } else {
    // Sleek matte slate plaque
    const grad = ctx.createLinearGradient(0, 0, 640, 340);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 340);

    // Border
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 628, 328);

    ctx.textAlign = 'center';

    // 1. PLACE & AWARD TIER
    ctx.font = 'bold 22px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fbbf24';
    const displayPlace = place ? place.toUpperCase() : award.toUpperCase();
    ctx.fillText(displayPlace, 320, 52);

    // Title
    ctx.font = 'italic 25px serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`"${title}"`, 320, 102);

    // 2. PHOTOGRAPHER NAME
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(photographer.toUpperCase(), 320, 150);

    // 3. SCHOOL
    ctx.font = '500 18px sans-serif';
    ctx.fillStyle = '#94a3b8';
    const schoolText = school || 'Rajapaksa Central College, Weeraketiya';
    ctx.fillText(schoolText, 320, 192);

    // Accent line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 215);
    ctx.lineTo(520, 215);
    ctx.stroke();

    // 4. CAMERA SETTINGS & DATA
    ctx.font = '500 15px monospace';
    ctx.fillStyle = '#cbd5e1';
    const camText = cameraData || 'NIKON Z9 • 70-200mm • f/4 • 1/500s • ISO 200';
    ctx.fillText(camText, 320, 248);

    // Footer
    ctx.font = '13px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('CHAYAKSHA 26’ • RADAPASA MEDIA UNIT', 320, 298);
  }

  const texture = new THREE.CanvasTexture(canvas);
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

