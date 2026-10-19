import * as THREE from 'three';
import { ThemeManager } from './ThemeManager';
import { CATEGORY_WINGS, SALON_INFO } from '../../data/salonData';
import { createSignageTexture } from '../../utils/textures';

export class GalleryCorridor extends THREE.Group {
  private themeManager: ThemeManager;
  public length = 188; // Total corridor length in meters
  public width = 12;   // Corridor width (-6m to +6m)
  public height = 6.2; // Ceiling height

  constructor(themeManager: ThemeManager) {
    super();
    this.themeManager = themeManager;
    this.name = 'gallery-corridor';

    this.buildFloor();
    this.buildWalls();
    this.buildCeilingAndSkylights();
    this.buildWingPortals();
    this.buildGrandEntrance();
  }

  private buildFloor(): void {
    const floorGeo = new THREE.PlaneGeometry(this.width, this.length);
    const floorMesh = new THREE.Mesh(floorGeo, this.themeManager.getFloorMaterial());
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, this.length / 2);
    floorMesh.receiveShadow = true;
    this.add(floorMesh);

    // Subtle baseboard trims along left and right walls
    const trimGeo = new THREE.BoxGeometry(0.12, 0.22, this.length);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    
    const leftTrim = new THREE.Mesh(trimGeo, trimMat);
    leftTrim.position.set(-this.width / 2 + 0.06, 0.11, this.length / 2);
    this.add(leftTrim);

    const rightTrim = new THREE.Mesh(trimGeo, trimMat);
    rightTrim.position.set(this.width / 2 - 0.06, 0.11, this.length / 2);
    this.add(rightTrim);
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

    // 3. Foyer Front Wall (Z = 0) with Hero Alcove
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
    const termTex = createSignageTexture('CHAYAKSHA SALON', 'Thank you for visiting. Please sign the guestbook.');
    const termMat = new THREE.MeshBasicMaterial({ map: termTex, transparent: true });
    const termMesh = new THREE.Mesh(termGeo, termMat);
    termMesh.rotation.y = Math.PI;
    termMesh.position.set(0, 3.2, this.length - 0.1);
    this.add(termMesh);
  }

  private buildCeilingAndSkylights(): void {
    const ceilingMat = this.themeManager.getCeilingMaterial();

    // Main ceiling
    const ceilingGeo = new THREE.PlaneGeometry(this.width, this.length);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, this.height, this.length / 2);
    this.add(ceilingMesh);

    // Central architectural recessed skylight / lighting cove
    const lightStripGeo = new THREE.PlaneGeometry(1.6, this.length);
    const lightStripMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    const lightStrip = new THREE.Mesh(lightStripGeo, lightStripMat);
    lightStrip.rotation.x = Math.PI / 2;
    lightStrip.position.set(0, this.height - 0.05, this.length / 2);
    this.add(lightStrip);

    // Soft architectural downlights spaced periodically down the hallway
    for (let z = 10; z < this.length; z += 16) {
      const downLight = new THREE.PointLight(0xfff8eb, 2.5, 14, 1.8);
      downLight.position.set(0, this.height - 0.3, z);
      this.add(downLight);
    }
  }

  private buildWingPortals(): void {
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
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

      // Floating Illuminated Wing Signage Banner
      const signGeo = new THREE.PlaneGeometry(5.4, 1.4);
      const signTex = createSignageTexture(wing.name, wing.description, wing.colorHex);
      const signMat = new THREE.MeshBasicMaterial({
        map: signTex,
        transparent: true,
      });

      // Front facing sign (walking forward +Z)
      const frontSign = new THREE.Mesh(signGeo, signMat);
      frontSign.position.set(0, this.height - 1.0, z - 0.2);
      this.add(frontSign);

      // Back facing sign (walking backward -Z)
      const backSign = new THREE.Mesh(signGeo, signMat);
      backSign.rotation.y = Math.PI;
      backSign.position.set(0, this.height - 1.0, z + 0.2);
      this.add(backSign);
    });
  }

  private buildGrandEntrance(): void {
    // Grand Entrance Arch at Z = 1.0
    const entranceBannerGeo = new THREE.PlaneGeometry(8, 2.2);
    const entranceTex = createSignageTexture(
      'CHAYAKSHA 2026',
      `${SALON_INFO.edition} • Under Patronage of ${SALON_INFO.patronages.fiap} & ${SALON_INFO.patronages.psa}`,
      '#f59e0b'
    );
    const entranceMat = new THREE.MeshBasicMaterial({ map: entranceTex, transparent: true });
    const entranceBanner = new THREE.Mesh(entranceBannerGeo, entranceMat);
    entranceBanner.position.set(0, 4.8, 1.0);
    this.add(entranceBanner);

    // Warm welcoming foyer lights
    const foyerLightL = new THREE.PointLight(0xfbbf24, 6, 12, 1.6);
    foyerLightL.position.set(-3.5, 4.0, 5.0);
    this.add(foyerLightL);

    const foyerLightR = new THREE.PointLight(0xfbbf24, 6, 12, 1.6);
    foyerLightR.position.set(3.5, 4.0, 5.0);
    this.add(foyerLightR);
  }

  public updateMaterials(): void {
    // Traverse and update materials when theme changes
  }
}
