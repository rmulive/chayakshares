import * as THREE from 'three';
import type { Artwork } from '../../types/exhibition';
import { createPlaqueTexture } from '../../utils/textures';
import { getImageFromIndexedDb } from '../../utils/imageOptimizer';

// In-memory cache for loaded textures
const loadedTextures = new Map<string, THREE.Texture>();

/**
 * Creates an elegant archival museum placeholder when an image fails to load or is loading
 */
function createArchivalFallbackTexture(artwork: Artwork): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Warm fine-art gallery matting
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);

  // Border inlay
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 1140, 740);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 45, 1110, 710);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Stylized camera aperture / rosette
  ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
  ctx.beginPath();
  ctx.arc(600, 260, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Shutter blades
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(600, 260);
    ctx.lineTo(600 + Math.cos(angle) * 90, 260 + Math.sin(angle) * 90);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Inner lens point
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(600, 260, 24, 0, Math.PI * 2);
  ctx.fill();

  // Title
  ctx.font = 'italic bold 44px "Cinzel", Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`"${artwork.title}"`, 600, 440);

  // Photographer
  ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(artwork.photographer.toUpperCase(), 600, 520);

  // School
  ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(artwork.school || 'Rajapaksa Central College, Weeraketiya', 600, 580);

  // Exhibition Footer
  ctx.font = 'bold 18px "Cinzel", serif';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.letterSpacing = '3px';
  ctx.fillText('CHAYAKSHA 26’ • EXHIBITION ARCHIVE', 600, 680);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export class ArtworkMesh extends THREE.Group {
  public artwork: Artwork;
  public photoMesh: THREE.Mesh;
  public frameMesh: THREE.Mesh;
  public matMesh: THREE.Mesh;
  public plaqueMesh: THREE.Mesh;
  public spotLight: THREE.SpotLight;
  public interactiveObjects: THREE.Object3D[] = [];
  private photoMaterial: THREE.MeshStandardMaterial;

  constructor(artwork: Artwork, frameColor: number = 0x1e293b) {
    super();
    this.artwork = artwork;
    this.name = `artwork-${artwork.id}`;

    const isAward = artwork.awardTier !== 'Salon Acceptance';
    const isHero = !!artwork.isHero;

    // Initial size dimensions based on calibrated ratio
    const initialRatio = (artwork.aspectRatio && !isNaN(artwork.aspectRatio) && artwork.aspectRatio > 0)
      ? artwork.aspectRatio
      : 1.5;

    let photoWidth: number;
    let photoHeight: number;

    if (isHero) {
      if (initialRatio >= 1) {
        photoWidth = 5.2;
        photoHeight = Math.min(photoWidth / initialRatio, 3.4);
      } else {
        photoHeight = 3.2;
        photoWidth = photoHeight * initialRatio;
      }
    } else {
      if (initialRatio >= 1.0) {
        // Landscape or Square
        photoWidth = 2.4;
        photoHeight = photoWidth / initialRatio;
        if (photoHeight > 2.0) {
          photoHeight = 2.0;
          photoWidth = photoHeight * initialRatio;
        }
      } else {
        // Portrait (e.g. 2:3, 4:5, 9:16)
        photoHeight = 1.95;
        photoWidth = photoHeight * initialRatio;
        if (photoWidth > 2.4) {
          photoWidth = 2.4;
          photoHeight = photoWidth / initialRatio;
        }
      }
    }

    const frameBorder = isHero ? 0.12 : 0.08;
    const frameDepth = 0.08;
    const matBorder = isHero ? 0.06 : 0.05;

    // --- 1. Frame Mesh ---
    const frameGeo = new THREE.BoxGeometry(
      photoWidth + frameBorder * 2,
      photoHeight + frameBorder * 2,
      frameDepth
    );
    const frameMat = new THREE.MeshStandardMaterial({
      color: isAward ? 0xd4af37 : frameColor,
      metalness: isAward ? 0.75 : 0.15,
      roughness: isAward ? 0.28 : 0.65,
    });
    this.frameMesh = new THREE.Mesh(frameGeo, frameMat);
    this.frameMesh.position.z = -frameDepth / 2;
    this.frameMesh.castShadow = true;
    this.add(this.frameMesh);

    // --- 2. Inner Museum Matting (Passe-partout) ---
    const matGeo = new THREE.PlaneGeometry(
      photoWidth + matBorder * 2,
      photoHeight + matBorder * 2
    );
    const matMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbf9f5,
      roughness: 0.95,
      metalness: 0.0,
    });
    this.matMesh = new THREE.Mesh(matGeo, matMaterial);
    this.matMesh.position.z = 0.005;
    this.add(this.matMesh);

    // --- 3. Photograph Canvas Plane ---
    const photoGeo = new THREE.PlaneGeometry(photoWidth, photoHeight);
    this.photoMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.02,
    });

    this.photoMesh = new THREE.Mesh(photoGeo, this.photoMaterial);
    this.photoMesh.position.z = 0.012;
    this.photoMesh.userData = { isArtwork: true, artworkId: artwork.id, artwork };
    this.interactiveObjects.push(this.photoMesh);
    this.add(this.photoMesh);

    // --- 4. Museum Plaque Underneath (4:1 Aspect Ratio Matching Texture) ---
    const plaqueWidth = Math.max(1.8, Math.min(photoWidth, 2.4));
    const plaqueHeight = plaqueWidth / 4.0; // Strictly 4:1 ratio matching the 2048x512 canvas!
    const plaqueGeo = new THREE.PlaneGeometry(plaqueWidth, plaqueHeight);
    const plaqueTex = createPlaqueTexture(
      artwork.title,
      artwork.photographer,
      artwork.awardTier,
      isAward,
      artwork.place,
      artwork.school
    );

    // Matte brass/slate material without harsh specular mirror glare
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      metalness: 0.05,
      roughness: 0.65,
    });
    this.plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    this.plaqueMesh.position.y = -photoHeight / 2 - frameBorder - plaqueHeight / 2 - 0.12;
    this.plaqueMesh.position.z = 0.01;
    this.plaqueMesh.userData = { isArtwork: true, artworkId: artwork.id, artwork };
    this.interactiveObjects.push(this.plaqueMesh);
    this.add(this.plaqueMesh);

    // --- 5. Dedicated Ceiling Spotlight ---
    const awardLower = `${artwork.place || ''} ${artwork.awardTier || ''}`.toLowerCase();
    let spotlightColor = 0xffffff;
    let spotlightIntensity = 2.8;
    let spotAngle = Math.PI / 4.2;

    if (awardLower.includes('gold') || awardLower.includes('best of show') || awardLower.includes('1st')) {
      spotlightColor = 0xffd700;
      spotlightIntensity = isHero ? 5.5 : 4.8;
      spotAngle = Math.PI / 3.8;
    } else if (awardLower.includes('silver') || awardLower.includes('2nd')) {
      spotlightColor = 0xe0e7ff;
      spotlightIntensity = 4.0;
    } else if (awardLower.includes('bronze') || awardLower.includes('3rd')) {
      spotlightColor = 0xf59e0b;
      spotlightIntensity = 3.8;
    } else if (awardLower.includes('ribbon') || awardLower.includes('honorable')) {
      spotlightColor = 0xfef08a;
      spotlightIntensity = 3.2;
    }

    this.spotLight = new THREE.SpotLight(spotlightColor, spotlightIntensity);
    this.spotLight.angle = spotAngle;
    this.spotLight.penumbra = 0.45;
    this.spotLight.decay = 1.6;
    this.spotLight.distance = 9.0;
    this.spotLight.position.set(0, 1.8, 1.2);
    this.spotLight.target = this.photoMesh;
    this.add(this.spotLight);
    this.add(this.spotLight.target);

    // Initial position & orientation
    if (artwork.position) {
      this.position.set(artwork.position[0], artwork.position[1], artwork.position[2]);
    }
    if (artwork.rotationY !== undefined) {
      this.rotation.y = artwork.rotationY;
    }

    // Load Image Texture
    this.loadTexture();
  }

  /**
   * Resilient texture loader: loads from cache, IndexedDB, or URL with CORS safety
   */
  private async loadTexture(): Promise<void> {
    const { artwork } = this;
    let targetUrl = artwork.imageUrl;

    // Check IndexedDB if the URL is missing or local
    if (!targetUrl || targetUrl.startsWith('data:') || targetUrl.length > 50000) {
      try {
        const cached = await getImageFromIndexedDb(artwork.id);
        if (cached) {
          targetUrl = cached;
        }
      } catch (_) {}
    }

    if (!targetUrl) {
      this.applyFallbackTexture();
      return;
    }

    // Check in-memory texture cache
    if (loadedTextures.has(targetUrl)) {
      const tex = loadedTextures.get(targetUrl)!;
      this.applyTexture(tex);
      const img = tex.image as HTMLImageElement | undefined;
      if (img && img.naturalWidth && img.naturalHeight) {
        this.updateFrameRatio(img.naturalWidth / img.naturalHeight);
      }
      return;
    }

    // Load with HTMLImageElement for maximum resilience and CORS support
    const img = new Image();

    // Only set crossOrigin on remote external URLs (NOT data: or blob:)
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;

      loadedTextures.set(targetUrl, tex);
      this.applyTexture(tex);

      if (img.naturalWidth && img.naturalHeight) {
        const naturalRatio = Number((img.naturalWidth / img.naturalHeight).toFixed(3));
        this.updateFrameRatio(naturalRatio);
      }
    };

    img.onerror = () => {
      // If anonymous CORS failed, retry without crossOrigin as secondary attempt
      if (img.crossOrigin) {
        const retryImg = new Image();
        retryImg.onload = () => {
          const tex = new THREE.Texture(retryImg);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.needsUpdate = true;
          this.applyTexture(tex);

          if (retryImg.naturalWidth && retryImg.naturalHeight) {
            const naturalRatio = Number((retryImg.naturalWidth / retryImg.naturalHeight).toFixed(3));
            this.updateFrameRatio(naturalRatio);
          }
        };
        retryImg.onerror = () => {
          this.applyFallbackTexture();
        };
        retryImg.src = targetUrl;
      } else {
        this.applyFallbackTexture();
      }
    };

    img.src = targetUrl;
  }

  private applyTexture(tex: THREE.Texture): void {
    this.photoMaterial.map = tex;
    this.photoMaterial.color.setHex(0xffffff);
    this.photoMaterial.needsUpdate = true;
  }

  private applyFallbackTexture(): void {
    const fallbackTex = createArchivalFallbackTexture(this.artwork);
    this.photoMaterial.map = fallbackTex;
    this.photoMaterial.color.setHex(0xffffff);
    this.photoMaterial.needsUpdate = true;
    if (this.artwork.aspectRatio) {
      this.updateFrameRatio(this.artwork.aspectRatio);
    }
  }

  /**
   * Dynamically adjusts the 3D photo, matting, frame, and plaque
   * to strictly match the photograph's natural aspect ratio.
   */
  public updateFrameRatio(ratio: number): void {
    if (!ratio || isNaN(ratio) || ratio <= 0) return;
    this.artwork.aspectRatio = ratio;

    const isHero = !!this.artwork.isHero;
    let width: number;
    let height: number;

    if (isHero) {
      if (ratio >= 1) {
        width = 5.2;
        height = Math.min(width / ratio, 3.4);
      } else {
        height = 3.2;
        width = height * ratio;
      }
    } else {
      if (ratio >= 1.0) {
        // Landscape or Square (e.g. 3:2, 16:9, 4:3, 1:1)
        width = 2.4;
        height = width / ratio;
        if (height > 2.0) {
          height = 2.0;
          width = height * ratio;
        }
      } else {
        // Portrait (e.g. 2:3, 4:5, 9:16)
        height = 1.95;
        width = height * ratio;
        if (width > 2.4) {
          width = 2.4;
          height = width / ratio;
        }
      }
    }

    const frameBorder = isHero ? 0.12 : 0.08;
    const frameDepth = 0.08;
    const matBorder = isHero ? 0.06 : 0.05;

    // 1. Recreate photo plane geometry
    if (this.photoMesh) {
      this.photoMesh.geometry.dispose();
      this.photoMesh.geometry = new THREE.PlaneGeometry(width, height);
    }

    // 2. Recreate matting plane geometry
    if (this.matMesh) {
      this.matMesh.geometry.dispose();
      this.matMesh.geometry = new THREE.PlaneGeometry(
        width + matBorder * 2,
        height + matBorder * 2
      );
    }

    // 3. Recreate outer frame geometry
    if (this.frameMesh) {
      this.frameMesh.geometry.dispose();
      this.frameMesh.geometry = new THREE.BoxGeometry(
        width + frameBorder * 2,
        height + frameBorder * 2,
        frameDepth
      );
    }

    // 4. Recreate plaque geometry with 4:1 aspect ratio matching the texture
    if (this.plaqueMesh) {
      const plaqueWidth = Math.max(1.8, Math.min(width, 2.4));
      const plaqueHeight = plaqueWidth / 4.0;
      this.plaqueMesh.geometry.dispose();
      this.plaqueMesh.geometry = new THREE.PlaneGeometry(plaqueWidth, plaqueHeight);
      this.plaqueMesh.position.y = -height / 2 - frameBorder - plaqueHeight / 2 - 0.12;
    }
  }

  public updateThemeFrame(frameColor: number): void {
    const isAward = this.artwork.awardTier !== 'Salon Acceptance';
    if (!isAward) {
      if (this.frameMesh && this.frameMesh.material instanceof THREE.MeshStandardMaterial) {
        this.frameMesh.material.color.setHex(frameColor);
      }
    }
  }

  public dispose(): void {
    this.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }
}
