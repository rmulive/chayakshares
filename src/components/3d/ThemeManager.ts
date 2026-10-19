import * as THREE from 'three';
import type { GalleryTheme } from '../../types/exhibition';
import { getFloorTexture, getWallTexture } from '../../utils/textures';

export interface ThemeConfig {
  ambientColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  spotlightGoldColor: number;
  spotlightNeutralColor: number;
  wallRoughness: number;
  wallMetalness: number;
  floorRoughness: number;
  floorMetalness: number;
  frameColor: number;
}

export const THEME_CONFIGS: Record<GalleryTheme, ThemeConfig> = {
  'minimalist-alabaster': {
    ambientColor: 0xffffff,
    ambientIntensity: 0.9,
    sunColor: 0xf8fafc,
    sunIntensity: 0.65,
    fogColor: 0xf1f5f9,
    fogNear: 25,
    fogFar: 85,
    spotlightGoldColor: 0xfbbf24,
    spotlightNeutralColor: 0xffffff,
    wallRoughness: 0.85,
    wallMetalness: 0.05,
    floorRoughness: 0.15,
    floorMetalness: 0.1,
    frameColor: 0x1e293b, // Crisp matte charcoal frame
  },
  'dark-noir': {
    ambientColor: 0x24283b,
    ambientIntensity: 0.45,
    sunColor: 0xffedd5,
    sunIntensity: 0.35,
    fogColor: 0x090a0f,
    fogNear: 18,
    fogFar: 65,
    spotlightGoldColor: 0xffd166,
    spotlightNeutralColor: 0xe0e7ff,
    wallRoughness: 0.9,
    wallMetalness: 0.05,
    floorRoughness: 0.4,
    floorMetalness: 0.25,
    frameColor: 0xd4af37, // Rich brushed gold frame
  },
  'warm-travertine': {
    ambientColor: 0xfff7ed,
    ambientIntensity: 0.85,
    sunColor: 0xfef08a,
    sunIntensity: 0.7,
    fogColor: 0xeae2cf,
    fogNear: 22,
    fogFar: 75,
    spotlightGoldColor: 0xf59e0b,
    spotlightNeutralColor: 0xfef3c7,
    wallRoughness: 0.8,
    wallMetalness: 0.05,
    floorRoughness: 0.3,
    floorMetalness: 0.1,
    frameColor: 0x451a03, // Warm dark walnut frame
  },
  'brutalist-concrete': {
    ambientColor: 0xdbeafe,
    ambientIntensity: 0.75,
    sunColor: 0xffffff,
    sunIntensity: 0.6,
    fogColor: 0x475569,
    fogNear: 20,
    fogFar: 75,
    spotlightGoldColor: 0xfbbf24,
    spotlightNeutralColor: 0xf1f5f9,
    wallRoughness: 0.95,
    wallMetalness: 0.15,
    floorRoughness: 0.2,
    floorMetalness: 0.3,
    frameColor: 0x09090b, // Industrial matte black steel frame
  },
};

export class ThemeManager {
  private currentTheme: GalleryTheme;
  private wallMaterial: THREE.MeshStandardMaterial;
  private floorMaterial: THREE.MeshStandardMaterial;
  private ceilingMaterial: THREE.MeshStandardMaterial;

  constructor(initialTheme: GalleryTheme = 'minimalist-alabaster') {
    this.currentTheme = initialTheme;

    const wallTex = getWallTexture(initialTheme);
    const floorTex = getFloorTexture(initialTheme);
    const cfg = THEME_CONFIGS[initialTheme];

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: cfg.wallRoughness,
      metalness: cfg.wallMetalness,
    });

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: cfg.floorRoughness,
      metalness: cfg.floorMetalness,
    });

    this.ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.1,
    });
  }

  public applyTheme(
    theme: GalleryTheme,
    scene: THREE.Scene,
    ambientLight: THREE.AmbientLight,
    dirLight: THREE.DirectionalLight
  ): void {
    this.currentTheme = theme;
    const cfg = THEME_CONFIGS[theme];

    // Update textures
    this.wallMaterial.map = getWallTexture(theme);
    this.wallMaterial.roughness = cfg.wallRoughness;
    this.wallMaterial.metalness = cfg.wallMetalness;
    this.wallMaterial.needsUpdate = true;

    this.floorMaterial.map = getFloorTexture(theme);
    this.floorMaterial.roughness = cfg.floorRoughness;
    this.floorMaterial.metalness = cfg.floorMetalness;
    this.floorMaterial.needsUpdate = true;

    // Update lighting
    ambientLight.color.setHex(cfg.ambientColor);
    ambientLight.intensity = cfg.ambientIntensity;

    dirLight.color.setHex(cfg.sunColor);
    dirLight.intensity = cfg.sunIntensity;

    // Update fog
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      scene.fog.color.setHex(cfg.fogColor);
      scene.fog.near = cfg.fogNear;
      scene.fog.far = cfg.fogFar;
    }
    scene.background = new THREE.Color(cfg.fogColor);
  }

  public getWallMaterial(): THREE.MeshStandardMaterial {
    return this.wallMaterial;
  }

  public getFloorMaterial(): THREE.MeshStandardMaterial {
    return this.floorMaterial;
  }

  public getCeilingMaterial(): THREE.MeshStandardMaterial {
    return this.ceilingMaterial;
  }

  public getConfig(): ThemeConfig {
    return THEME_CONFIGS[this.currentTheme];
  }
}
