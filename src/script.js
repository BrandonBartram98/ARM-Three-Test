import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

const container = document.getElementById( 'container' )
const stats = new Stats()
container.appendChild( stats.dom )

let controls
let camera, renderer, scene, canvas
let mainObject, particles
let composer, glitchPass

const bloomParams = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0,
    bloomRadius: 0
}

init()

function init() {
    // Canvas
    canvas = document.querySelector('canvas.webgl')

    // Scene
    scene = new THREE.Scene()
    scene.fog = new THREE.Fog( 0x000000, 1, 2000 );

    const gltfLoader = new GLTFLoader()

    let mixer = null
    gltfLoader.load(
        'models/arm_level_00.gltf',
        (gltf) =>
        {
            gltf.scene.position.set(0, -1, 0)
            gltf.scene.scale.set(0.1, 0.1, 0.1)
            mainObject = gltf.scene
            //scene.add(mainObject)
        }
    )

    const loader = new THREE.ObjectLoader();
            loader.load( 'models/arm_level_00.json', function ( geometry ) {
            geometry.scale.set(0.01,0.01,0.01)
            scene.add( geometry );
            }); 

    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

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
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500)
    camera.position.x = 0
    camera.position.y = 3
    camera.position.z = -6
    scene.add(camera)

    // Controls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.maxPolarAngle = 0.9 * Math.PI / 2;


    /**
     * Renderer
     */
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ReinhardToneMapping;

    // Post
    const renderScene = new RenderPass( scene, camera );

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = bloomParams.bloomThreshold;
    bloomPass.strength = bloomParams.bloomStrength;
    bloomPass.radius = bloomParams.bloomRadius;

    composer = new EffectComposer( renderer );
    composer.addPass( renderScene );
    composer.addPass( bloomPass );

    // Geometry
    const particlesGeometry = new THREE.BufferGeometry()
    const count = 1000

    const positions = new Float32Array(count * 3) // Multiply by 3 because each position is composed of 3 values (x, y, z)

    for(let i = 0; i < count * 3; i++) // Multiply by 3 for same reason
    {
        positions[i] = (Math.random() - 0.5) * 20 // Math.random() - 0.5 to have a random value between -0.5 and +0.5
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute('rotation', new THREE.BufferAttribute(positions, 3))

    const textureLoader = new THREE.TextureLoader()
    const particleTexture = textureLoader.load('/particles/particle.png')

    // Material
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        sizeAttenuation: true
    })

    particlesMaterial.map = particleTexture
    particlesMaterial.transparent = true
    particlesMaterial.alphaMap = particleTexture
    particlesMaterial.alphaTest = 0.001
    particlesMaterial.depthWrite = false
    particlesMaterial.blending = THREE.AdditiveBlending

    // Points
    particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)

    gui.add( bloomParams, 'exposure', 0.1, 2 ).onChange( function ( value ) {
        renderer.toneMappingExposure = Math.pow( value, 4.0 );
    } )
    gui.add( bloomParams, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {
        bloomPass.threshold = Number( value );
    } )
    gui.add( bloomParams, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {
        bloomPass.strength = Number( value );
    } )
    gui.add( bloomParams, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
        bloomPass.radius = Number( value );
    } )
    var obj = { add:function(){ 
        if (particles.visible) {
        particles.visible = false
        }
        else {
            particles.visible = true
        } 
    }}; 
    gui.add(obj,'add').name('Hide/Show Particles');;
}

function toggleParticles() {
    
}


const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update controls
    controls.update()

    // Stats
    stats.update();

    // Render
    renderer.render(scene, camera)

    //console.log(camera.position)
    if (particles != null) {
        particles.rotation.y += deltaTime * 0.075
        particles.rotation.x += deltaTime * 0.05
    }

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()