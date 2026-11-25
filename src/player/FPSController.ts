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
  eyeHeight = 1.65;

  constructor(camera: THREE.PerspectiveCamera, phys: PhysicsWorld) {
    this.camera = camera;

    const shape = new CANNON.Sphere(0.4);
    this.body = new CANNON.Body({
      mass: 70,
      shape,
      // Spawn high up to guarantee we drop into the map
      position: new CANNON.Vec3(0, 5, 8),
      material: phys.environmentMaterial,
      linearDamping: 0.9, // Ground friction
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
    const from = this.body.position;
    // Raycast down to check for ground
    const to = new CANNON.Vec3(from.x, from.y - 0.45, from.z);
    const ray = new CANNON.Ray(from, to);
    const res = new CANNON.RaycastResult();
    ray.intersectWorld(this.body.world as any, { result: res, skipBackfaces: true });
    
    // Ensure we don't hit ourselves
    this.onGround = res.hasHit && res.body !== this.body;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    
    if (this.keys.has('KeyW')) move.add(forward);
    if (this.keys.has('KeyS')) move.sub(forward);
    if (this.keys.has('KeyD')) move.add(right);
    if (this.keys.has('KeyA')) move.sub(right);

    if (move.lengthSq() > 0) move.normalize();
    const targetVX = move.x * this.speed;
    const targetVZ = move.z * this.speed;

    // Apply movement
    this.body.velocity.x += (targetVX - this.body.velocity.x) * 0.25;
    this.body.velocity.z += (targetVZ - this.body.velocity.z) * 0.25;

    if (this.keys.has('Space') && this.onGround) {
      this.body.velocity.y = this.jumpForce;
    }

    // FIX: Offset camera upward so we can see over the sphere
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
