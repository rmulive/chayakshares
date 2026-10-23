import * as THREE from 'three';
import { CameraController } from './CameraController';
import { ThemeManager } from './ThemeManager';
import { GalleryCorridor } from './GalleryCorridor';
import { ArtworkMesh } from './ArtworkMesh';
import type { Artwork, GalleryTheme } from '../../types/exhibition';
import { exhibitionStore } from '../../store/exhibitionStore';

export class GalleryScene {
  private container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public controller: CameraController;
  public themeManager: ThemeManager;
  public corridor: GalleryCorridor;

  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private artworkMeshes: Map<string, ArtworkMesh> = new Map();
  private interactiveMeshes: THREE.Object3D[] = [];

  // Raycasting for mouse and center reticle interactions
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private mouseDownX = 0;
  private mouseDownY = 0;
  public isHoveringArtwork = false;
  public focusedArtwork: Artwork | null = null;

  private animFrameId: number | null = null;
  private lastTime = performance.now();

  constructor(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Fog
    this.scene = new THREE.Scene();
    const initialTheme = exhibitionStore.getState().theme;
    this.themeManager = new ThemeManager(initialTheme);
    const themeCfg = this.themeManager.getConfig();

    this.scene.background = new THREE.Color(themeCfg.fogColor);
    this.scene.fog = new THREE.Fog(themeCfg.fogColor, themeCfg.fogNear, themeCfg.fogFar);

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 130);

    // 4. Lighting
    this.ambientLight = new THREE.AmbientLight(themeCfg.ambientColor, themeCfg.ambientIntensity);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(themeCfg.sunColor, themeCfg.sunIntensity);
    this.dirLight.position.set(0, 10, 20);
    this.scene.add(this.dirLight);

    // 5. Corridor Geometry
    this.corridor = new GalleryCorridor(this.themeManager);
    this.scene.add(this.corridor);

    // 6. Camera Controller
    this.controller = new CameraController(this.camera, this.renderer.domElement);

    // 8. Load Artworks
    this.syncArtworks(exhibitionStore.getState().artworks);

    // 9. Event Listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onGlobalKeyDown);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.renderer.domElement.addEventListener('mousemove', this.onPointerMove);

    // Start render loop
    this.animate();
  }

  public syncArtworks(artworks: Artwork[]): void {
    // Remove old artwork meshes
    this.artworkMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.dispose();
    });
    this.artworkMeshes.clear();
    this.interactiveMeshes = [];

    // Add new meshes
    const frameColor = this.themeManager.getConfig().frameColor;
    artworks.forEach(artwork => {
      const artMesh = new ArtworkMesh(artwork, frameColor);
      this.scene.add(artMesh);
      this.artworkMeshes.set(artwork.id, artMesh);
      this.interactiveMeshes.push(...artMesh.interactiveObjects);
    });
  }

  public applyTheme(theme: GalleryTheme): void {
    this.themeManager.applyTheme(theme, this.scene, this.ambientLight, this.dirLight);
    const frameColor = this.themeManager.getConfig().frameColor;
    this.artworkMeshes.forEach(mesh => mesh.updateThemeFrame(frameColor));
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onGlobalKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyE' && this.focusedArtwork) {
      exhibitionStore.setActiveArtwork(this.focusedArtwork, false);
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    this.mouseDownX = e.clientX;
    this.mouseDownY = e.clientY;
  };

  private onPointerMove = (e: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast check for hover cursor
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);

    if (intersects.length > 0 && intersects[0].distance < 20) {
      const hit = intersects[0].object;
      if (hit.userData?.isArtwork && hit.userData.artwork) {
        this.focusedArtwork = hit.userData.artwork as Artwork;
      }
      if (!this.isHoveringArtwork) {
        this.isHoveringArtwork = true;
        this.renderer.domElement.style.cursor = 'pointer';
      }
    } else {
      this.focusedArtwork = null;
      if (this.isHoveringArtwork) {
        this.isHoveringArtwork = false;
        this.renderer.domElement.style.cursor = 'default';
      }
    }
  };

  private onClick = (e: MouseEvent) => {
    // If mouse was dragged more than 6px, treat as camera pan, NOT an artwork click
    const dist = Math.hypot(e.clientX - this.mouseDownX, e.clientY - this.mouseDownY);
    if (dist > 6) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);

    if (intersects.length > 0 && intersects[0].distance < 25) {
      const hit = intersects[0].object;
      if (hit.userData?.isArtwork && hit.userData.artwork) {
        const artwork = hit.userData.artwork as Artwork;
        // Open Archival Deep Zoom & Inspection window!
        exhibitionStore.setActiveArtwork(artwork, false);
      }
    }
  };

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Update camera motion & head bobbing
    if (this.controller) {
      this.controller.update(delta);
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onGlobalKeyDown);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.domElement.removeEventListener('mousemove', this.onPointerMove);
    this.controller.dispose();

    this.artworkMeshes.forEach(mesh => mesh.dispose());
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
