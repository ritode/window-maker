import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Variables
let initialScales = {};
let model = null;
let originalBoxSize = null;

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// GUI
const gui = new GUI();

const parameters = {
    commonWidth: 2500, // Default values, will be updated later
    commonHeight: 2100, // Default values, will be updated later,
    corners: {
        topLeft: {
            typeOfCorner: 'Corner',
            width: 1000,
            height: 1000
        },
        topRight: {
            typeOfCorner: 'Corner',
            width: 1000,
            height: 1000
        },
        bottomLeft: {
            typeOfCorner: 'Corner',
            width: 1000,
            height: 1000
        },
        bottomRight: {
            typeOfCorner: 'Corner',
            width: 1000,
            height: 1000
        }
    }
};

// Common Width and Height
gui.add(parameters, 'commonWidth').min(100).max(3000).step(1).name('Common Width').onChange(updateGeometry);
gui.add(parameters, 'commonHeight').min(10).max(3000).step(1).name('Common Height').onChange(updateGeometry);
// Add folders for each corner
addCornerFolder('Top Left Corner', 'topLeft', parameters.corners.topLeft);
addCornerFolder('Top Right Corner', 'topRight', parameters.corners.topRight);
addCornerFolder('Bottom Left Corner', 'bottomLeft', parameters.corners.bottomLeft);
addCornerFolder('Bottom Right Corner', 'bottomRight', parameters.corners.bottomRight);

// Function to add a corner folder
function addCornerFolder(name, cornerName, cornerParams) {
    const folder = gui.addFolder(name);
    const widthController = {};
    const heightController = {};

    folder.add(cornerParams, 'typeOfCorner', ['Corner', 'Chamfer', 'Radius', 'Ellipse']).name('Type of Corner')
        .onChange(value => updateCornerType(value, cornerName, folder, cornerParams, widthController, heightController));

    // Initial call to handle the default values
    updateCornerType(cornerParams.typeOfCorner, cornerName, folder, cornerParams, widthController, heightController);

    folder.open();
}

function updateCornerType(value, cornerName, folder, cornerParams, widthController, heightController) {

    if (value !== 'Corner') {
        // If 'Corner' is not selected, add height and width controls if not already added
        if (!widthController[cornerName]) {
            widthController[cornerName] = folder.add(cornerParams, 'width').min(10).max(300).step(1).name('Width').onChange(updateCornerGeometry);
        }
        if (!heightController[cornerName]) {
            heightController[cornerName] = folder.add(cornerParams, 'height').min(10).max(300).step(1).name('Height').onChange(updateCornerGeometry);
        }
        updateCornerGeometry(cornerName,value,parameters.corners[cornerName].width,parameters.corners[cornerName].height)
    } else {
        // If 'Corner' is selected, remove height and width controls if they exist
        if (widthController[cornerName]) {
            widthController[cornerName].destroy();
        }
        if (heightController[cornerName]) {
            heightController[cornerName].destroy();
        }
    }
}
//Function to update Corner
function updateCornerGeometry(cornerName, cornerType, width, height){
    const x = ((originalBoxSize.x*1000)-width)/(originalBoxSize.x*1000)
    const y = ((originalBoxSize.y*1000)-height)/(originalBoxSize.y*1000)
    if(cornerType==='Chamfer'){
        
    scaleObjectFromRight(model.getObjectByName('FrameTop'),x)
    scaleObjectFromBottom(model.getObjectByName('FrameRight'),y)
    spawnRod(width/1000,height/1000);
    }
}

// Function to scale an object from the left side in the x-axis
function scaleObjectFromLeft(object, scaleX) {
    // Get the bounding box of the object
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());

    // Calculate the new width after scaling
    const newWidth = size.x * scaleX;

    // Calculate the difference in width
    const deltaX = newWidth - size.x;

    // Apply scaling
    object.scale.x = scaleX;

    // Adjust position to keep it anchored on the left side
    object.position.x += deltaX / 2;
}
function scaleObjectFromRight(object, scaleX) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const newWidth = size.x * scaleX;
    const deltaX = newWidth - size.x;
    object.scale.x = scaleX;
    object.position.x -= deltaX / 2;
}
function scaleObjectFromTop(object, scaleY) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const newHeight = size.y * scaleY;
    const deltaY = newHeight - size.y;
    object.scale.x = scaleY;
    object.position.y -= deltaY / 2;
}
function scaleObjectFromBottom(object, scaleY) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const newHeight = size.y * scaleY;
    const deltaY = newHeight - size.y;
    object.scale.x = scaleY;
    object.position.y += deltaY / 2;
}


