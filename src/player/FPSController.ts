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
  speed = 7;
  jumpForce = 8;
  eyeHeight = 1.65;

  constructor(camera: THREE.PerspectiveCamera, phys: PhysicsWorld) {
    this.camera = camera;

    const shape = new CANNON.Sphere(0.4);
    this.body = new CANNON.Body({
      mass: 70,
      shape,
      position: new CANNON.Vec3(0, 2, 5),
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
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch
