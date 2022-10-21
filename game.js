import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js'; //from '../../../../three/build/three.module.js'
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js'; //from '../../../../three/build/three.module.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableZoom = false
controls.enablePan = false
controls.enableDamping = true
controls.dampingFactor = 0.1

controls.mouseButtons = {
	LEFT: THREE.MOUSE.PAN,
	MIDDLE: THREE.MOUSE.DOLLY,
	RIGHT: THREE.MOUSE.ROTATE
}

controls.touches = {
	ONE: THREE.TOUCH.DOLLY_PAN,
	TWO: THREE.TOUCH.ROTATE
}



//--- meshes ---//

let oMesh
let xMesh

const loader = new GLTFLoader();

loader.load('blender/o.glb', gltf => {
    gltf.scene.scale.set(0.8, 0.8, 0.8)
	oMesh = gltf.scene
}, xhr => /*console.log(( xhr.loaded / xhr.total * 100 ) + '% loaded')*/ undefined,
error => console.error(error));

loader.load('blender/x.glb', gltf => {
    gltf.scene.scale.set(0.8, 0.8, 0.8)
	xMesh = gltf.scene
}, /*xhr => console.log(( xhr.loaded / xhr.total * 100 ) + '% loaded')*/ undefined,
error => console.error(error));


// const gridHelper = new THREE.GridHelper(50, 10); scene.add(gridHelper);





//--- utility ---//
let getRand = (min, max) => { return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min) }




//--- lights ---//

const lights = [[-30, 30, 0], [30, -30, 0], [30, 0, -30], [-30, 0, 30], [-30, -30, 0], [30, 30, 0]]

for (const lightPos of lights) {
    const light = new THREE.PointLight( 0xffffff, 1.5, 100 );
    light.position.set(lightPos[0], lightPos[1], lightPos[2]);
    scene.add(light);
}



//--- dom events ---//

const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

let lastIntersect

window.addEventListener("click", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children)
    
    lastIntersect = intersects[0]

    // console.log(lastIntersect)
    if (lastIntersect) {
        // lastIntersect.object.material.color.set(0xff0000)
        // const geometry = new THREE.BoxGeometry(1, 1, 1);
        // const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        // const cubeMesh = new THREE.Mesh(geometry, material);
        // cubeMesh.position.set(x, y, z)


        let mesh = getRandomInt(0,1) ? xMesh.clone() : oMesh.clone()
        
        
        lastIntersect.object.add(mesh)
        console.log(lastIntersect.object)
    }
    
})

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


//--- game ---//

// let game = {
//     turn: "x" or "o",
//     startedAtTime: "", //timestamp
//     finishedAtTime: "", //timestamp
//     finished: false,

// }

class Game {
    #turn;
    get turn() { return this.#turn }

    #started = false; get started() { return this.#started }
    #startedAtTime; get startedAtTime() { return this.#startedAtTime }

    #finished = false; get finished() { return this.#finished }
    #finishedAtTime; get finishedAtTime() { return this.#finishedAtTime }

    #cube

    constructor(startingPlayer) {

        if (startingPlayer != "x" && startingPlayer != "o") {
            let startingPlayerRand = getRand(0, 1) ? "x" : "o"

            this.#turn = startingPlayerRand

            if (startingPlayer != "")
                console.error(`"${startingPlayer}" cannot be assigned to let turn. let turn was randomly assigned as "${startingPlayerRand}"`)
            else
                console.info(`let turn was randomly assigned as "${startingPlayerRand}"`)
        }
        else this.#turn = startingPlayer

        
        this.#cube = this.#createCube()

        this.#cube.forEach((cubez, z) => {
            cubez.forEach((cubey, y) => {
                cubey.forEach((_, x) => {
                    const meshCoordinated = {
                        x: (x-1)*2,
                        y: (y-1)*2,
                        z: (z-1)*2
                    }
        
                    const geometry = new THREE.BoxGeometry(2, 2, 2);
                    const material = new THREE.MeshBasicMaterial(/*{color: 0x00ff00}*/{ wireframe: true, opacity: 1 } );
                    const cubeMesh = new THREE.Mesh(geometry, material);
                    cubeMesh.position.set(meshCoordinated.x, meshCoordinated.y, meshCoordinated.z)

                    cubeMesh.positionCube = {x,y,z}

                    if (!(meshCoordinated.x == 0 && meshCoordinated.y == 0 && meshCoordinated.z == 0)) {
                        scene.add(cubeMesh);
                        this.#cube[z][y][x] = {
                            cubeMesh: cubeMesh,
                            occupied: false,
                            type: "" //"x" or "o"
                        }
                    }
                })
            })
        })


    }

    #createCube() {
        let cube = [] 
        for (let z = 0; z < 3; z++) {
            cube[z] = []
            for (let y = 0; y < 3; y++) {
                cube[z][y] = []
                for (let x = 0; x < 3; x++)
                    cube[z][y][x] = undefined
            }
        }
        return cube
    }

    start() {
        this.#started = true

        this.#startedAtTime = new Date()

        // console.log(this.#startedAtTime)
    }

    makeMove(position) {


    }

    isPositionOccupated(pos) {

    }

    #checkWin() {

        return false
    }

    #changeTurn() {

        this.#turn = (this.#turn = "x") ? this.#turn = "o" : this.#turn = "x"


    }

    #gameEnd() {

    }
}

class LocalGame extends Game {

    constructor(startingPlayer) {
        super(startingPlayer)

    }

}

let game = new Game("x")
// for (let i = 0; i < 10; i++) new Game("")
// let localGame = new LocalGame("x")

// game.start()

// console.log(game.turn)
// console.log(game)

//---   ---//


camera.position.set(6, 4, 12);

function animate() {
	requestAnimationFrame(animate);
    controls.update();
	renderer.render(scene, camera);
} animate();

function WindowResizeHome() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
} WindowResizeHome();
  
window.addEventListener('resize', WindowResizeHome);