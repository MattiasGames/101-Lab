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

    // Sphere radius 0.4. We spawn it high so it falls safely.
    const shape = new CANNON.Sphere(0.4);
    this.body = new CANNON.Body({
      mass: 70,
      shape,
      position: new CANNON.Vec3(0, 3, 5),
      material: phys.environmentMaterial,
      linearDamping: 0.5, // Lowered from 0.9 so we can actually move
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
    const to = new CANNON.Vec3(from.x, from.y - 0.5, from.z);
    const ray = new CANNON.Ray(from, to);
    const res = new CANNON.RaycastResult();
    ray.intersectWorld(this.body.world as any, { result: res, skipBackfaces: true });
    
    // Make sure we don't accidentally detect our own body!
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

    // Apply movement force
    this.body.velocity.x += (targetVX - this.body.velocity.x) * 0.3;
    this.body.velocity.z += (targetVZ - this.body.velocity.z) * 0.3;

    if (this.keys.has('Space') && this.onGround) {
      this.body.velocity.y = this.jumpForce;
    }

    // Update camera position
    this.camera.position.set(
      this.body.position.x,
      this.body.position.y + this.eyeHeight - 0.4,
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
