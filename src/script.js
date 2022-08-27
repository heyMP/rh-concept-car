import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as dat from 'lil-gui'
import gsap from 'gsap';

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
if (document.querySelector('#band2a')) {
  document.querySelector('#band2a').innerHTML = '<canvas class="webgl"></canvas>';
}
const canvas = document.querySelector('canvas.webgl')

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
      child.material.envMapIntensity = 1.5;
    }
  })
}

/**
 * Modals
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let mixer;

gltfLoader.load('./models/Car/gltf/scene.gltf', (gltf) => {
  // mixer = new THREE.AnimationMixer(gltf.scene);
  gltf.scene.scale.set(0.005, 0.005, 0.005);
  console.log(gltf);
  scene.add(gltf.scene);
  updateAllMaterials();
  movie.nextScene();
});

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

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)


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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 0)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true
controls.enableZoom = false;
controls.enablePan = false;
controls.enableRotate = false;

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update controls
    controls.update()

    // Update animaitions
    mixer?.update(deltaTime);

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

class Movie {
  constructor() {
    this.scene;
    this.scenes = [ 'intro', 'overhead', 'inside' ]
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
        tl.to(camera.position, {
            y: 2,
            z: 5,
            duration: 5,
            ease: 'power2.in'
          })
          .to(camera.position, {
            x: 2,
            z: 0,
            duration: 5,
            delay: -1,
          })
          .to(camera.position, {
            y: .5,
            duration: 3,
            delay: -1,
            onended: () => {
              controls.enableRotate = true;
              controls.enablePan = true;
            }
          });
      break;
    }
  }
}

window.movie = new Movie();

tick()
