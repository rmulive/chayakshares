import * as THREE from 'three';
import { exhibitionStore } from '../../store/exhibitionStore';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  // Kinematics & Euler angles
  public pitch = 0; // vertical look
  public yaw = 0;   // horizontal look (yaw 0 looks down +Z)
  private keysPressed: Record<string, boolean> = {};

  // Boundaries of the architectural corridor
  private minX = -4.6;
  private maxX = 4.6;
  private minZ = 1.2;
  private maxZ = 180.0;

  // Mouse interaction state
  private isPointerLocked = false;
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Mobile virtual joystick input
  public virtualJoystick = { x: 0, y: 0 };
  public isMobileLooking = false;
  public lastTouchLookX = 0;
  public lastTouchLookY = 0;

  // Teleportation / Camera Glide State
  private isGliding = false;
  private glideTargetPos = new THREE.Vector3();
  private glideTargetLookAt = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Initial camera position in the Grand Foyer
    this.camera.position.set(0, 1.7, 4.5);
    this.yaw = 0; // Face forward (+Z direction)
    this.pitch = 0;

    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    // Touch events for mobile
    this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);

    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Ignore keys if typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    this.keysPressed[e.code] = true;
    if (this.isGliding) this.isGliding = false; // Interrupt glide on manual move
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
      this.rotateView(movementX * 0.0022, movementY * 0.0022);
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
      // If touch is on right half of screen, treat as camera rotation
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
    this.yaw -= deltaYaw;
    this.pitch -= deltaPitch;
    // Clamp pitch between -75 deg and +75 deg
    const maxPitch = (Math.PI / 180) * 75;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public glideTo(
    targetPos: { x: number; y: number; z: number },
    targetLook?: { x: number; y: number; z: number }
  ): void {
    this.isGliding = true;
    this.glideTargetPos.set(targetPos.x, targetPos.y || 1.7, targetPos.z);

    if (targetLook) {
      this.glideTargetLookAt.set(targetLook.x, 2.3, targetLook.z);
    } else {
      // Default look down the hallway
      this.glideTargetLookAt.set(targetPos.x, 1.7, targetPos.z + 10);
    }
  }

  public update(delta: number): void {
    // 1. Check if store requested a teleport or glide
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

    // 2. Camera Glide Interpolation
    if (this.isGliding) {
      const posLerp = 1 - Math.exp(-delta * 4.5);
      this.camera.position.lerp(this.glideTargetPos, posLerp);

      // Compute target yaw and pitch to face the look-at point
      const dir = new THREE.Vector3().subVectors(this.glideTargetLookAt, this.camera.position).normalize();
      const targetYaw = Math.atan2(dir.x, dir.z);
      const targetPitch = Math.asin(dir.y);

      // Smoothly rotate yaw and pitch
      this.yaw = THREE.MathUtils.lerp(this.yaw, targetYaw, posLerp);
      this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, posLerp);

      // Check distance for completion
      if (this.camera.position.distanceTo(this.glideTargetPos) < 0.05) {
        this.camera.position.copy(this.glideTargetPos);
        this.isGliding = false;
      }
    } else {
      // 3. User Locomotion (Desktop WASD + Mobile Virtual Joystick)
      const moveSpeed = (this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight']) ? 9.0 : 4.5;
      const moveVector = new THREE.Vector3();

      if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) moveVector.z += 1;
      if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) moveVector.z -= 1;
      if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) moveVector.x -= 1;
      if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) moveVector.x += 1;

      // Add mobile joystick input
      if (Math.abs(this.virtualJoystick.x) > 0.05 || Math.abs(this.virtualJoystick.y) > 0.05) {
        moveVector.x += this.virtualJoystick.x;
        moveVector.z -= this.virtualJoystick.y; // forward is negative joystick Y
      }

      if (moveVector.lengthSq() > 0) {
        moveVector.normalize();

        // Translate movement along camera's horizontal heading (yaw)
        const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        const displacement = new THREE.Vector3()
          .addScaledVector(forward, moveVector.z)
          .addScaledVector(right, moveVector.x)
          .multiplyScalar(moveSpeed * delta);

        this.camera.position.add(displacement);
      }
    }

    // 4. Enforce Corridor Boundaries
    this.camera.position.x = Math.max(this.minX, Math.min(this.maxX, this.camera.position.x));
    this.camera.position.z = Math.max(this.minZ, Math.min(this.maxZ, this.camera.position.z));
    this.camera.position.y = 1.7; // Constant museum eye-height

    // 5. Apply Camera Rotation
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 6. Broadcast position to store
    exhibitionStore.updateCameraPosition(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );
  }
}
