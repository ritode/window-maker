import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Box3 } from 'three/src/Three.js';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';


const obNames = {
    Glass:'GlassPanel034',
    SpaceTop: 'SpaceBarTop011',
    SpaceBottom: 'SpaceBarBottom010',
    SpaceLeft:'SpaceBarLeft008',
    SpaceRight:'SpaceBarRight009',
}

let OBJECT = null;
let rod = null;
let originalBoxSize = {
    x: 1297,
    y:2100
}
let originalGlassSize = {
    x: 2.02,
    y:1.22
}
let rodSize;
// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// GUI
const gui = new GUI();

const parameters = {
    commonWidth: 1297, // Default values, will be updated later
    commonHeight: 2100, // Default values, will be updated later,
    cornerWidth: 500,
    cornerHeight: 500,
};

// Common Width and Height
gui.add(parameters, 'commonWidth').min(100).max(3000).step(1).name('Common Width').onChange(updateGeometry);
gui.add(parameters, 'commonHeight').min(10).max(3000).step(1).name('Common Height').onChange(updateGeometry);
const folder = gui.addFolder('top left')
folder.add(parameters, 'cornerWidth').min(200).max(1000).step(1).name('corner Width').onChange(updateCorner);
folder.add(parameters, 'cornerHeight').min(200).max(1000).step(1).name('corner Height').onChange(updateCorner);

function updateGeometry(){
    const currSize = {}
if(OBJECT){
    const box = new Box3().setFromObject(OBJECT.getObjectByName(obNames.Glass))
    const boxSize = box.getSize(new THREE.Vector3());
    currSize.x = boxSize.x;
    currSize.y = boxSize.y;
// Calculate the scale factors
const widthScale = parameters.commonWidth/originalBoxSize.x;
const heightScale = parameters.commonHeight/originalBoxSize.y;
OBJECT.children.forEach(child => {
    const axis = child.name.split('-')
    if(axis.length>1){
        if(axis[0]==='X'){
            child.scale.set(widthScale,1,1);
            if(axis[2]==='Top'){
                child.position.set(0,box.max.y+0.015,0)}
            else if(axis[2] === 'Bottom'){
                child.position.set(0,box.min.y-0.015,0)
            }
        }else if( axis[0]=== 'Y'){
            child.scale.set(1,heightScale,1)
            console.log(originalGlassSize.x,currSize.x)
            if(axis[2]==='Right'){
                child.position.x = box.max.x+0.015;
            }else if(axis[2] === 'Left'){
                child.position.x =box.min.x-0.015
            }
        }
    }else{
        child.scale.set(widthScale,heightScale,1)
    }
});
}
}
function updateCorner(){
    const currSize = {}
if(OBJECT&&rod){
    const box = new Box3().setFromObject(OBJECT)
    const boxSize = box.getSize(new THREE.Vector3());
    currSize.x = boxSize.x;
    currSize.y = boxSize.y;

    const widthScale = ((currSize.x*1000)-parameters.cornerWidth)/originalBoxSize.x;
    const heightScale = ((currSize.y*1000)-parameters.cornerHeight)/originalBoxSize.y;

    OBJECT.getObjectByName('X-Frame-Top').scale.x = widthScale;
    OBJECT.getObjectByName('X-Frame-Top').position.x = -parameters.cornerWidth/2000;

    OBJECT.getObjectByName('Y-Frame-Right').scale.y = heightScale;
    OBJECT.getObjectByName('Y-Frame-Right').position.y = -parameters.cornerHeight/2000;

    const x = parameters.cornerWidth/1000
    const y = parameters.cornerWidth/1000
    const targetRodSize = Math.sqrt(x*x + y*y)
    console.log(targetRodSize,rodSize.x)
    rod.scale.x = (targetRodSize/rodSize.x);
    const posX = box.max.x-(parameters.cornerWidth/2000)
    const posY = box.max.y-(parameters.cornerHeight/2000)
    rod.position.set(posX,posY,0)
    const theta = (Math.PI/2)+((Math.PI/2)-Math.acos((parameters.cornerWidth/2000)/(targetRodSize/2)))
        rod.rotation.z = theta;
        console.log(theta)
    if (!scene.children.includes(rod)) {
    scene.add(rod)
    }
    const glass = new Brush(OBJECT.getObjectByName(obNames.Glass).geometry);
    glass.updateMatrixWorld();
    const cutOb = new THREE.BoxGeometry(targetRodSize,1,20);
cutOb.translate(-posX,-posY,0)

// Create a rotation matrix
const rotationMatrix = new THREE.Matrix4().makeRotationZ(theta); // Rotate 45 degrees around the Y axis

// Apply the rotation to the geometry
cutOb.applyMatrix4(rotationMatrix);
    // cutOb.scale.set(rod.scale.x,1,20);

    // const cuttingOb = rod.clone();
    // cuttingOb.scale.y = 20;
    // const cuttingbox = new Box3().setFromObject(cuttingOb)
    // const cuttingboxSize = cuttingbox.getSize(new THREE.Vector3());
    // cuttingOb.position.set(cuttingOb.position.x+(cuttingboxSize.x/4),cuttingOb.position.y+(cuttingboxSize.y/4),0)
    const cut = new Brush(cutOb)
    cut.updateMatrixWorld();

    const evaluator = new Evaluator();
const result = evaluator.evaluate( glass, cut, SUBTRACTION );
console.log(result);
// const mesh = new THREE.Mesh(result,new THREE.Material('#220000'))
// scene.add(cuttingOb);
OBJECT.remove(OBJECT.getObjectByName(obNames.Glass));
OBJECT.add(result);
}
}


// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Set background color of the scene
scene.background = new THREE.Color(0xA0D9EF); // Change this color to whatever you like

/**
 * Models
 */
function spawnSphere(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.1, 10, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x0077ff });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    scene.add(sphere);
}
gltfLoader.load('/models/BaseFrame.glb', (gltf) => {
    const model = gltf.scene;
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.side = THREE.DoubleSide; // Ensure double-sided rendering if needed
        }
    });
    OBJECT = new THREE.Mesh();
    // objects
    const glass = model.getObjectByName(obNames.Glass);
    const spaceTop = model.getObjectByName(obNames.SpaceTop);
    const spaceBottom = model.getObjectByName(obNames.SpaceBottom);
    const spaceLeft = model.getObjectByName(obNames.SpaceLeft);
    const spaceRight = model.getObjectByName(obNames.SpaceRight);
    const frameTop = model.getObjectByName('FrameTop');
    const frameBottom = model.getObjectByName('FrameBottom');
    const frameLeft = model.getObjectByName('FrameLeft');
    const frameRight = model.getObjectByName('FrameRight');

    rod = new THREE.Mesh();
    const frame = frameTop.clone()
    const space = spaceTop.clone()
    frame.position.set(0,0,0);
    space.position.set(0,0,0)
    rod.add(frame);
    rod.add(space);

    const rodBox = new Box3().setFromObject(rod);
    rodSize = rodBox.getSize(new THREE.Vector3());

    glass.scale.set(1,1,glass.scale.z);
    const box = new THREE.Box3().setFromObject(glass);

    spaceTop.scale.set(1.03,spaceTop.scale.y,spaceTop.scale.z);
    spaceBottom.scale.set(1.03,spaceBottom.scale.y,spaceBottom.scale.z);
    frameTop.scale.x = 0.518
    frameBottom.scale.x = 0.518

    const frameTopMesh = new THREE.Mesh();
    frameTop.position.y = 0;
    spaceTop.position.y = 0;
    frameTopMesh.add(frameTop)
    frameTopMesh.add(spaceTop);
    frameTopMesh.name = 'X-Frame-Top'
    frameTopMesh.position.y = box.max.y+0.015
    const frameBottomMesh = new THREE.Mesh();
    frameBottom.position.y = 0;
    spaceBottom.position.y = 0;
    frameBottomMesh.add(frameBottom)
    frameBottomMesh.add(spaceBottom)
    frameBottomMesh.name = 'X-Frame-Bottom'
    frameBottomMesh.position.y = box.min.y-0.015

    const frameLeftMesh = new THREE.Mesh();

    frameLeft.position.x = 0
    spaceLeft.position.x = 0;
    frameLeftMesh.add(frameLeft)
    frameLeftMesh.add(spaceLeft)
    frameLeftMesh.name = 'Y-Frame-Left'
    frameLeftMesh.position.x = box.min.x - 0.015;
    const frameRightMesh = new THREE.Mesh();
    frameRight.position.x = 0
    spaceRight.position.x = 0
    frameRightMesh.add(frameRight)
    frameRightMesh.add(spaceRight)
    frameRightMesh.name = 'Y-Frame-Right'
    frameRightMesh.position.x = box.max.x + 0.015;
    OBJECT.add(glass);
    OBJECT.add(frameBottomMesh)
    OBJECT.add(frameTopMesh)
    OBJECT.add(frameRightMesh)
    OBJECT.add(frameLeftMesh)
    scene.add(OBJECT)

    const obBox = new Box3().setFromObject(OBJECT);
    const size = obBox.getSize(new THREE.Vector3());
    originalBoxSize.x = Math.round(size.x*1000);
    originalBoxSize.y = Math.round(size.y*1000)
    const glassSize = box.getSize(new THREE.Vector3());
    originalGlassSize.x = glassSize.x;
    originalGlassSize.y = glassSize.y;
    // // Update parameters with box size
    // parameters.width = Math.round(originalBoxSize.x*1000);
    // parameters.height = Math.round(originalBoxSize.y*1000);
    // // Update GUI controllers with new values
    // widthController.setValue(parameters.width);
    // heightController.setValue(parameters.height);

});

// gltfLoader.load('/models/FrameProfile.glb', (gltf) => {
//     model = gltf.scene;
//     model.traverse((child) => {
//         if (child.isMesh) {
//             child.castShadow = true;
//             child.receiveShadow = true;
//             child.material.side = THREE.DoubleSide; // Ensure double-sided rendering if needed
//         }
//     });
// });

//////////// SCENE SET UP /////////////////

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(-5, 5, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(2, 2, 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const tick = () => {

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
