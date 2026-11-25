import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../physics/PhysicsWorld';

export class FPSController {
  camera: THREE.PerspectiveCamera;
  body: CANNON.Body;
  yaw = 0;
  pitch = 0;
  onGround = false;
  keys: Set<string> = new Set();
  speed = 8;
  jumpForce = 10;

  constructor(camera: THREE.PerspectiveCamera, phys: PhysicsWorld) {
    this.camera = camera;

    const shape = new CANNON.Sphere(0.5);
    this.body = new CANNON.Body({
      mass: 70,
      shape,
      position: new CANNON.Vec3(0, 5, 8),
      material: phys.environmentMaterial,
      linearDamping: 0.9, 
      fixedRotation: true,
    });
    phys.world.addBody(this.body);

    window.addEventListener('keydown', e => this.keys.add(e.code));
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement) {
        this.yaw -= e.movementX * 0.0022;
        this.pitch -= e.movementY * 0.0022;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      }
    });
  }

  update(_dt: number) {
    // Force constant downward pull to keep the player anchored
    this.body.applyForce(new CANNON.Vec3(0, -200, 0), this.body.position);

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    
    if (this.keys.has('KeyW')) move.add(forward);
    if (this.keys.has('KeyS')) move.sub(forward);
    if (this.keys.has('KeyD')) move.add(right);
    if (this.keys.has('KeyA')) move.sub(right);

    if (move.lengthSq() > 0) move.normalize();
    
    // Directly set horizontal velocity instead of lerping
    this.body.velocity.x = move.x * this.speed;
    this.body.velocity.z = move.z * this.speed;

    if (this.keys.has('Space') && Math.abs(this.body.velocity.y) < 0.1) {
      this.body.velocity.y = this.jumpForce;
    }

    this.camera.position.set(
      this.body.position.x,
      this.body.position.y + 0.5, 
      this.body.position.z
    );
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }

  getForward(): THREE.Vector3 {
    const f = new THREE.Vector3(0, 0, -1);
    f.applyQuaternion(this.camera.quaternion);
    return f;
  }
}
