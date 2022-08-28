import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as dat from 'lil-gui'
import gsap from 'gsap';
import { html, css, LitElement } from 'lit';

const conceptCarInit = (canvas) => {
  /**
   * Base
   */
  // Debug
  const gui = new dat.GUI()

  /**
   * Sizes
   */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({
      canvas: canvas
  })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // envmap
  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  const environmentMap = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;

  // Scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color( 0xd9dfe0 );
  scene.environmentMap = environmentMap;

  // apply envmap to all materials
  const updateAllMaterials = () => {
    scene.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.envMap = environmentMap;
        child.material.envMapIntensity = 1.9;
      }
    })
  }

  /**
   * Modals
   */
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three/examples/js/libs/draco/');

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  /**
   * Floor
   */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        metalness: 0,
        roughness: 0.5
    })
  )
  floor.receiveShadow = true
  floor.rotation.x = - Math.PI * 0.5
  // scene.add(floor)

  window.addEventListener('resize', () =>
  {
      // Update sizes
      sizes.width = window.innerWidth
      sizes.height = window.innerHeight

      // Update camera
      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()

      // Update renderer
      renderer.setSize(sizes.width, sizes.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })

  /**
   * Camera
   */
  // Base camera
  const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 100)
  camera.position.set(2, 2, 2)
  scene.add(camera)

  // Controls
  const controls = new OrbitControls(camera, canvas)
  controls.enabled = false;
  controls.target.set(0, 0, 0);
  controls.enableDamping = true
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = false;

  /**
   * Animate
   */
  const clock = new THREE.Clock()
  let previousTime = 0

  document.addEventListener('mousemove', onDocumentMouseMove );

  let mouseX = 0;
  let mouseY = 0;

  function onDocumentMouseMove(event) {
    mouseX = ( event.clientX - sizes.width / 2 ) / 100;
    mouseY = ( event.clientY - sizes.height / 2 ) / 100;
  }

  const tick = () => {
      const elapsedTime = clock.getElapsedTime()
      const deltaTime = elapsedTime - previousTime
      previousTime = elapsedTime


      // Update controls
      controls.update()

      // Render
      renderer.render(scene, camera)

      // Call tick again on the next frame
      window.requestAnimationFrame(tick)
  }

  class Movie {
    constructor() {
      this.scene;
      this.scenes = ['intro', 'overhead', 'inside'];
      this.init();
      this._initialized = false;
    }

    init() {
      gltfLoader.load('./models/Car/gltf-heavy-compression/scene.gltf', (gltf) => {
        gltf.scene.scale.set(0.005, 0.005, 0.005);
        scene.add(gltf.scene);
        updateAllMaterials();
        this._initialized = true;
        this.nextScene();
      });
    }

    nextScene() {
      if (!this.scene) {
        this.scene = 'intro';
      }
      else {
        // if there is a next item
        const nextIndex = this.scenes.findIndex(i => i === this.scene) + 1;
        if (this.scenes.length > nextIndex) {
          this.scene = this.scenes[nextIndex];
        }
        // if not, go to the begining
        else {
          this.scene = 'intro';
        }
      }
      this.update();
    }

    update() {
      switch(this.scene) {
        case 'intro':
          const tl = gsap.timeline();
          tl
            .to(camera.position, {
              x: 2,
              y: 1,
              z: 0,
              duration: 5,
              ease: 'power1.in',
              onended: () => {
                controls.enabled = true
              }
            })
          controls.enableRotate = true;
          controls.autoRotateSpeed = .5;
          controls.autoRotate = true;
          controls.maxDistance = 2;
          controls.minDistance = 1;
        break;
      }
    }
  }
  tick()
  return {
    scene,
    camera,
    movie: new Movie()
  };
}

class RhConceptCar extends LitElement {
  static styles = css`
  `;

  constructor() {
    super();
    this._instance = null;
  }

  firstUpdated() {
    const canvas = this.renderRoot.querySelector('canvas');
    this._instance = conceptCarInit(canvas);
  }

  render() {
    return html`<canvas></canvas>`
  }
}

customElements.define('rh-concept-car', RhConceptCar);
