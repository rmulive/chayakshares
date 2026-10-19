import * as THREE from 'three';
import { ThemeManager } from './ThemeManager';
import { CATEGORY_WINGS } from '../../data/salonData';
import { createSignageTexture } from '../../utils/textures';

const textureLoader = new THREE.TextureLoader();

export class GalleryCorridor extends THREE.Group {
  private themeManager: ThemeManager;
  public length = 188; // Total corridor length in meters
  public width = 12;   // Corridor width (-6m to +6m)
  public height = 6.4; // Ceiling height

  constructor(themeManager: ThemeManager) {
    super();
    this.themeManager = themeManager;
    this.name = 'gallery-corridor';

    this.buildFloor();
    this.buildWalls();
    this.buildCeilingAndLouvers();
    this.buildGrandEntranceColonnade();
    // (Benches/chairs completely removed per user request)
    this.buildWingPortals();
    this.buildGrandEntranceLogos();
  }

  private buildFloor(): void {
    const floorGeo = new THREE.PlaneGeometry(this.width, this.length);
    const floorMesh = new THREE.Mesh(floorGeo, this.themeManager.getFloorMaterial());
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, this.length / 2);
    floorMesh.receiveShadow = true;
    this.add(floorMesh);

    // Architectural baseboard trims with recessed LED accent wash
    const trimGeo = new THREE.BoxGeometry(0.14, 0.25, this.length);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });
    
    const leftTrim = new THREE.Mesh(trimGeo, trimMat);
    leftTrim.position.set(-this.width / 2 + 0.07, 0.125, this.length / 2);
    this.add(leftTrim);

    const rightTrim = new THREE.Mesh(trimGeo, trimMat);
    rightTrim.position.set(this.width / 2 - 0.07, 0.125, this.length / 2);
    this.add(rightTrim);

    // Continuous luminous floor cove light strips (warm subtle amber glow)
    const stripGeo = new THREE.PlaneGeometry(0.06, this.length);
    const stripMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.4,
    });

    const leftStrip = new THREE.Mesh(stripGeo, stripMat);
    leftStrip.rotation.x = -Math.PI / 2;
    leftStrip.position.set(-this.width / 2 + 0.14, 0.01, this.length / 2);
    this.add(leftStrip);

    const rightStrip = new THREE.Mesh(stripGeo, stripMat);
    rightStrip.rotation.x = -Math.PI / 2;
    rightStrip.position.set(this.width / 2 - 0.14, 0.01, this.length / 2);
    this.add(rightStrip);
  }

  private buildWalls(): void {
    const wallMat = this.themeManager.getWallMaterial();

    // 1. Left Wall (X = -6)
    const sideWallGeo = new THREE.PlaneGeometry(this.length, this.height);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-this.width / 2, this.height / 2, this.length / 2);
    leftWall.receiveShadow = true;
    this.add(leftWall);

    // 2. Right Wall (X = +6)
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(this.width / 2, this.height / 2, this.length / 2);
    rightWall.receiveShadow = true;
    this.add(rightWall);

    // 3. Foyer Front Wall (Z = 0)
    const endWallGeo = new THREE.PlaneGeometry(this.width, this.height);
    const frontWall = new THREE.Mesh(endWallGeo, wallMat);
    frontWall.position.set(0, this.height / 2, 0);
    this.add(frontWall);

    // 4. Back Terminus Wall (Z = length)
    const backWall = new THREE.Mesh(endWallGeo, wallMat);
    backWall.rotation.y = Math.PI;
    backWall.position.set(0, this.height / 2, this.length);
    this.add(backWall);

    // Terminus signage at the end of the corridor
    const termGeo = new THREE.PlaneGeometry(6, 1.8);
    const termTex = createSignageTexture('CHAYAKSHA 26’', 'Rajapaksa Central College • Radapasa Media Unit');
    const termMat = new THREE.MeshBasicMaterial({ map: termTex, transparent: true, depthWrite: false });
    const termMesh = new THREE.Mesh(termGeo, termMat);
    termMesh.rotation.y = Math.PI;
    termMesh.position.set(0, 3.4, this.length - 0.1);
    this.add(termMesh);
  }

  private buildCeilingAndLouvers(): void {
    const ceilingMat = this.themeManager.getCeilingMaterial();

    // Main ceiling plane
    const ceilingGeo = new THREE.PlaneGeometry(this.width, this.length);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, this.height, this.length / 2);
    this.add(ceilingMesh);

    // Central architectural recessed skylight / lighting cove
    const lightStripGeo = new THREE.PlaneGeometry(1.8, this.length);
    const lightStripMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    const lightStrip = new THREE.Mesh(lightStripGeo, lightStripMat);
    lightStrip.rotation.x = Math.PI / 2;
    lightStrip.position.set(0, this.height - 0.05, this.length / 2);
    this.add(lightStrip);

    // Architectural transverse ceiling cross-beams and downlights
    const beamGeo = new THREE.BoxGeometry(this.width, 0.35, 0.4);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.6,
      metalness: 0.2,
    });

    for (let z = 6; z < this.length; z += 12) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, this.height - 0.18, z);
      this.add(beam);

      // Downlight spot underneath each cross-beam
      const downLight = new THREE.PointLight(0xfff8eb, 1.5, 14, 2.0);
      downLight.position.set(0, this.height - 0.45, z);
      this.add(downLight);
    }
  }

  /**
   * Architectural Colonnade flanking the Grand Entrance Foyer
   */
  private buildGrandEntranceColonnade(): void {
    const colMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.15,
    });

    const colGeo = new THREE.CylinderGeometry(0.35, 0.4, this.height, 24);
    const plinthGeo = new THREE.BoxGeometry(0.9, 0.3, 0.9);

    // Column positions in the Grand Foyer (Z = 6, 12)
    [6, 12].forEach((z) => {
      // Left Colonnade (X = -3.8)
      const leftCol = new THREE.Mesh(colGeo, colMat);
      leftCol.position.set(-3.8, this.height / 2, z);
      leftCol.castShadow = true;
      this.add(leftCol);

      const leftPlinth = new THREE.Mesh(plinthGeo, colMat);
      leftPlinth.position.set(-3.8, 0.15, z);
      this.add(leftPlinth);

      // Right Colonnade (X = +3.8)
      const rightCol = new THREE.Mesh(colGeo, colMat);
      rightCol.position.set(3.8, this.height / 2, z);
      rightCol.castShadow = true;
      this.add(rightCol);

      const rightPlinth = new THREE.Mesh(plinthGeo, colMat);
      rightPlinth.position.set(3.8, 0.15, z);
      this.add(rightPlinth);
    });
  }

  /**
   * Category Portals with Glowing Highlighted Text (No Liquid Glass)
   */
  private buildWingPortals(): void {
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.2,
    });

    CATEGORY_WINGS.forEach((wing, idx) => {
      if (idx === 0) return; // Skip foyer

      const z = wing.zStart;

      // Portal Frame Columns (Left & Right)
      const columnGeo = new THREE.BoxGeometry(0.35, this.height, 0.35);
      const leftCol = new THREE.Mesh(columnGeo, portalMat);
      leftCol.position.set(-this.width / 2 + 0.18, this.height / 2, z);
      this.add(leftCol);

      const rightCol = new THREE.Mesh(columnGeo, portalMat);
      rightCol.position.set(this.width / 2 - 0.18, this.height / 2, z);
      this.add(rightCol);

      // Portal Cross Beam Lintel
      const beamGeo = new THREE.BoxGeometry(this.width, 0.45, 0.35);
      const beam = new THREE.Mesh(beamGeo, portalMat);
      beam.position.set(0, this.height - 0.22, z);
      this.add(beam);

      // Pure Highlighted Glowing Text Signage (NO liquid glass)
      const signGeo = new THREE.PlaneGeometry(6.2, 1.6);
      const signTex = createSignageTexture(wing.name, wing.description, wing.colorHex);
      const signMat = new THREE.MeshBasicMaterial({
        map: signTex,
        transparent: true,
        depthWrite: false,
      });

      // Front facing sign (walking forward +Z)
      const frontSign = new THREE.Mesh(signGeo, signMat);
      frontSign.position.set(0, this.height - 1.1, z - 0.22);
      this.add(frontSign);

      // Back facing sign (walking backward -Z)
      const backSign = new THREE.Mesh(signGeo, signMat);
      backSign.rotation.y = Math.PI;
      backSign.position.set(0, this.height - 1.1, z + 0.22);
      this.add(backSign);
    });
  }

  /**
   * Prominently display the 3 official logos in the 3D exhibition hall:
   * 1. Chayaksha 26' Logo (center)
   * 2. Rajapaksa Central College Crest (left)
   * 3. Radapasa Media Unit Logo (right)
   */
  private buildGrandEntranceLogos(): void {
    // 1. Center Official CHAYAKSHA 26' Logo
    textureLoader.load('/logos/chayaksha_logo.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const logoGeo = new THREE.PlaneGeometry(3.8, 2.2);
      const logoMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      });
      const logoMesh = new THREE.Mesh(logoGeo, logoMat);
      logoMesh.position.set(0, 5.2, 0.22);
      this.add(logoMesh);
    });

    // 2. Left: Rajapaksa Central College Crest
    textureLoader.load('/logos/school_crest.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const crestGeo = new THREE.PlaneGeometry(1.3, 1.3);
      const crestMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      });
      const crestMesh = new THREE.Mesh(crestGeo, crestMat);
      crestMesh.position.set(-3.2, 5.2, 0.22);
      this.add(crestMesh);
    });

    // 3. Right: Radapasa Media Unit Logo
    textureLoader.load('/logos/radapasa_media_unit.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const rccGeo = new THREE.PlaneGeometry(1.3, 1.3);
      const rccMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      });
      const rccMesh = new THREE.Mesh(rccGeo, rccMat);
      rccMesh.position.set(3.2, 5.2, 0.22);
      this.add(rccMesh);
    });

    // Soft architectural illumination for the entrance wall logos
    const logoLight = new THREE.SpotLight(0xfff8eb, 2.8, 12, Math.PI / 4, 0.5, 1.8);
    logoLight.position.set(0, 5.8, 3.5);
    logoLight.target.position.set(0, 5.2, 0.2);
    this.add(logoLight);
    this.add(logoLight.target);
  }
}