function spawnRod(width,height){
    gltfLoader.load('/models/FrameProfileWithBones.glb', (gltf) => {
        model = gltf.scene;
        const x = width/2
        const y = height/2
        const l = Math.sqrt(height*height + width*width)

    const box = new THREE.Box3().setFromObject(model);
        const scale = l/(box.max.x-box.min.x)
        model.scale.set(scale,1,1)
        model.position.set(-(originalBoxSize.x/2- x),(originalBoxSize.y/2 - y),0);
        const theta = Math.acos(x/Math.sqrt(x*x + y*y))
        model.rotation.z = theta;
        scene.add(model);
    })
}
function updateGeometry() {
    if (model && originalBoxSize) {
        // Calculate the scale factors
        const scaleX = (parameters.commonWidth) / Math.round(originalBoxSize.x*1000);
        const scaleY = (parameters.commonHeight) / Math.round(originalBoxSize.y*1000);
        // Update the scale of the model

        // Glass
        model.getObjectByName('GlassPanel034').scale.set(
            initialScales.glass.x * scaleX,
            initialScales.glass.y * scaleY,
            initialScales.glass.z
        );
        const glassbox = new THREE.Box3().setFromObject(model.getObjectByName('GlassPanel034'));

        // Top space
        model.getObjectByName('SpaceBarTop011').scale.set(
            initialScales.topSpace.x * scaleX,
            initialScales.topSpace.y,
            initialScales.topSpace.z
        );
        model.getObjectByName('SpaceBarTop011').position.set(
            0,glassbox.max.y,model.children[0].position.z
        )
        // Bottom space
        model.getObjectByName('SpaceBarBottom010').scale.set(
            initialScales.bottomSpace.x * scaleX,
            initialScales.bottomSpace.y,
            initialScales.bottomSpace.z
        );
        model.getObjectByName('SpaceBarBottom010').position.set(
            0,glassbox.min.y,model.children[0].position.z
        )
        // Right space
        model.getObjectByName('SpaceBarRight009').scale.set(
            initialScales.rightSpace.x,
            initialScales.rightSpace.y* scaleY,
            initialScales.rightSpace.z
        );
        model.getObjectByName('SpaceBarRight009').position.set(
            glassbox.max.x,0,model.children[0].position.z
        )
        // Left space
        model.getObjectByName('SpaceBarLeft008').scale.set(
            initialScales.leftSpace.x,
            initialScales.leftSpace.y* scaleY,
            initialScales.leftSpace.z
        );
        model.getObjectByName('SpaceBarLeft008').position.set(
            glassbox.min.x,0,model.children[0].position.z
        )

        const spacetopbox = new THREE.Box3().setFromObject(model.getObjectByName('SpaceBarTop011'));
        const spacebottombox = new THREE.Box3().setFromObject(model.getObjectByName('SpaceBarBottom010'));
        const spaceleftbox = new THREE.Box3().setFromObject(model.getObjectByName('SpaceBarRight009'));
        const spacerightbox = new THREE.Box3().setFromObject(model.getObjectByName('SpaceBarLeft008'));

        // Bottom bar
        model.getObjectByName('FrameBottom').scale.set(
            scaleX,
            initialScales.topBar.y,
            initialScales.topBar.z
        );
        model.getObjectByName('FrameBottom').position.set(
            0,spacebottombox.min.y,model.children[0].position.z
        )
        // Top bar
        model.getObjectByName('FrameTop').scale.set(
            scaleX,
            initialScales.bottomBar.y,
            initialScales.bottomBar.z
        );
        model.getObjectByName('FrameTop').position.set(
            0,spacetopbox.max.y,model.children[0].position.z
        )
        // Right bar
        model.getObjectByName('FrameRight').scale.set(
            initialScales.rightBar.x* scaleY,
            initialScales.rightBar.y,
            initialScales.rightBar.z
        );
        model.getObjectByName('FrameRight').position.set(
            spacerightbox.max.x,0,0
        )
        // Left bar
        model.getObjectByName('FrameLeft').scale.set(
            initialScales.leftBar.x* scaleY,
            initialScales.leftBar.y,
            initialScales.leftBar.z
        );
        model.getObjectByName('FrameLeft').position.set(
            spaceleftbox.min.x,0,0
        )
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

gltfLoader.load('/models/BaseFrame.glb', (gltf) => {
    model = gltf.scene;
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.side = THREE.DoubleSide; // Ensure double-sided rendering if needed
        }
    });
    scene.add(model);

    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(model);
    originalBoxSize = box.getSize(new THREE.Vector3());

    // Save the initial scales of the children
    initialScales = {
        topBar: model.children[0].scale.clone(),
        bottomBar: model.children[1].scale.clone(),
        rightBar: model.children[2].scale.clone(),
        leftBar: model.children[3].scale.clone(),
        glass: model.children[4].scale.clone(),
        topSpace: model.children[5].scale.clone(),
        bottomSpace: model.children[6].scale.clone(),
        rightSpace: model.children[7].scale.clone(),
        leftSpace: model.children[8].scale.clone(),
    };

    // Update parameters with box size
    parameters.width = Math.round(originalBoxSize.x*1000);
    parameters.height = Math.round(originalBoxSize.y*1000);
    // Update GUI controllers with new values
    widthController.setValue(parameters.width);
    heightController.setValue(parameters.height);
});

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
