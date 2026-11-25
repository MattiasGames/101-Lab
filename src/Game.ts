import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { FPSController } from './player/FPSController';
import { WeaponSlots } from './player/WeaponSlots';
import { Interaction } from './player/Interaction';
import { WeaponHandler } from './weapons/WeaponHandler';
import { RagdollManager } from './ragdoll/RagdollManager';
import { buildMap } from './world/Map';
import { StartMenu } from './ui/StartMenu';
import { initHUD, refreshHUD } from './ui/HUD';

export class Game {
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  phys!: PhysicsWorld;
  fps!: FPSController;
  slots!: WeaponSlots;
  ragdolls!: RagdollManager;
  weapons!: WeaponHandler;
  interaction!: Interaction;
  clock = new THREE.Clock();
  started = false;
  paused = false;

  viewModel!: THREE.Mesh;

  start() {
    const canvas = document.getElementById('app') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 500);
    this.scene.add(this.camera); // Add camera to scene so view model renders

    // Create a simple cube to act as the weapon view model
    const boxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.4);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x888888, emissive: 0x222222 });
    this.viewModel = new THREE.Mesh(boxGeo, boxMat);
    this.viewModel.position.set(0.25, -0.2, -0.5); // Bottom right
    this.camera.add(this.viewModel);

    this.phys = new PhysicsWorld();
    buildMap(this.scene, this.phys);

    this.slots = new WeaponSlots();
    this.ragdolls = new RagdollManager(this.phys, this.scene);
    this.weapons = new WeaponHandler(this.phys, this.ragdolls);
    this.fps = new FPSController(this.camera, this.phys);
    this.interaction = new Interaction(this.phys, this.ragdolls, this.slots, this.weapons, this.fps);

    this.ragdolls.spawn(new CANNON.Vec3(0, 2, -3));
    this.ragdolls.spawn(new CANNON.Vec3(2, 2, -4));

    new StartMenu(this.slots, () => {
      this.started = true;
      document.getElementById('menu')!.style.display = 'none';
      document.getElementById('hud')!.style.display = 'block';
      document.getElementById('crosshair')!.style.display = 'block';
      initHUD(this.slots);
      refreshHUD();
      document.body.requestPointerLock();
    });

    this.bindEvents();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.loop();
  }

  bindEvents() {
    document.addEventListener('pointerlockchange', () => {
      const pauseEl = document.getElementById('pause')!;
      if (document.pointerLockElement) {
        pauseEl.classList.remove('show');
        this.paused = false;
      } else if (this.started) {
        pauseEl.classList.add('show');
        this.paused = true;
      }
    });

    document.getElementById('pause')!.addEventListener('click', () => {
      document.body.requestPointerLock();
    });

    window.addEventListener('mousedown', e => {
      if (!document.pointerLockElement) return;
      if (e.button === 0) this.interaction.onLeftDown();
      if (e.button === 2) this.interaction.onRightDown();
    });
    
    window.addEventListener('mouseup', e => {
      if (e.button === 2) this.interaction.onRightUp();
    });
    window.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', e => {
      if (!this.started || this.paused) return;
      const digit = e.code.match(/^Digit([1-9])$/);
      if (digit) {
        const n = parseInt(digit[1]) - 1;
        this.slots.select(n);
        refreshHUD();
        
        // Change view model color based on selected slot
        if (this.slots.current()) {
          this.viewModel.material = new THREE.MeshStandardMaterial({ color: 0x7cf, emissive: 0x115577 });
        } else {
          this.viewModel.material = new THREE.MeshStandardMaterial({ color: 0xd9a86a, emissive: 0x221100 }); // Skin tone for hands
        }
      }
    });
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.started && !this.paused) {
      this.phys.step(dt);
      this.fps.update(dt);
      this.interaction.update();
      this.ragdolls.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
  };
}
