import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
let guiExposure = null;
let bloomFolder

const container = document.getElementById( 'container' )
const stats = new Stats()
container.appendChild( stats.dom )

let controls
let showingWireframe = false
let camera, renderer, scene, canvas, light1, light2, light3, light4
// let width = window.innerWidth;
// let height = window.innerHeight;
let mainObject, particles
let bloomComposer

const clock = new THREE.Clock()
let previousTime = 0

const bloomParams = {
    exposure: 1,
    toneMapping: 'None',
    bloomStrength: 0.35,
    bloomThreshold: 0,
    bloomRadius: 0
}
const cameraParams = {
    fov: 75
}
const fogParams = {
    far: 100,
    near: 1,
    color: 0x000000
}
const toneMappingOptions = {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
}
const depthParams = {
    focus: 10.0,
    aperture: 5,
    maxblur: 0.01
}
const particleParams = {
    xSpeed: 0.075,
    ySpeed: 0.05,
    zSpeed: 0,
    scale: 1,
}
const pointLightParams = {
    intensity: 2,
    distance: 5
}

let particleXSpeed = particleParams.xSpeed
let particleYSpeed = particleParams.ySpeed
let particleZSpeed = particleParams.zSpeed
let particleScale = particleParams.scale

// const postprocessing = {};

init()

function init() {
    // Canvas
    canvas = document.querySelector('canvas.webgl')

    // Scene
    scene = new THREE.Scene()
    scene.fog = new THREE.Fog( 0x000000, 1, 100 )
    scene.fog.far = fogParams.far
    scene.fog.near = fogParams.near

    // const gltfLoader = new GLTFLoader()

    // let mixer = null
    // gltfLoader.load(
    //     'models/arm_level_00.gltf',
    //     (gltf) =>
    //     {
    //         gltf.scene.position.set(0, -1, 0)
    //         gltf.scene.scale.set(0.1, 0.1, 0.1)
    //         //mainObject = gltf.scene
    //         //scene.add(mainObject)
    //     }
    // )

    const loader = new THREE.ObjectLoader();
            loader.load( 'models/arm_level_01.json', function ( geometry ) {
            geometry.scale.set(0.01,0.01,0.01)
            mainObject = geometry
            scene.add( mainObject );
            })

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
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
    camera.position.x = 0
    camera.position.y = 2.5
    camera.position.z = -4
    camera.fov = cameraParams.fov
    scene.add(camera)

    // Controls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.maxPolarAngle = 0.9 * Math.PI / 2;
    controls.maxDistance = 20


    /**
     * Renderer
     */
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //lights
    const sphere = new THREE.SphereGeometry( 0.5, 16, 8 )
    light1 = new THREE.PointLight( 0xff0040, 2, 5 )
    light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) )
    light1.position.set(0, 0.5, 0)
    light1.scale.set(0.1,0.1,0.1)
    scene.add( light1 )

    light2 = new THREE.PointLight( 0x0040ff, 2, 5 )
    light2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x0040ff } ) ) )
    light2.position.set(0, 0.5, 0)
    light2.scale.set(0.1,0.1,0.1)
    scene.add( light2 )

    light3 = new THREE.PointLight( 0x80ff80, 2, 5 )
    light3.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0x80ff80 } ) ) )
    light3.position.set(0, 0.5, 0)
    light3.scale.set(0.1,0.1,0.1)
    scene.add( light3 )

    light4 = new THREE.PointLight( 0xffaa00, 2, 5 )
    light4.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffaa00 } ) ) )
    light4.position.set(0, 0.5, 0)
    light4.scale.set(0.1,0.1,0.1)
    scene.add( light4 )

    // Post
    const renderScene = new RenderPass( scene, camera )

    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 )
    bloomPass.threshold = bloomParams.bloomThreshold
    bloomPass.strength = bloomParams.bloomStrength
    bloomPass.radius = bloomParams.bloomRadius

    bloomComposer = new EffectComposer( renderer )
    bloomComposer.addPass( renderScene )
    bloomComposer.addPass( bloomPass )

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
    const particleTexture = textureLoader.load('models/particle.png')

    // Material
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.03,
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

    // initPostprocessing();

    // const matChanger = function ( ) {

    //     postprocessing.bokeh.uniforms[ 'focus' ].value = depthParams.focus;
    //     postprocessing.bokeh.uniforms[ 'aperture' ].value = depthParams.aperture * 0.00001;
    //     postprocessing.bokeh.uniforms[ 'maxblur' ].value = depthParams.maxblur;
    // }

    // const depthFolder = gui.addFolder( 'Depth of Field' );
    // depthFolder.add( depthParams, 'focus', 10.0, 100.0, 0.001 ).onChange( matChanger );
    // depthFolder.add( depthParams, 'aperture', 0, 10, 0.001 ).onChange( matChanger );
    // depthFolder.add( depthParams, 'maxblur', 0.0, 0.1, 0.001 ).onChange( matChanger );
    // matChanger();
    const modelFolder = gui.addFolder( 'Model' )
    var wireframeToggle = { add:function(){ 
        if (showingWireframe) {
            scene.traverse( function( object ) {
                if ( object.material ) {
                    object.material.wireframe = false
                    showingWireframe = false
                }
            } )
        }
        else {
            scene.traverse( function( object ) {
                if ( object.material ) {
                    object.material.wireframe = true;
                    showingWireframe = true
                }
            } );
        } 
    }}
    var modelToggle = { add:function(){ 
        if (mainObject.visible) {
            mainObject.visible = false
        }
        else {
            mainObject.visible = true
        } 
    }}
    modelFolder.add(modelToggle,'add').name('Hide/Show Model')
    modelFolder.add(wireframeToggle,'add').name('Toggle Wireframe')

    const cameraFolder = gui.addFolder( 'Camera' )
    cameraFolder.add( cameraParams, 'fov', 30.0, 120.0 ).onChange( function ( value ) {
        camera.fov = Number( value )
    } )

    const fogFolder = gui.addFolder( 'Fog' )
    fogFolder.add( fogParams, 'far', 0, 200.0 ).onChange( function ( value ) {
        scene.fog.far = Number( value );
    } )
    fogFolder.add( fogParams, 'near', 0, 100.0 ).onChange( function ( value ) {
        scene.fog.near = Number( value );
    } )
    fogFolder.addColor( fogParams, 'color', 0, 100.0 ).onChange( function ( value ) {
        var colorObject = new THREE.Color( value )
        scene.fog.color = new THREE.Color(colorObject)
    } )

    bloomFolder = gui.addFolder( 'Bloom' );
    bloomFolder.add( bloomParams, 'toneMapping', Object.keys( toneMappingOptions ) )
					.onChange( function () {
						updateGUI()
						renderer.toneMapping = toneMappingOptions[ bloomParams.toneMapping ]
						tick()
					} );
    bloomFolder.add( bloomParams, 'bloomThreshold', 0.0, 1.0 ).onChange( function ( value ) {
        bloomPass.threshold = Number( value )
    } )
    bloomFolder.add( bloomParams, 'bloomStrength', 0.0, 3.0 ).onChange( function ( value ) {
        bloomPass.strength = Number( value )
    } )
    bloomFolder.add( bloomParams, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
        bloomPass.radius = Number( value )
    } )

    const particleFolder = gui.addFolder( 'Particles' )
    var obj = { add:function(){ 
        if (particles.visible) {
        particles.visible = false
        }
        else {
            particles.visible = true
        } 
    }}
    particleFolder.add(obj,'add').name('Hide/Show Particles')
    particleFolder.add( particleParams, 'xSpeed', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
        particleXSpeed = Number( value );
    } )
    particleFolder.add( particleParams, 'ySpeed', 0.0, 1.0 ).step( 0.001 ).onChange( function ( value ) {
        particleYSpeed = Number( value );
    } )
    particleFolder.add( particleParams, 'zSpeed', 0.0, 1.0 ).step( 0.001 ).onChange( function ( value ) {
        particleZSpeed = Number( value );
    } )

    const pointLightFolder = gui.addFolder( 'Point Lights' );
    var pointButton = { add:function(){ 
        if (light1.visible) {
            light1.visible = false
            light2.visible = false
            light3.visible = false
            light4.visible = false
        }
        else {
            light1.visible = true
            light2.visible = true
            light3.visible = true
            light4.visible = true
        } 
    }}
    pointLightFolder.add(pointButton,'add').name('Hide/Show PointLights')
    pointLightFolder.add( pointLightParams, 'intensity', 0.0, 5.0 ).step( 0.001 ).onChange( function ( value ) {
        light1.intensity = Number( value )
        light2.intensity = Number( value )
        light3.intensity = Number( value )
        light4.intensity = Number( value )
    } ).name('Point Intensity')
    
    pointLightFolder.add( pointLightParams, 'distance', 0.0, 20.0 ).step( 0.001 ).onChange( function ( value ) {
        light1.distance = Number( value )
        light2.distance = Number( value )
        light3.distance = Number( value )
        light4.distance = Number( value )
    } ).name('Point Distance')
}

