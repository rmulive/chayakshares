import * as THREE from 'three';

/**
 * Atmospheric visual effects:
 * 1. Floating dust motes / particulate specks drifting in gallery spotlights.
 * 2. Volumetric light cones for award spotlights.
 */
export class AtmosphericEffects extends THREE.Group {
  private particles: THREE.Points;
  private particlePositions: Float32Array;
  private particleSpeeds: Float32Array;
  private particleCount = 1200;
  private lightCones: THREE.Mesh[] = [];

  constructor(corridorLength: number = 188, corridorWidth: number = 12, corridorHeight: number = 6.2) {
    super();
    this.name = 'atmospheric-effects';

    // 1. Ambient Floating Dust Motes
    const geo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleSpeeds = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      // Scatter within corridor bounds
      this.particlePositions[i * 3] = (Math.random() - 0.5) * (corridorWidth - 1.5);
      this.particlePositions[i * 3 + 1] = 0.4 + Math.random() * (corridorHeight - 1.0);
      this.particlePositions[i * 3 + 2] = Math.random() * corridorLength;

      // Subtle organic drift speeds
      this.particleSpeeds[i * 3] = (Math.random() - 0.5) * 0.08;     // X drift
      this.particleSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.04; // Y drift
      this.particleSpeeds[i * 3 + 2] = 0.02 + Math.random() * 0.06;  // Z drift forward
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    // Particle sprite texture (soft radial glow)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 240, 200, 1)');
    grad.addColorStop(0.3, 'rgba(245, 180, 80, 0.6)');
    grad.addColorStop(0.7, 'rgba(217, 119, 6, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const pTex = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: pTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75,
      color: 0xffe8b3,
    });

    this.particles = new THREE.Points(geo, mat);
    this.add(this.particles);

    // 2. Volumetric Light Cones for Grand Entrance & Award Pavilion
    this.createVolumetricCones();
  }

  private createVolumetricCones(): void {
    // Volumetric light cone geometry (open-ended cone)
    const coneGeo = new THREE.CylinderGeometry(0.15, 1.4, 4.0, 16, 1, true);
    coneGeo.translate(0, -2.0, 0); // Origin at spotlight source
    coneGeo.rotateX(-Math.PI / 2); // Point forward-downward

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffd57e,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Key spotlight coordinates along the corridor (Hero Wall & Major Awards)
    const spotPositions: [number, number, number, number][] = [
      [0, 5.0, 2.5, 0],              // Hero Wall
      [-5.5, 5.2, 20, Math.PI / 2],  // Award 1
      [5.5, 5.2, 20, -Math.PI / 2],  // Award 2
      [-5.5, 5.2, 28, Math.PI / 2],  // Award 3
      [5.5, 5.2, 28, -Math.PI / 2],  // Award 4
      [-5.5, 5.2, 36, Math.PI / 2],  // Award 5
      [5.5, 5.2, 36, -Math.PI / 2],  // Award 6
    ];

    spotPositions.forEach(([x, y, z, rotY]) => {
      const cone = new THREE.Mesh(coneGeo, coneMat.clone());
      cone.position.set(x, y, z);
      cone.rotation.y = rotY;
      cone.rotation.x = Math.PI / 4; // Angle down towards wall
      this.add(cone);
      this.lightCones.push(cone);
    });
  }

  public update(delta: number): void {
    // Animate dust particles
    const positions = this.particlePositions;
    const speeds = this.particleSpeeds;
    const count = this.particleCount;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += speeds[i3] * delta * 2;
      positions[i3 + 1] += speeds[i3 + 1] * delta * 2;
      positions[i3 + 2] += speeds[i3 + 2] * delta * 2;

      // Wrap around corridor bounds
      if (positions[i3] < -5.5) positions[i3] = 5.5;
      if (positions[i3] > 5.5) positions[i3] = -5.5;
      if (positions[i3 + 1] < 0.2) positions[i3 + 1] = 5.8;
      if (positions[i3 + 1] > 5.8) positions[i3 + 1] = 0.2;
      if (positions[i3 + 2] > 186) positions[i3 + 2] = 2;
      if (positions[i3 + 2] < 2) positions[i3 + 2] = 186;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    // Subtle breathing pulse for volumetric light cones
    const time = performance.now() * 0.0015;
    this.lightCones.forEach((cone, idx) => {
      const mat = cone.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.10 + Math.sin(time + idx * 0.8) * 0.035;
    });
  }
}
