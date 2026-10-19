import * as THREE from 'three';
import { exhibitionStore } from '../../store/exhibitionStore';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  // Angles & Kinematics
  public pitch = 0; // vertical look
  public yaw = 0;   // horizontal look (yaw 0 looks down +Z)
  private currentVelocity = new THREE.Vector3();
  private keysPressed: Record<string, boolean> = {};

  // Head bobbing & natural walking motion
  private walkCycle = 0;
  private defaultEyeHeight = 1.7;
  private targetFOV = 65;
  private defaultFOV = 65;
  private sprintFOV = 74;

  // Corridor physical boundaries
  private minX = -4.6;
  private maxX = 4.6;
  private minZ = 1.2;
  private maxZ = 180.0;

  // Pointer Lock & Drag
  public isPointerLocked = false;
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Mobile virtual joystick input
  public virtualJoystick = { x: 0, y: 0 };
  public isMobileLooking = false;
  public lastTouchLookX = 0;
  public lastTouchLookY = 0;

  // Teleportation / Camera Glide
  private isGliding = false;
  private glideTargetPos = new THREE.Vector3();
  private glideTargetLookAt = new THREE.Vector3();

  // Cinematic Guided Auto-Tour Mode
  public isCinematicTour = false;
  private tourWaypoints: { pos: THREE.Vector3; look: THREE.Vector3; duration: number }[] = [];
  private currentWaypointIdx = 0;
  private waypointProgress = 0;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Initial spawn in Grand Foyer
    this.camera.position.set(0, this.defaultEyeHeight, 4.5);
    this.yaw = 0;
    this.pitch = 0;

    this.initCinematicWaypoints();
    this.bindEvents();
  }

  private initCinematicWaypoints(): void {
    this.tourWaypoints = [
      { pos: new THREE.Vector3(0, 1.7, 4.5), look: new THREE.Vector3(0, 2.5, 3.5), duration: 5 },       // Hero Wall
      { pos: new THREE.Vector3(-3.2, 1.7, 20), look: new THREE.Vector3(-5.9, 2.3, 20), duration: 6 },   // FIAP Gold
      { pos: new THREE.Vector3(3.2, 1.7, 20), look: new THREE.Vector3(5.9, 2.3, 20), duration: 6 },     // PSA Gold
      { pos: new THREE.Vector3(0, 1.7, 28), look: new THREE.Vector3(0, 2.0, 50), duration: 4 },          // Award Pavilion Walk
      { pos: new THREE.Vector3(-3.2, 1.7, 36), look: new THREE.Vector3(-5.9, 2.3, 36), duration: 6 },   // Bengal Tiger Best of Show
      { pos: new THREE.Vector3(0, 1.7, 56), look: new THREE.Vector3(-5.9, 2.3, 50), duration: 5 },      // Monochrome Wing
      { pos: new THREE.Vector3(0, 1.7, 84), look: new THREE.Vector3(5.9, 2.3, 78), duration: 5 },       // Nature Wing
      { pos: new THREE.Vector3(0, 1.7, 112), look: new THREE.Vector3(-5.9, 2.3, 106), duration: 5 },    // Street Wing
      { pos: new THREE.Vector3(0, 1.7, 140), look: new THREE.Vector3(5.9, 2.3, 134), duration: 5 },    // Architecture Wing
      { pos: new THREE.Vector3(0, 1.7, 168), look: new THREE.Vector3(0, 2.0, 184), duration: 5 },       // Creative Wing & Terminus
    ];
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.domElement.addEventListener('click', this.onCanvasClick);
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    // Touch events for mobile
    this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    this.domElement.removeEventListener('click', this.onCanvasClick);
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);

    document.removeEventListener('pointerlockchange', this.onPointerLockChange);

    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
  }

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  };

  private onCanvasClick = () => {
    // Only lock pointer if no modal is active and not inspecting
    const state = exhibitionStore.getState();
    if (!state.activeModal && !state.activeArtwork && !this.isPointerLocked) {
      this.domElement.requestPointerLock?.();
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    this.keysPressed[e.code] = true;
    if (this.isGliding) this.isGliding = false;
    if (this.isCinematicTour) this.stopCinematicTour();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.isPointerLocked) {
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;
      this.rotateView(movementX * 0.002, movementY * 0.002);
    } else if (this.isMouseDown) {
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.rotateView(deltaX * 0.003, deltaY * 0.003);
    }
  };

  private onMouseUp = () => {
    this.isMouseDown = false;
  };

  private onTouchStart = (e: TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.clientX > window.innerWidth / 2) {
        this.isMobileLooking = true;
        this.lastTouchLookX = touch.clientX;
        this.lastTouchLookY = touch.clientY;
      }
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (this.isMobileLooking && touch.clientX > window.innerWidth / 3) {
        const deltaX = touch.clientX - this.lastTouchLookX;
        const deltaY = touch.clientY - this.lastTouchLookY;
        this.lastTouchLookX = touch.clientX;
        this.lastTouchLookY = touch.clientY;
        this.rotateView(deltaX * 0.004, deltaY * 0.004);
      }
    }
  };

  private onTouchEnd = () => {
    this.isMobileLooking = false;
  };

  public rotateView(deltaYaw: number, deltaPitch: number): void {
    if (this.isGliding) this.isGliding = false;
    if (this.isCinematicTour) this.stopCinematicTour();

    this.yaw -= deltaYaw;
    this.pitch -= deltaPitch;
    const maxPitch = (Math.PI / 180) * 75;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public glideTo(
    targetPos: { x: number; y: number; z: number },
    targetLook?: { x: number; y: number; z: number }
  ): void {
    this.isGliding = true;
    this.isCinematicTour = false;
    this.glideTargetPos.set(targetPos.x, targetPos.y || this.defaultEyeHeight, targetPos.z);

    if (targetLook) {
      this.glideTargetLookAt.set(targetLook.x, 2.3, targetLook.z);
    } else {
      this.glideTargetLookAt.set(targetPos.x, this.defaultEyeHeight, targetPos.z + 10);
    }
  }

  public startCinematicTour(): void {
    this.isCinematicTour = true;
    this.isGliding = false;
    this.currentWaypointIdx = 0;
    this.waypointProgress = 0;
  }

  public stopCinematicTour(): void {
    this.isCinematicTour = false;
  }

  public update(delta: number): void {
    // 1. Check store teleport requests
    const teleportTarget = exhibitionStore.getState().teleportTarget;
    if (teleportTarget) {
      this.glideTo(
        { x: teleportTarget.x, y: teleportTarget.y, z: teleportTarget.z },
        teleportTarget.targetX !== undefined && teleportTarget.targetZ !== undefined
          ? { x: teleportTarget.targetX, y: 2.3, z: teleportTarget.targetZ }
          : undefined
      );
      exhibitionStore.clearTeleport();
    }

    // 2. Cinematic Tour Mode
    if (this.isCinematicTour && this.tourWaypoints.length > 0) {
      const wp = this.tourWaypoints[this.currentWaypointIdx];
      this.waypointProgress += delta / wp.duration;

      const lerpAlpha = 1 - Math.exp(-delta * 3.0);
      this.camera.position.lerp(wp.pos, lerpAlpha);

      const lookDir = new THREE.Vector3().subVectors(wp.look, this.camera.position).normalize();
      const targetYaw = Math.atan2(lookDir.x, lookDir.z);
      const targetPitch = Math.asin(lookDir.y);

      this.yaw = THREE.MathUtils.lerp(this.yaw, targetYaw, lerpAlpha);
      this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, lerpAlpha);

      if (this.waypointProgress >= 1.0) {
        this.waypointProgress = 0;
        this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.tourWaypoints.length;
      }
    } else if (this.isGliding) {
      // 3. Camera Glide Interpolation
      const posLerp = 1 - Math.exp(-delta * 4.5);
      this.camera.position.lerp(this.glideTargetPos, posLerp);

      const dir = new THREE.Vector3().subVectors(this.glideTargetLookAt, this.camera.position).normalize();
      const targetYaw = Math.atan2(dir.x, dir.z);
      const targetPitch = Math.asin(dir.y);

      this.yaw = THREE.MathUtils.lerp(this.yaw, targetYaw, posLerp);
      this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, posLerp);

      if (this.camera.position.distanceTo(this.glideTargetPos) < 0.05) {
        this.camera.position.copy(this.glideTargetPos);
        this.isGliding = false;
      }
    } else {
      // 4. Locomotion Physics with Inertia & Head Bobbing
      const isSprinting = this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight'];
      const maxSpeed = isSprinting ? 8.5 : 4.5;
      const targetMove = new THREE.Vector3();

      if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) targetMove.z += 1;
      if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) targetMove.z -= 1;
      if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) targetMove.x -= 1;
      if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) targetMove.x += 1;

      // Add mobile virtual joystick
      if (Math.abs(this.virtualJoystick.x) > 0.05 || Math.abs(this.virtualJoystick.y) > 0.05) {
        targetMove.x += this.virtualJoystick.x;
        targetMove.z -= this.virtualJoystick.y;
      }

      const isMoving = targetMove.lengthSq() > 0.01;
      if (isMoving) {
        targetMove.normalize();
      }

      // Smooth inertia acceleration & deceleration
      const accelRate = isMoving ? 10.0 : 8.0;
      this.currentVelocity.lerp(targetMove.multiplyScalar(maxSpeed), 1 - Math.exp(-delta * accelRate));

      if (this.currentVelocity.lengthSq() > 0.001) {
        const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        const displacement = new THREE.Vector3()
          .addScaledVector(forward, this.currentVelocity.z)
          .addScaledVector(right, this.currentVelocity.x)
          .multiplyScalar(delta);

        this.camera.position.add(displacement);

        // Head Bobbing calculation
        const speedRatio = this.currentVelocity.length() / maxSpeed;
        const bobFrequency = isSprinting ? 12.0 : 8.0;
        this.walkCycle += delta * bobFrequency * speedRatio;

        const bobY = Math.sin(this.walkCycle) * (isSprinting ? 0.045 : 0.025);
        this.camera.position.y = this.defaultEyeHeight + bobY;
      } else {
        // Return gracefully to default eye height
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.defaultEyeHeight, 1 - Math.exp(-delta * 6));
      }

      // Dynamic FOV adjustment on sprint
      this.targetFOV = isSprinting && isMoving ? this.sprintFOV : this.defaultFOV;
      if (Math.abs(this.camera.fov - this.targetFOV) > 0.1) {
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFOV, 1 - Math.exp(-delta * 5));
        this.camera.updateProjectionMatrix();
      }
    }

    // 5. Corridor Collision Bounds
    this.camera.position.x = Math.max(this.minX, Math.min(this.maxX, this.camera.position.x));
    this.camera.position.z = Math.max(this.minZ, Math.min(this.maxZ, this.camera.position.z));

    // 6. Apply Rotation
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 7. Update Store
    exhibitionStore.updateCameraPosition(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );
  }
}
