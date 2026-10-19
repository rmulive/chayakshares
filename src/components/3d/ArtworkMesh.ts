import * as THREE from 'three';
import type { Artwork } from '../../types/exhibition';
import { createPlaqueTexture } from '../../utils/textures';

const textureLoader = new THREE.TextureLoader();
// Cache textures
const loadedTextures = new Map<string, THREE.Texture>();

export class ArtworkMesh extends THREE.Group {
  public artwork: Artwork;
  public photoMesh: THREE.Mesh;
  public frameMesh: THREE.Mesh;
  public matMesh: THREE.Mesh;
  public plaqueMesh: THREE.Mesh;
  public spotLight: THREE.SpotLight;
  public interactiveObjects: THREE.Object3D[] = [];

  constructor(artwork: Artwork, frameColor: number = 0x1e293b) {
    super();
    this.artwork = artwork;
    this.name = `artwork-${artwork.id}`;

    const isAward = artwork.awardTier !== 'Salon Acceptance';
    const isHero = !!artwork.isHero;

    // Initial size dimensions based on ratio
    const initialRatio = artwork.aspectRatio || 1.5;
    let photoWidth = 2.4;
    let photoHeight = photoWidth / initialRatio;
    if (isHero) {
      photoWidth = 5.2;
      photoHeight = Math.min(photoWidth / initialRatio, 3.2);
    } else if (initialRatio < 0.85) {
      photoHeight = 1.95;
      photoWidth = photoHeight * initialRatio;
    }

    const frameBorder = isHero ? 0.12 : 0.08;
    const frameDepth = 0.08;

    // --- 1. Frame Mesh ---
    const frameGeo = new THREE.BoxGeometry(
      photoWidth + frameBorder * 2,
      photoHeight + frameBorder * 2,
      frameDepth
    );
    const frameMat = new THREE.MeshStandardMaterial({
      color: isAward ? 0xd4af37 : frameColor, // Gold frame for awards, sleek theme frame for acceptance
      metalness: isAward ? 0.8 : 0.2,
      roughness: isAward ? 0.25 : 0.7,
    });
    this.frameMesh = new THREE.Mesh(frameGeo, frameMat);
    this.frameMesh.position.z = -frameDepth / 2;
    this.frameMesh.castShadow = true;
    this.add(this.frameMesh);

    // --- 2. Inner Museum Matting (Passe-partout) ---
    const matBorder = isHero ? 0.06 : 0.05;
    const matGeo = new THREE.PlaneGeometry(
      photoWidth + matBorder * 2,
      photoHeight + matBorder * 2
    );
    const matMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdfbf7,
      roughness: 0.95,
      metalness: 0.0,
    });
    this.matMesh = new THREE.Mesh(matGeo, matMaterial);
    this.matMesh.position.z = 0.005;
    this.add(this.matMesh);

    // --- 3. Photograph Canvas Plane ---
    const photoGeo = new THREE.PlaneGeometry(photoWidth, photoHeight);
    
    // Default placeholder material while texture loads
    const photoMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.2,
      metalness: 0.05,
    });

    this.photoMesh = new THREE.Mesh(photoGeo, photoMat);
    this.photoMesh.position.z = 0.012;
    this.photoMesh.userData = { isArtwork: true, artworkId: artwork.id, artwork };
    this.interactiveObjects.push(this.photoMesh);
    this.add(this.photoMesh);

    // Load actual high-resolution texture
    if (loadedTextures.has(artwork.imageUrl)) {
      const tex = loadedTextures.get(artwork.imageUrl)!;
      photoMat.map = tex;
      photoMat.color.setHex(0xffffff);
      photoMat.needsUpdate = true;
      const img = tex.image as HTMLImageElement | undefined;
      if (img && img.width && img.height) {
        this.updateFrameRatio(img.width / img.height);
      }
    } else {
      textureLoader.load(
        artwork.imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTextures.set(artwork.imageUrl, tex);
          photoMat.map = tex;
          photoMat.color.setHex(0xffffff);
          photoMat.needsUpdate = true;
          const img = tex.image as HTMLImageElement | undefined;
          if (img && img.width && img.height) {
            this.updateFrameRatio(img.width / img.height);
          }
        },
        undefined,
        (err) => {
          console.warn('Failed to load image texture for artwork:', artwork.title, err);
        }
      );
    }

    // --- 4. Museum Plaque underneath with Photo Title, Name, Place, School (No camera data) ---
    const plaqueWidth = Math.max(Math.min(photoWidth * 0.96, 2.5), 1.95);
    const plaqueHeight = 0.58;
    const plaqueGeo = new THREE.PlaneGeometry(plaqueWidth, plaqueHeight);
    const plaqueTex = createPlaqueTexture(
      artwork.title,
      artwork.photographer,
      artwork.awardTier,
      isAward,
      artwork.place,
      artwork.school
    );
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      metalness: isAward ? 0.75 : 0.2,
      roughness: isAward ? 0.25 : 0.8,
    });
    this.plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    this.plaqueMesh.position.y = -photoHeight / 2 - frameBorder - plaqueHeight / 2 - 0.12;
    this.plaqueMesh.position.z = 0.01;
    this.plaqueMesh.userData = { isArtwork: true, artworkId: artwork.id, artwork };
    this.interactiveObjects.push(this.plaqueMesh);
    this.add(this.plaqueMesh);

    // --- 5. Dedicated Ceiling Spotlight with Dynamic Award Colors (Gold, Silver, Bronze, White) ---
    const awardLower = `${artwork.place || ''} ${artwork.awardTier || ''}`.toLowerCase();
    let spotlightColor = 0xffffff;
    let spotlightIntensity = 2.4;
    let spotAngle = Math.PI / 4.4;

    if (awardLower.includes('gold') || awardLower.includes('best of show') || awardLower.includes('1st')) {
      // Radiant 24K Pure Gold Spotlight
      spotlightColor = 0xffd700;
      spotlightIntensity = isHero ? 5.5 : 4.6;
      spotAngle = Math.PI / 3.8;
    } else if (awardLower.includes('silver') || awardLower.includes('2nd')) {
      // Polished Platinum Silver Spotlight
      spotlightColor = 0xe0e7ff;
      spotlightIntensity = 4.0;
    } else if (awardLower.includes('bronze') || awardLower.includes('3rd')) {
      // Warm Amber Bronze Spotlight
      spotlightColor = 0xf59e0b;
      spotlightIntensity = 3.8;
    } else if (awardLower.includes('ribbon') || awardLower.includes('honorable')) {
      // Warm Champagne Amber
      spotlightColor = 0xfef08a;
      spotlightIntensity = 3.2;
    }

    this.spotLight = new THREE.SpotLight(spotlightColor, spotlightIntensity);
    this.spotLight.angle = spotAngle;
    this.spotLight.penumbra = 0.45;
    this.spotLight.decay = 1.6;
    this.spotLight.distance = 8.5;

    // Position spotlight above and slightly out from the wall
    this.spotLight.position.set(0, 1.8, 1.2);
    this.spotLight.target = this.photoMesh;
    this.add(this.spotLight);
    this.add(this.spotLight.target);

    // Position the whole artwork in the 3D world
    if (artwork.position) {
      this.position.set(artwork.position[0], artwork.position[1], artwork.position[2]);
    }
    if (artwork.rotationY !== undefined) {
      this.rotation.y = artwork.rotationY;
    }
  }

  /**
   * Dynamically adjusts the 3D photo, matting, frame, and plaque position
   * to strictly match the photograph's natural aspect ratio (landscape, portrait, square, etc.)
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
        height = Math.min(width / ratio, 3.2);
      } else {
        height = 3.2;
        width = height * ratio;
      }
    } else {
      if (ratio >= 1.2) {
        // Landscape (e.g. 3:2, 16:9, panoramic)
        width = 2.4;
        height = width / ratio;
      } else if (ratio < 0.85) {
        // Portrait (e.g. 2:3, 4:5)
        height = 1.95;
        width = height * ratio;
      } else {
        // Square or standard near-square (1:1, 4:3)
        width = 2.0;
        height = width / ratio;
      }
    }

    const frameBorder = isHero ? 0.12 : 0.08;
    const frameDepth = 0.08;
    const matBorder = isHero ? 0.06 : 0.05;
    const plaqueHeight = 0.58;

    // Recreate geometries
    if (this.photoMesh) {
      this.photoMesh.geometry.dispose();
      this.photoMesh.geometry = new THREE.PlaneGeometry(width, height);
    }

    if (this.matMesh) {
      this.matMesh.geometry.dispose();
      this.matMesh.geometry = new THREE.PlaneGeometry(width + matBorder * 2, height + matBorder * 2);
    }

    if (this.frameMesh) {
      this.frameMesh.geometry.dispose();
      this.frameMesh.geometry = new THREE.BoxGeometry(
        width + frameBorder * 2,
        height + frameBorder * 2,
        frameDepth
      );
    }

    if (this.plaqueMesh) {
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
