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

window.addEventListener("click", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children)
    
    if (intersects[0]) {
        let response = game.tryMakeMove(intersects[0].object.positionCube)
        // console.log("risposta finale: " + response)
        if (response) intersects[0].object.add(response == "x" ? xMesh.clone() : oMesh.clone())
        // if (response) console.log(intersects[0].object.positionCube)
    }
})


//--- game ---//

class Game {
    #turn; get turn() { return this.#turn }

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

        console.log(this.#cube)
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

    tryMakeMove(pos) {
        // console.log("occupato? " + this.#isPositionOccupated(pos))
        if (this.#isPositionOccupated(pos) || this.finished) return undefined

        this.#cube[pos.x][pos.y][pos.z].occupied = true
        this.#cube[pos.x][pos.y][pos.z].type = this.#turn


        console.log(this.#checkWin())
        if (this.#checkWin()) {
            console.log("Ha vinto " + this.#turn)
            this.#gameEnd(this.#turn)
        }
        else {
            this.#changeTurn()
        }

        this.printFace()

        return this.#cube[pos.x][pos.y][pos.z].type
    }

    #isPositionOccupated(pos) {
        return this.#cube[pos.x][pos.y][pos.z].occupied
    }

    #checkWin() { // true if the player wins according to this.#turn, false if the player loses, undefined if nobody win
        let faces = this.#from3Dto2D()

        for (let facei = 0; facei < faces.length; facei++) {
            let face = faces[facei].face2D

            // check == 0 (false) -> check horizontally
            // check == 1 (true)  -> check vertically
            for (let check = 0; check < 2; check++) {
                for (let i = 0; i < face.length; i++) {
                    let referenceBox = (check) ? face[0][i].type : face[i][0].type
                    if (referenceBox == "") continue
            
                    let assign = true
                    for (let j = 0; j < face[i].length; j++)
                        if ((!check && face[i][j].type != referenceBox) || (check && face[j][i].type != referenceBox))
                            assign = false
                    if (!assign) continue
            
                    return referenceBox == this.#turn
                }
            }

            // check == 0 (false) -> check obliquely from left to right
            // check == 1 (true)  -> check obliquely from right to left
            for (let check = 0; check < 2; check++) {
                for (let i = 0; i < face.length; i++) {
                    let referenceBox = face[1][1].type
                    if (referenceBox == "") break
                    
                    if ((!check && face[i][i].type != referenceBox) || (check && face[i][2-i].type != referenceBox)) break
                    
                    return referenceBox == this.#turn
                }
            }
        }

        return undefined
    }


    #from3Dto2D() {
        let cubeFaces = [
            {cord: "y", num: 2, hasToSwitch: true, face2D: []},
            {cord: "z", num: 0, hasToSwitch: true, face2D: []},
            {cord: "x", num: 0, hasToSwitch: true, face2D: []},
            {cord: "y", num: 0, hasToSwitch: false, face2D: []},
            {cord: "x", num: 2, hasToSwitch: false, face2D: []},
            {cord: "z", num: 2, hasToSwitch: false, face2D: []}
        ]

        for (let face = 0; face < 6; face++) {
            for (let i = 0; i < 3; i++) {
                cubeFaces[face].face2D[i] = []
                for (let j = 0; j < 3; j++) 
                    if (cubeFaces[face].cord == "x")
                        cubeFaces[face].face2D[i][j] = this.#cube[cubeFaces[face].num][j][i]

                    else if (cubeFaces[face].cord == "y")
                        cubeFaces[face].face2D[i][j] = this.#cube[j][cubeFaces[face].num][i]

                    else if (cubeFaces[face].cord == "z")
                        cubeFaces[face].face2D[i][j] = this.#cube[j][i][cubeFaces[face].num]   
            }
        }

        cubeFaces.forEach((cubeFace) => {
            if (cubeFace.hasToSwitch) {
                if (cubeFace.cord == "x" && cubeFace.num == 0) {
                    cubeFace.face2D.forEach((cubeRow) => {
                        let cubeRow0 = cubeRow[0]

                        cubeRow[0] = cubeRow[2]
                        cubeRow[2] = cubeRow0
                    })

                } else {
                    let cubeFace0 = cubeFace.face2D[0].slice()

                    cubeFace.face2D[0] = cubeFace.face2D[2].slice()
                    cubeFace.face2D[2] = cubeFace0
                }
            }

            delete cubeFace.hasToSwitch
        })

        return cubeFaces
    }

    #from3Dto1D() {
        let cubeFaces = this.#from3Dto2D()
        let cube1D = []

        cubeFaces.forEach((cubeFace) => {
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++)
                    cube1D.push(cubeFace.face2D[i][j])
        })

        return cube1D
    }

    printFace() {
        let cube1D = this.#from3Dto1D()
        cube1D.forEach((box, i) => {
            cubes2D[i].innerHTML = box.type
        })
    }


    #changeTurn() {

        // console.log("prima del cambio turno: " + this.#turn)

        this.#turn = (this.#turn == "x") ? this.#turn = "o" : this.#turn = "x"


        // console.log("dopo del cambio turno: " + this.#turn)
    }


    #gameEnd(win) {

        console.log("vince: "+ win)

        this.#finished = true
        this.#finishedAtTime = new Date()

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


// camera.position.set(6, 4, 12);

camera.position.set(0, 0, 15);

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





let cubes2D = document.getElementsByClassName("box")

// console.log(cubes2D)

for (var i = 0; i < cubes2D.length; i++) {
    cubes2D[i].innerHTML = i
}