function updateGUI() {
    if ( guiExposure !== null ) {
        guiExposure.destroy()
        guiExposure = null
    }
    if ( bloomParams.toneMapping !== 'None' ) {
        guiExposure = bloomFolder.add( bloomParams, 'exposure', 0, 2 ).onChange( function () {
            renderer.toneMappingExposure = bloomParams.exposure
            tick()
        } )
    }
}

// function initPostprocessing() {

//     const renderPass = new RenderPass( scene, camera );

//     const bokehPass = new BokehPass( scene, camera, {
//         focus: 1.0,
//         aperture: 0.025,
//         maxblur: 0.01,

//         width: width,
//         height: height
//     } );

//     const dofComposer = new EffectComposer( renderer );

//     dofComposer.addPass( renderPass );
//     dofComposer.addPass( bokehPass );

//     postprocessing.composer = dofComposer;
//     postprocessing.bokeh = bokehPass;
// }

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update controls
    controls.update()
    camera.updateProjectionMatrix()

    // Stats
    stats.update()

    // Render
    renderer.render(scene, camera)

    //console.log(camera.position)
    if (particles != null) {
        particles.rotation.x += deltaTime * particleXSpeed
        particles.rotation.y += deltaTime * particleYSpeed
        particles.rotation.z += deltaTime * particleZSpeed
    }

    light1.position.x = Math.cos( elapsedTime ) * 4
    light2.position.z = Math.cos( elapsedTime ) * 4
    light3.position.x = Math.cos( elapsedTime * 0.2 ) * 4
    light4.position.z = Math.cos( elapsedTime * 0.2 ) * 4

    bloomComposer.render()
    //postprocessing.composer.render( 0.1 );

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()