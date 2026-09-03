/* =========================================================
   EDUBRIDGE
   REMY 3D SIGN LANGUAGE AVATAR
   FULL VERSION
   T-POSE -> SIGNING POSITION -> FINGER ANIMATION
   ES-MODULE VERSION (three@0.160.0 via importmap)
   ========================================================= */

import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';


/* =========================================================
   GLOBALS
   ========================================================= */

let scene = null;
let camera = null;
let renderer = null;
let avatar = null;

let clock = null;
let animationFrame = null;

let mixer = null;
let currentAction = null;

let remyLoaded = false;


/* =========================================================
   REMY BONES
   ========================================================= */

const remyBones = {

    rightShoulder: null,
    rightArm: null,
    rightForeArm: null,
    rightHand: null,

    leftShoulder: null,
    leftArm: null,
    leftForeArm: null,
    leftHand: null,

    rightThumb: [],
    rightIndex: [],
    rightMiddle: [],
    rightRing: [],
    rightPinky: [],

    leftThumb: [],
    leftIndex: [],
    leftMiddle: [],
    leftRing: [],
    leftPinky: []
};


/* =========================================================
   REST POSE
   ========================================================= */

const restPose = new Map();


/* =========================================================
   CURRENT SIGN
   ========================================================= */

let currentSignKey = "A";

let currentSignPose = null;


/* =========================================================
   SIGN ANIMATION
   ========================================================= */

const signAnimation = {

    active: false,

    startTime: 0,

    duration: 1000,

    pose: null
};


/* =========================================================
   AUTOMATIC TEST
   ========================================================= */

const handTest = {

    active: false,

    startTime: 0,

    duration: 5000
};


/* =========================================================
   MODEL
   ========================================================= */

const REMY_PATH =
    "./models/Remy.fbx";

const TARGET_MODEL_HEIGHT =
    3.0;


/* =========================================================
   CAMERA
   ========================================================= */

let cameraAngle = 0;

let cameraDistance = 5;

let cameraHeight = 1.55;

const cameraTarget =
    new THREE.Vector3(
        0,
        1.5,
        0
    );


/* =========================================================
   EASING
   ========================================================= */

function easeInOut(t) {

    t = Math.max(
        0,
        Math.min(1, t)
    );

    if (t < 0.5) {

        return 2 * t * t;
    }

    return 1 -
        Math.pow(
            -2 * t + 2,
            2
        ) / 2;
}


/* =========================================================
   INIT
   ========================================================= */

let initialized = false;

function init() {

    if (initialized) {

        console.warn(
            "EduAccess: init() already called, skipping duplicate."
        );

        return;
    }

    initialized = true;

    console.log(
        "========================================"
    );

    console.log(
        "EDUBRIDGE REMY AVATAR"
    );

    console.log(
        "T-POSE ANIMATION VERSION"
    );

    console.log(
        "========================================"
    );


    const container =
        document.getElementById(
            "avatar-container"
        );


    if (!container) {

        console.error(
            "avatar-container not found"
        );

        return;
    }


    container.innerHTML = "";


    container.style.position =
        "relative";


    container.style.width =
        "100%";


    container.style.height =
        "100%";


    container.style.minHeight =
        "500px";


    container.style.overflow =
        "hidden";


    /* =====================================================
       CLOCK
       ===================================================== */

    clock =
        new THREE.Clock();


    /* =====================================================
       SCENE
       ===================================================== */

    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0xf1f5ff
        );


    /* =====================================================
       CAMERA
       ===================================================== */

    const width =
        container.clientWidth ||
        600;


    const height =
        container.clientHeight ||
        500;


    camera =
        new THREE.PerspectiveCamera(
            32,
            width / height,
            0.1,
            100
        );


    camera.position.set(
        0,
        cameraHeight,
        cameraDistance
    );


    camera.lookAt(
        cameraTarget
    );


    /* =====================================================
       RENDERER
       ===================================================== */

    renderer =
        new THREE.WebGLRenderer({

            antialias: true,

            alpha: true,

            powerPreference:
                "high-performance"
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );


    renderer.setSize(
        width,
        height
    );


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;


    renderer.toneMappingExposure =
        1.05;


    renderer.shadowMap.enabled =
        true;


    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    container.appendChild(
        renderer.domElement
    );


    /* =====================================================
       LIGHTING
       ===================================================== */

    createLighting();


    /* =====================================================
       FLOOR
       ===================================================== */

    createFloor();


    /* =====================================================
       CONTROLS
       ===================================================== */

    setupControls(
        renderer.domElement
    );


    /* =====================================================
       RESIZE
       ===================================================== */

    window.addEventListener(
        "resize",
        resizeAvatar
    );


    /* =====================================================
       LOAD REMY
       ===================================================== */

    loadRemy();


    /* =====================================================
       LOOP
       ===================================================== */

    animate();
}


/* =========================================================
   LOAD REMY
   ========================================================= */

function loadRemy() {

    console.log(
        "Loading Remy.fbx..."
    );


    try {

        const loader =
            new FBXLoader();


        loader.load(

            REMY_PATH,


            function(model) {

                onRemyLoaded(
                    model
                );
            },


            function(xhr) {

                if (
                    xhr.total
                ) {

                    const percent =
                        Math.round(
                            (
                                xhr.loaded /
                                xhr.total
                            ) * 100
                        );


                    console.log(
                        "Remy:",
                        percent + "%"
                    );

                } else if (
                    xhr.loaded
                ) {

                    console.log(
                        "Remy loaded bytes:",
                        xhr.loaded
                    );
                }
            },


            function(error) {

                console.error(
                    "REMY LOAD ERROR",
                    error
                );


                showError(
                    "Unable to load models/Remy.fbx — serve the site over http (e.g. npx serve .) and check the file exists."
                );
            }
        );

    } catch (
        error
    ) {

        console.error(
            "FBXLoader init error:",
            error
        );


        showError(
            "3D loader failed to start."
        );
    }
}


/* =========================================================
   REMY LOADED
   ========================================================= */

function onRemyLoaded(model) {

    console.log(
        "========================================"
    );

    console.log(
        "REMY LOADED SUCCESSFULLY"
    );

    console.log(
        "========================================"
    );


    avatar =
        model;


    remyLoaded =
        true;


    normalizeModel(
        avatar
    );


    setupMaterials(
        avatar
    );


    centerModel(
        avatar
    );


    scene.add(
        avatar
    );


    inspectSkeleton(
        avatar
    );


    buildBoneMap(
        avatar
    );

    // Create procedural fallback if FBX bones missing
    if (!hasFBXBones()) {
        console.warn("FBX bones not found, creating procedural arm fallback");
        createProceduralArm();
    }


    saveRestPose(
        avatar
    );


    setupFBXAnimations(
        avatar
    );


    setupCameraForModel(
        avatar
    );


    printBoneSummary();


    console.log(
        "========================================"
    );

    console.log(
        "REMY READY"
    );

    console.log(
        "========================================"
    );


    /*
       Automatic T-pose test.
    */

    setTimeout(
        function() {

            startFullBodyTest();

        },
        1200
    );
}


/* =========================================================
   BONE SUMMARY (debug helper — was missing, crashed ready)
   ========================================================= */

function printBoneSummary() {

    console.log(
        "----------------------------------------"
    );

    console.log(
        "BONE SUMMARY"
    );

    console.log(
        "RightArm:",
        remyBones.rightArm
            ? remyBones.rightArm.name
            : "MISSING"
    );

    console.log(
        "RightForeArm:",
        remyBones.rightForeArm
            ? remyBones.rightForeArm.name
            : "MISSING"
    );

    console.log(
        "RightHand:",
        remyBones.rightHand
            ? remyBones.rightHand.name
            : "MISSING"
    );

    console.log(
        "Right fingers (thumb/index/middle/ring/pinky):",
        remyBones.rightThumb.length,
        remyBones.rightIndex.length,
        remyBones.rightMiddle.length,
        remyBones.rightRing.length,
        remyBones.rightPinky.length
    );

    console.log(
        "----------------------------------------"
    );
}


/* =========================================================
   NORMALIZE
   ========================================================= */

function normalizeModel(model) {

    const box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const size =
        box.getSize(
            new THREE.Vector3()
        );


    if (
        size.y <= 0
    ) {

        return;
    }


    const scale =
        TARGET_MODEL_HEIGHT /
        size.y;


    model.scale.set(
        scale,
        scale,
        scale
    );
}


/* =========================================================
   MATERIALS
   ========================================================= */

function setupMaterials(model) {

    model.traverse(
        function(object) {

            if (
                !object.isMesh
            ) {

                return;
            }


            object.castShadow =
                true;


            object.receiveShadow =
                true;


            if (
                !object.material
            ) {

                return;
            }


            const materials =
                Array.isArray(
                    object.material
                )
                    ? object.material
                    : [
                        object.material
                    ];


            materials.forEach(
                function(material) {

                    material.side =
                        THREE.DoubleSide;


                    material.needsUpdate =
                        true;


                    if (
                        material.map
                    ) {

                        material.map.colorSpace =
                            THREE.SRGBColorSpace;
                    }
                }
            );
        }
    );
}


/* =========================================================
   CENTER MODEL
   ========================================================= */

function centerModel(model) {

    const box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const center =
        box.getCenter(
            new THREE.Vector3()
        );


    model.position.x -=
        center.x;


    model.position.z -=
        center.z;


    model.position.y -=
        box.min.y;
}


/* =========================================================
   LIGHTING
   ========================================================= */

function createLighting() {

    const hemisphere =
        new THREE.HemisphereLight(
            0xffffff,
            0xb8c1d9,
            2
        );


    scene.add(
        hemisphere
    );


    const key =
        new THREE.DirectionalLight(
            0xffffff,
            2.8
        );


    key.position.set(
        4,
        7,
        6
    );


    key.castShadow =
        true;


    key.shadow.mapSize.width =
        2048;


    key.shadow.mapSize.height =
        2048;


    scene.add(
        key
    );


    const fill =
        new THREE.DirectionalLight(
            0xffffff,
            0.9
        );


    fill.position.set(
        -5,
        4,
        4
    );


    scene.add(
        fill
    );


    const back =
        new THREE.DirectionalLight(
            0xffffff,
            0.9
        );


    back.position.set(
        0,
        5,
        -6
    );


    scene.add(
        back
    );
}


/* =========================================================
   FLOOR
   ========================================================= */

function createFloor() {

    const geometry =
        new THREE.CircleGeometry(
            3.5,
            64
        );


    const material =
        new THREE.MeshStandardMaterial({

            color:
                0xd8e0ef,

            roughness:
                0.9,

            metalness:
                0
        });


    const floor =
        new THREE.Mesh(
            geometry,
            material
        );


    floor.rotation.x =
        -Math.PI / 2;


    floor.position.y =
        -0.01;


    floor.receiveShadow =
        true;


    scene.add(
        floor
    );
}


/* =========================================================
   INSPECT SKELETON
   ========================================================= */

function inspectSkeleton(model) {

    const bonesFound = [];


    model.traverse(
        function(object) {

            if (
                object.isBone
            ) {

                bonesFound.push(
                    object
                );
            }
        }
    );


    console.log(
        "========================================"
    );


    console.log(
        "REMY SKELETON"
    );


    console.log(
        "TOTAL BONES:",
        bonesFound.length
    );


    console.log(
        "========================================"
    );


    bonesFound.forEach(
        function(bone, index) {

            console.log(
                index +
                " : " +
                bone.name
            );
        }
    );
}


/* =========================================================
   FIND BONE (Mixamo + generic naming support)
   Handles: RightArm, mixamorig:RightArm,
   mixamorigRightArm, mixamorig_RightArm, etc.
   ========================================================= */

function normalizeBoneName(name) {

    return String(
        name || ""
    )
        .toLowerCase()
        .replace(
            /^mixamorig[:_\s-]*/,
            ""
        )
        .replace(
            /[\s_:\-]+/g,
            ""
        );
}

function findBone(model, name) {
    let result = null;

    const target =
        normalizeBoneName(
            name
        );

    model.traverse(function(object) {
        if (result) return;
        if (!object.isBone) return;

        if (
            normalizeBoneName(
                object.name
            ) === target
        ) {
            result = object;
        }
    });

    if (!result) {
        console.warn(`Bone not found: ${name} (normalized: ${target})`);
    }

    return result;
}


/* =========================================================
   FIND FINGER (Mixamo RightHandIndex1 style + generics)
   ========================================================= */

function findFinger(model, side, finger) {
    const chain = [];

    const sidePrefix = side === "right" ? "Right" : "Left";

    // Candidate logical names — findBone() normalizes away
    // the mixamorig prefix, so "RightHandIndex1" matches
    // "mixamorigRightHandIndex1" in the Remy model.
    const fingerNames = [
        `${sidePrefix}Hand${finger}1`, `${sidePrefix}Hand${finger}2`, `${sidePrefix}Hand${finger}3`, `${sidePrefix}Hand${finger}4`,
        `${sidePrefix}Hand${finger}01`, `${sidePrefix}Hand${finger}02`, `${sidePrefix}Hand${finger}03`, `${sidePrefix}Hand${finger}04`,
        `${finger}1`, `${finger}2`, `${finger}3`, `${finger}4`
    ];

    const seen = new Set();

    for (let i = 0; i < fingerNames.length; i++) {
        const name = fingerNames[i];
        const bone = findBone(model, name);
        if (bone && !seen.has(bone.uuid)) {
            seen.add(bone.uuid);
            chain.push(bone);
            if (chain.length >= 4) break;
        }
    }

    // Sort by trailing number so 1->2->3->4 order is kept
    // (findBone traversal order is not guaranteed).
    chain.sort(function(a, b) {
        const na = parseInt((a.name.match(/(\d+)$/) || [0, 0])[1], 10) || 0;
        const nb = parseInt((b.name.match(/(\d+)$/) || [0, 0])[1], 10) || 0;
        return na - nb;
    });

    if (chain.length === 0) {
        console.warn(`No finger bones found for ${side} ${finger}`);
    } else {
        console.log(`Found ${chain.length} bones for ${side} ${finger}:`, chain.map(b => b.name));
    }

    return chain.slice(0, 4);
}


/* =========================================================
   BUILD BONE MAP
   ========================================================= */

function buildBoneMap(model) {

    console.log("Building bone map...");

    /* -----------------------------------------------------
       RIGHT ARM
       ----------------------------------------------------- */

    remyBones.rightShoulder = findBone(model, "RightShoulder");
    remyBones.rightArm = findBone(model, "RightArm");
    remyBones.rightForeArm = findBone(model, "RightForeArm");
    remyBones.rightHand = findBone(model, "RightHand");

    /* -----------------------------------------------------
       LEFT ARM
       ----------------------------------------------------- */

    remyBones.leftShoulder = findBone(model, "LeftShoulder");
    remyBones.leftArm = findBone(model, "LeftArm");
    remyBones.leftForeArm = findBone(model, "LeftForeArm");
    remyBones.leftHand = findBone(model, "LeftHand");

    /* -----------------------------------------------------
       RIGHT FINGERS
       ----------------------------------------------------- */

    remyBones.rightThumb = findFinger(model, "right", "Thumb");
    remyBones.rightIndex = findFinger(model, "right", "Index");
    remyBones.rightMiddle = findFinger(model, "right", "Middle");
    remyBones.rightRing = findFinger(model, "right", "Ring");
    remyBones.rightPinky = findFinger(model, "right", "Pinky");

    /* -----------------------------------------------------
       LEFT FINGERS
       ----------------------------------------------------- */

    remyBones.leftThumb = findFinger(model, "left", "Thumb");
    remyBones.leftIndex = findFinger(model, "left", "Index");
    remyBones.leftMiddle = findFinger(model, "left", "Middle");
    remyBones.leftRing = findFinger(model, "left", "Ring");
    remyBones.leftPinky = findFinger(model, "left", "Pinky");

    // Verify critical bones
    const criticalBones = {
        'Right Arm': remyBones.rightArm,
        'Right ForeArm': remyBones.rightForeArm,
        'Right Hand': remyBones.rightHand,
        'Left Arm': remyBones.leftArm,
        'Left ForeArm': remyBones.leftForeArm,
        'Left Hand': remyBones.leftHand
    };

    let missingCritical = [];
    for (const [name, bone] of Object.entries(criticalBones)) {
        if (!bone) missingCritical.push(name);
    }

    if (missingCritical.length > 0) {
        console.error("MISSING CRITICAL BONES:", missingCritical);
        console.log("Available bones in model:");
        model.traverse(obj => {
            if (obj.isBone) console.log("  -", obj.name);
        });
    } else {
        console.log("All critical bones found successfully!");
    }
}


/* =========================================================
   SAVE REST POSE
   ========================================================= */

function saveRestPose(model) {

    restPose.clear();


    model.traverse(
        function(object) {

            if (
                object.isBone
            ) {

                restPose.set(
                    object.uuid,
                    {
                        quaternion:
                            object.quaternion.clone(),

                        rotation:
                            object.rotation.clone()
                    }
                );
            }
        }
    );


    console.log(
        "Original T-pose saved."
    );
}


/* =========================================================
   RESTORE BONE
   ========================================================= */

function restoreBone(bone) {

    if (
        !bone
    ) {

        return;
    }


    const rest =
        restPose.get(
            bone.uuid
        );


    if (
        !rest
    ) {

        return;
    }


    bone.quaternion.copy(
        rest.quaternion
    );
}


/* =========================================================
   RESTORE FINGER
   ========================================================= */

function restoreFinger(finger) {

    if (
        !finger
    ) {

        return;
    }


    finger.forEach(
        function(bone) {

            restoreBone(
                bone
            );
        }
    );
}


/* =========================================================
   RESTORE COMPLETE BODY
   ========================================================= */

function restoreBody() {

    restoreBone(
        remyBones.rightArm
    );

    restoreBone(
        remyBones.rightForeArm
    );

    restoreBone(
        remyBones.rightHand
    );


    restoreBone(
        remyBones.leftArm
    );

    restoreBone(
        remyBones.leftForeArm
    );

    restoreBone(
        remyBones.leftHand
    );


    restoreFinger(
        remyBones.rightThumb
    );

    restoreFinger(
        remyBones.rightIndex
    );

    restoreFinger(
        remyBones.rightMiddle
    );

    restoreFinger(
        remyBones.rightRing
    );

    restoreFinger(
        remyBones.rightPinky
    );


    restoreFinger(
        remyBones.leftThumb
    );

    restoreFinger(
        remyBones.leftIndex
    );

    restoreFinger(
        remyBones.leftMiddle
    );

    restoreFinger(
        remyBones.leftRing
    );

    restoreFinger(
        remyBones.leftPinky
    );
}


/* =========================================================
   RESTORE HANDS
   ========================================================= */

function restoreHands() {

    restoreFinger(
        remyBones.rightThumb
    );

    restoreFinger(
        remyBones.rightIndex
    );

    restoreFinger(
        remyBones.rightMiddle
    );

    restoreFinger(
        remyBones.rightRing
    );

    restoreFinger(
        remyBones.rightPinky
    );


    restoreFinger(
        remyBones.leftThumb
    );

    restoreFinger(
        remyBones.leftIndex
    );

    restoreFinger(
        remyBones.leftMiddle
    );

    restoreFinger(
        remyBones.leftRing
    );

    restoreFinger(
        remyBones.leftPinky
    );
}


/* =========================================================
   RELATIVE BONE ROTATION
   ========================================================= */

function rotateBoneRelative(
    bone,
    x,
    y,
    z,
    progress
) {

    if (
        !bone
    ) {

        return;
    }


    const rest =
        restPose.get(
            bone.uuid
        );


    if (
        !rest
    ) {

        return;
    }


    const eased =
        easeInOut(
            progress
        );


    const q =
        new THREE.Quaternion();


    const euler =
        new THREE.Euler(
            x * eased,
            y * eased,
            z * eased,
            "XYZ"
        );


    q.setFromEuler(
        euler
    );


    bone.quaternion.copy(
        rest.quaternion
    );


    bone.quaternion.multiply(
        q
    );
}


/* =========================================================
   CHECK IF FBX BONES ARE AVAILABLE
   ========================================================= */

function hasFBXBones() {
    return remyBones.rightArm && remyBones.rightForeArm && remyBones.rightHand;
}

/* =========================================================
   APPLY SIGNING ARM (FBX or Procedural)
   ========================================================= */

function applySigningArm(side, progress) {
    if (side !== "right") return;

    if (hasFBXBones()) {
        rotateBoneRelative(remyBones.rightArm, 0.00, 0.25, -1.15, progress);
        rotateBoneRelative(remyBones.rightForeArm, 0.15, -0.35, -0.55, progress);
        rotateBoneRelative(remyBones.rightHand, -0.25, 0.25, -0.15, progress);
    }
}

/* =========================================================
   FINGER BEND (FBX only)
   ========================================================= */

function bendFinger(finger, amount, progress) {
    if (!finger || finger.length === 0) return;

    const eased = easeInOut(progress);

    finger.forEach(function(bone, index) {
        const rest = restPose.get(bone.uuid);
        if (!rest) return;

        const strength = 1 - index * 0.08;
        const bend = amount * strength * eased;

        const q = new THREE.Quaternion();
        const euler = new THREE.Euler(0, 0, bend, "XYZ");
        q.setFromEuler(euler);

        bone.quaternion.copy(rest.quaternion);
        bone.quaternion.multiply(q);
    });
}

/* =========================================================
   APPLY HAND POSE (FBX or Procedural)
   ========================================================= */

function applyHandPose(side, pose, progress) {
    if (!pose || side !== "right") return;

    if (hasFBXBones()) {
        bendFinger(remyBones.rightThumb, pose.thumb || 0, progress);
        bendFinger(remyBones.rightIndex, pose.index || 0, progress);
        bendFinger(remyBones.rightMiddle, pose.middle || 0, progress);
        bendFinger(remyBones.rightRing, pose.ring || 0, progress);
        bendFinger(remyBones.rightPinky, pose.pinky || 0, progress);
    }
}

/* =========================================================
   APPLY COMPLETE SIGN (FBX or Procedural)
   ========================================================= */

function applySignPose(pose, progress) {
    if (hasFBXBones()) {
        applySigningArm("right", progress);
        if (pose && pose.right) applyHandPose("right", pose.right, progress);
    } else {
        applyProceduralSign(pose, progress);
    }
}


/* =========================================================
   SIGN POSES
   ========================================================= */

const SIGN_POSES = {

    A: {

        right: {

            thumb: -0.60,

            index: -1.60,

            middle: -1.60,

            ring: -1.60,

            pinky: -1.60
        }
    },


    B: {

        right: {

            thumb: -0.40,

            index: 0,

            middle: 0,

            ring: 0,

            pinky: 0
        }
    },


    C: {

        right: {

            thumb: -0.50,

            index: -0.65,

            middle: -0.65,

            ring: -0.65,

            pinky: -0.65
        }
    },


    D: {

        right: {

            thumb: -0.35,

            index: 0,

            middle: -1.60,

            ring: -1.60,

            pinky: -1.60
        }
    },


    E: {

        right: {

            thumb: -0.60,

            index: -1.20,

            middle: -1.20,

            ring: -1.20,

            pinky: -1.20
        }
    },


    F: {

        right: {

            thumb: -0.30,

            index: -0.40,

            middle: 0,

            ring: 0,

            pinky: 0
        }
    },


    G: {

        right: {

            thumb: -0.30,

            index: 0,

            middle: -1.50,

            ring: -1.50,

            pinky: -1.50
        }
    },


    H: {

        right: {

            thumb: -0.30,

            index: 0,

            middle: 0,

            ring: -1.50,

            pinky: -1.50
        }
    },


    I: {

        right: {

            thumb: -0.35,

            index: -1.50,

            middle: -1.50,

            ring: -1.50,

            pinky: 0
        }
    },


    J: {

        right: {

            thumb: -0.35,

            index: -1.50,

            middle: -1.50,

            ring: -1.50,

            pinky: 0
        }
    },


    K: {

        right: {

            thumb: -0.30,

            index: 0,

            middle: 0,

            ring: -1.50,

            pinky: -1.50
        }
    },


    L: {

        right: {

            thumb: 0,

            index: 0,

            middle: -1.50,

            ring: -1.50,

            pinky: -1.50
        }
    },


    M: {

        right: {

            thumb: -0.60,

            index: -1.20,

            middle: -1.20,

            ring: -1.20,

            pinky: -1.20
        }
    },


    N: {

        right: {

            thumb: -0.60,

            index: -0.90,

            middle: -0.90,

            ring: -1.10,

            pinky: -1.10
        }
    },


    O: {

        right: {

            thumb: -0.55,

            index: -0.65,

            middle: -0.65,

            ring: -0.65,

            pinky: -0.65
        }
    },


    P: {

        right: {

            thumb: -0.30,

            index: 0,

            middle: 0,

            ring: -1.50,

            pinky: -1.50
        }
    },


    Q: {

        right: {

            thumb: -0.30,

            index: 0,

            middle: -1.50,

            ring: -1.50,

            pinky: -1.50
        }
    },


    R: {

        right: {

            thumb: -0.35,

            index: 0,

            middle: 0,

            ring: -1.50,

            pinky: -1.50
        }
    },


    S: {

        right: {

            thumb: -0.60,

            index: -1.60,

            middle: -1.60,

            ring: -1.60,

            pinky: -1.60
        }
    },


    T: {

        right: {

            thumb: -0.60,

            index: -0.90,

            middle: -1.60,

            ring: -1.60,

            pinky: -1.60
        }
    },


    U: {

        right: {

            thumb: -0.35,

            index: 0,

            middle: 0,

            ring: -1.50,

            pinky: -1.50
        }
    },


    V: {

        right: {

            thumb: -0.35,

            index: 0,

            middle: 0,

            ring: -1.50,

            pinky: -1.50
        }
    },


    W: {

        right: {

            thumb: -0.30,

            index: 0,

            middle: 0,

            ring: 0,

            pinky: -1.50
        }
    },


    X: {

        right: {

            thumb: -0.35,

            index: -0.70,

            middle: -1.50,

            ring: -1.50,

            pinky: -1.50
        }
    },


    Y: {

        right: {

            thumb: 0,

            index: -1.50,

            middle: -1.50,

            ring: -1.50,

            pinky: 0
        }
    },


    Z: {

        right: {

            thumb: -0.35,

            index: 0,

            middle: -1.50,

            ring: -1.50,

            pinky: -1.50
        }
    }
};


/* =========================================================
   GET SIGN
   ========================================================= */

function getSignPose(key) {

    const clean =
        String(
            key || ""
        )
            .trim()
            .toUpperCase();


    if (
        SIGN_POSES[clean]
    ) {

        return SIGN_POSES[
            clean
        ];
    }


    const first =
        clean.charAt(0);


    if (
        SIGN_POSES[first]
    ) {

        return SIGN_POSES[
            first
        ];
    }


    return SIGN_POSES.A;
}


/* =========================================================
   SET SIGN
   ========================================================= */

function setSign(key) {

    console.log(
        "EduAccess: setSign() ->",
        key
    );


    if (
        !remyLoaded
    ) {

        console.warn(
            "Remy is not loaded."
        );

        return;
    }


    /*
       Stop automatic test.
    */

    handTest.active =
        false;


    stopFBXAnimation();


    /*
       Save selected sign.
    */

    currentSignKey =
        key;


    currentSignPose =
        getSignPose(
            key
        );


    /*
       Start from T-pose.
    */

    restoreBody();


    /*
       Start complete animation.
    */

    signAnimation.active =
        true;


    signAnimation.startTime =
        performance.now();


    signAnimation.pose =
        currentSignPose;


    console.log(
        "Animating sign:",
        key
    );
}


/* =========================================================
   PLAY SIGN ANIMATION
   ========================================================= */

function playSignAnimation() {

    if (
        !remyLoaded
    ) {

        console.warn(
            "Remy not ready."
        );

        return;
    }


    let key =
        currentSignKey;


    /*
       Read existing app.js state (via window, module-safe).
    */

    try {

        const w =
            typeof window !==
            "undefined"
                ? window
                : null;


        if (
            w &&
            typeof w.SIGN_DATA !==
            "undefined" &&

            typeof w.currentLesson !==
            "undefined" &&

            typeof w.currentSignIndex !==
            "undefined"
        ) {

            const lesson =
                w.SIGN_DATA.lessons &&
                w.SIGN_DATA.lessons[
                    w.currentLesson
                ];


            if (
                lesson &&
                lesson.signs &&
                lesson.signs[
                    w.currentSignIndex
                ]
            ) {

                key =
                    lesson.signs[
                        w.currentSignIndex
                    ];
            }
        }

    } catch (
        error
    ) {

        console.warn(
            "Lesson information unavailable."
        );
    }


    if (
        !key
    ) {

        key =
            "A";
    }


    setSign(
        key
    );
}


/* =========================================================
   UPDATE SIGN ANIMATION
   ========================================================= */

function updateSignAnimation() {

    if (
        !signAnimation.active ||
        !signAnimation.pose
    ) {

        return;
    }


    const elapsed =
        performance.now() -
        signAnimation.startTime;


    const progress =
        Math.min(
            elapsed /
            signAnimation.duration,
            1
        );


    /*
       IMPORTANT:

       Restore original T-pose
       every frame.

       Then calculate the exact
       current animation position.
    */

    restoreAll();


    applySignPose(
        signAnimation.pose,
        progress
    );


    if (progress >= 1) {
        signAnimation.active = false;
        restoreAll();
        applySignPose(signAnimation.pose, 1);
    }
}


/* =========================================================
   FULL BODY TEST
   ========================================================= */

function startFullBodyTest() {

    if (
        !remyLoaded
    ) {

        return;
    }


    console.log(
        "========================================"
    );

    console.log(
        "FULL BODY TEST"
    );

    console.log(
        "T-POSE"
    );

    console.log(
        "    ↓"
    );

    console.log(
        "ARM DOWN"
    );

    console.log(
        "    ↓"
    );

    console.log(
        "HAND CLOSE"
    );

    console.log(
        "    ↓"
    );

    console.log(
        "HAND OPEN"
    );

    console.log(
        "========================================"
    );


    signAnimation.active =
        false;


    handTest.active =
        true;


    handTest.startTime =
        performance.now();


    restoreBody();
}


/* =========================================================
   UPDATE FULL BODY TEST
   ========================================================= */
function restoreAll() {
    if (hasFBXBones()) {
        restoreBody();
    } else {
        resetProceduralArm();
    }
}

function updateFullBodyTest() {

    if (!handTest.active) return;

    const elapsed = performance.now() - handTest.startTime;

    /* =====================================================
       PHASE 1
       T-POSE -> SIGNING ARM
       0 - 1500ms
       ===================================================== */

    if (elapsed < 1500) {
        const p = elapsed / 1500;
        restoreAll();
        applySigningArm("right", p);
        return;
    }

    /* =====================================================
       PHASE 2
       SIGNING ARM + CLOSE FINGERS
       1500 - 2500
       ===================================================== */

    if (elapsed < 2500) {
        const p = (elapsed - 1500) / 1000;
        restoreAll();
        applySigningArm("right", 1);
        applyHandPose("right", { thumb: -0.90, index: -2.0, middle: -2.0, ring: -2.0, pinky: -2.0 }, p);
        return;
    }

    /* =====================================================
       PHASE 3
       OPEN FINGERS
       2500 - 3500
       ===================================================== */

    if (elapsed < 3500) {
        const p = (elapsed - 2500) / 1000;
        restoreAll();
        applySigningArm("right", 1);
        applyHandPose("right", { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }, p);
        return;
    }

    /* =====================================================
       PHASE 4
       RETURN TO T-POSE
       3500 - 5000
       ===================================================== */

    if (elapsed < 5000) {
        const p = (elapsed - 3500) / 1500;
        restoreAll();
        applySigningArm("right", 1 - p);
        return;
    }

    /* =====================================================
       FINISH
       ===================================================== */

    handTest.active = false;
    restoreAll();

    console.log("FULL BODY TEST FINISHED");

    if (currentSignKey) {
        setTimeout(function() { setSign(currentSignKey); }, 300);
    }
}

/* =========================================================
   FBX ANIMATIONS
   ========================================================= */

function setupFBXAnimations(model) {

    if (
        !model.animations ||
        model.animations.length === 0
    ) {

        console.log(
            "No embedded FBX animations."
        );

        return;
    }


    console.log(
        "========================================"
    );


    console.log(
        "FBX ANIMATIONS"
    );


    console.log(
        "COUNT:",
        model.animations.length
    );


    model.animations.forEach(
        function(clip, index) {

            console.log(
                index +
                " : " +
                clip.name +
                " : " +
                clip.duration +
                " sec"
            );
        }
    );


    console.log(
        "========================================"
    );


    mixer =
        new THREE.AnimationMixer(
            model
        );
}


/* =========================================================
   PLAY FBX
   ========================================================= */

function playFBXAnimation() {

    if (
        !mixer ||
        !avatar ||
        !avatar.animations ||
        !avatar.animations.length
    ) {

        console.warn(
            "No FBX animation."
        );

        return;
    }


    handTest.active =
        false;


    signAnimation.active =
        false;


    stopFBXAnimation();


    const clip =
        avatar.animations[0];


    currentAction =
        mixer.clipAction(
            clip
        );


    currentAction.reset();


    currentAction.setLoop(
        THREE.LoopRepeat,
        Infinity
    );


    currentAction.play();


    console.log(
        "Playing FBX animation:",
        clip.name
    );
}


/* =========================================================
   STOP FBX
   ========================================================= */

function stopFBXAnimation() {

    if (
        !mixer
    ) {

        return;
    }


    mixer.stopAllAction();


    currentAction =
        null;
}


/* =========================================================
   CAMERA
   ========================================================= */

function setupCameraForModel(model) {

    const box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const size =
        box.getSize(
            new THREE.Vector3()
        );


    cameraTarget.set(
        0,
        size.y * 0.52,
        0
    );


    cameraHeight =
        size.y * 0.52;


    cameraDistance =
        Math.max(
            4,
            size.y * 1.65
        );


    camera.position.set(
        0,
        cameraHeight,
        cameraDistance
    );


    camera.lookAt(
        cameraTarget
    );
}


/* =========================================================
   RESET CAMERA
   ========================================================= */

function resetCamera() {

    cameraAngle =
        0;


    if (
        avatar
    ) {

        setupCameraForModel(
            avatar
        );
    }
}


/* =========================================================
   CONTROLS
   ========================================================= */

function setupControls(canvas) {

    let dragging =
        false;


    let lastX =
        0;


    let lastY =
        0;


    canvas.addEventListener(
        "mousedown",
        function(event) {

            dragging =
                true;


            lastX =
                event.clientX;


            lastY =
                event.clientY;


            canvas.style.cursor =
                "grabbing";
        }
    );


    canvas.addEventListener(
        "mousemove",
        function(event) {

            if (
                !dragging
            ) {

                return;
            }


            const dx =
                event.clientX -
                lastX;


            const dy =
                event.clientY -
                lastY;


            cameraAngle -=
                dx * 0.008;


            cameraHeight -=
                dy * 0.004;


            if (
                avatar
            ) {

                const box =
                    new THREE.Box3()
                        .setFromObject(
                            avatar
                        );


                const size =
                    box.getSize(
                        new THREE.Vector3()
                    );


                cameraHeight =
                    Math.max(
                        size.y * 0.25,

                        Math.min(
                            size.y * 0.80,
                            cameraHeight
                        )
                    );
            }


            lastX =
                event.clientX;


            lastY =
                event.clientY;
        }
    );


    canvas.addEventListener(
        "mouseup",
        function() {

            dragging =
                false;


            canvas.style.cursor =
                "grab";
        }
    );


    canvas.addEventListener(
        "mouseleave",
        function() {

            dragging =
                false;


            canvas.style.cursor =
                "grab";
        }
    );


    canvas.addEventListener(
        "wheel",
        function(event) {

            cameraDistance +=
                event.deltaY *
                0.004;


            cameraDistance =
                Math.max(
                    2.5,

                    Math.min(
                        9,
                        cameraDistance
                    )
                );


            event.preventDefault();

        },
        {
            passive: false
        }
    );


    canvas.style.cursor =
        "grab";
}


/* =========================================================
   UPDATE CAMERA
   ========================================================= */

function updateCamera() {

    if (
        !camera
    ) {

        return;
    }


    const x =
        Math.sin(
            cameraAngle
        ) *
        cameraDistance;


    const z =
        Math.cos(
            cameraAngle
        ) *
        cameraDistance;


    camera.position.set(
        x,
        cameraHeight,
        z
    );


    camera.lookAt(
        cameraTarget
    );
}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeAvatar() {

    const container =
        document.getElementById(
            "avatar-container"
        );


    if (
        !container ||
        !camera ||
        !renderer
    ) {

        return;
    }


    const width =
        container.clientWidth;


    const height =
        container.clientHeight;


    if (
        width <= 0 ||
        height <= 0
    ) {

        return;
    }


    camera.aspect =
        width /
        height;


    camera.updateProjectionMatrix();


    renderer.setSize(
        width,
        height
    );
}


/* =========================================================
   PROCEDURAL FALLBACK ARM (for when FBX bones missing)
   ========================================================= */

const proceduralArm = {
    rightArm: null,
    rightForeArm: null,
    rightHand: null,
    rightFingers: { thumb: [], index: [], middle: [], ring: [], pinky: [] },
    armGroup: null,
    created: false,
    // Rest pose rotations for reset
    restRotations: {}
};

function resetProceduralArm() {
    if (!proceduralArm.created) return;
    
    // Reset to T-pose
    proceduralArm.rightArm.rotation.set(0, 0, Math.PI / 2);
    proceduralArm.rightForeArm.rotation.set(0, 0, 0);
    proceduralArm.rightHand.rotation.set(0, 0, 0);
    
    Object.values(proceduralArm.rightFingers).forEach(finger => {
        finger.forEach(segment => {
            segment.rotation.set(0, 0, 0);
        });
    });
}

function createProceduralArm() {
    if (proceduralArm.created) return;

    const armGroup = new THREE.Group();
    armGroup.name = "ProceduralArm";
    proceduralArm.armGroup = armGroup;

    // Upper arm
    const upperGeometry = new THREE.CapsuleGeometry(0.08, 0.35, 4, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdbac,
        roughness: 0.7,
        metalness: 0.1
    });

    proceduralArm.rightArm = new THREE.Mesh(upperGeometry, armMaterial);
    proceduralArm.rightArm.position.y = 0.175;
    proceduralArm.rightArm.castShadow = true;
    armGroup.add(proceduralArm.rightArm);

    // Forearm
    const foreGeometry = new THREE.CapsuleGeometry(0.07, 0.3, 4, 8);
    proceduralArm.rightForeArm = new THREE.Mesh(foreGeometry, armMaterial);
    proceduralArm.rightForeArm.position.y = -0.35;
    proceduralArm.rightForeArm.castShadow = true;
    proceduralArm.rightArm.add(proceduralArm.rightForeArm);

    // Hand
    const handGeometry = new THREE.BoxGeometry(0.12, 0.05, 0.18);
    proceduralArm.rightHand = new THREE.Mesh(handGeometry, armMaterial);
    proceduralArm.rightHand.position.y = -0.32;
    proceduralArm.rightHand.castShadow = true;
    proceduralArm.rightForeArm.add(proceduralArm.rightHand);

    // Fingers (simple boxes)
    const fingerMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdbac,
        roughness: 0.7,
        metalness: 0.1
    });

    const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    const fingerPositions = {
        thumb: { x: 0.07, y: 0, z: 0.04, rotZ: -0.5 },
        index: { x: 0.035, y: 0, z: 0.08, rotZ: 0 },
        middle: { x: 0, y: 0, z: 0.09, rotZ: 0 },
        ring: { x: -0.035, y: 0, z: 0.08, rotZ: 0 },
        pinky: { x: -0.07, y: 0, z: 0.06, rotZ: 0 }
    };

    fingerNames.forEach(name => {
        const fingerGroup = new THREE.Group();
        const pos = fingerPositions[name];

        for (let i = 0; i < 3; i++) {
            const segGeometry = new THREE.CapsuleGeometry(0.018, 0.055, 4, 8);
            const segment = new THREE.Mesh(segGeometry, fingerMaterial);
            segment.position.y = -0.0275 - i * 0.055;
            segment.castShadow = true;
            fingerGroup.add(segment);
            proceduralArm.rightFingers[name].push(segment);
        }

        fingerGroup.position.set(pos.x, -0.025, pos.z);
        fingerGroup.rotation.z = pos.rotZ;
        proceduralArm.rightHand.add(fingerGroup);
    });

    // Position arm at shoulder - try to use avatar position if available
    let shoulderX = -0.25;
    let shoulderY = 1.4;
    let shoulderZ = 0;

    if (avatar) {
        // Try to find right shoulder position
        const shoulderBone = findBone(avatar, "RightShoulder");
        if (shoulderBone) {
            const worldPos = new THREE.Vector3();
            shoulderBone.getWorldPosition(worldPos);
            shoulderX = worldPos.x;
            shoulderY = worldPos.y;
            shoulderZ = worldPos.z;
        } else {
            // Fallback: estimate from model bounds
            const box = new THREE.Box3().setFromObject(avatar);
            const size = box.getSize(new THREE.Vector3());
            shoulderX = -size.x * 0.35;
            shoulderY = size.y * 0.5;
            shoulderZ = 0;
        }
    }

    armGroup.position.set(shoulderX, shoulderY, shoulderZ);
    armGroup.rotation.z = Math.PI / 2;

    scene.add(armGroup);
    proceduralArm.created = true;

    console.log("Procedural arm created as fallback at:", shoulderX, shoulderY, shoulderZ);
}

function applyProceduralSign(pose, progress) {
    if (!proceduralArm.created) createProceduralArm();

    const eased = easeInOut(progress);

    // Arm comes down from T-pose
    proceduralArm.rightArm.rotation.z = Math.PI / 2 - 1.15 * eased;
    proceduralArm.rightArm.rotation.y = 0.25 * eased;

    // Forearm bends
    proceduralArm.rightForeArm.rotation.x = 0.15 * eased;
    proceduralArm.rightForeArm.rotation.y = -0.35 * eased;
    proceduralArm.rightForeArm.rotation.z = -0.55 * eased;

    // Hand rotates
    proceduralArm.rightHand.rotation.x = -0.25 * eased;
    proceduralArm.rightHand.rotation.y = 0.25 * eased;
    proceduralArm.rightHand.rotation.z = -0.15 * eased;

    // Finger bending
    if (pose && pose.right) {
        const fingerBends = {
            thumb: pose.right.thumb || 0,
            index: pose.right.index || 0,
            middle: pose.right.middle || 0,
            ring: pose.right.ring || 0,
            pinky: pose.right.pinky || 0
        };

        Object.keys(fingerBends).forEach(name => {
            const amount = fingerBends[name];
            proceduralArm.rightFingers[name].forEach((segment, idx) => {
                const strength = 1 - idx * 0.15;
                segment.rotation.x = amount * strength * eased;
            });
        });
    }
}


/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    const container =
        document.getElementById(
            "avatar-container"
        );


    if (
        !container
    ) {

        return;
    }


    const box =
        document.createElement(
            "div"
        );


    box.style.position =
        "absolute";


    box.style.left =
        "50%";


    box.style.top =
        "50%";


    box.style.transform =
        "translate(-50%, -50%)";


    box.style.padding =
        "20px";


    box.style.background =
        "#ffffff";


    box.style.color =
        "#dc2626";


    box.style.fontWeight =
        "700";


    box.style.borderRadius =
        "14px";


    box.style.boxShadow =
        "0 10px 30px rgba(0,0,0,.15)";


    box.style.zIndex =
        "100";


    box.textContent =
        message;


    container.appendChild(
        box
    );
}


/* =========================================================
   MAIN LOOP
   ========================================================= */

function animate() {

    animationFrame =
        requestAnimationFrame(
            animate
        );


    const delta =
        clock
            ? clock.getDelta()
            : 0;


    /*
       FBX animation.
    */

    if (
        mixer
    ) {

        mixer.update(
            delta
        );
    }


    /*
       Automatic test.
    */

    if (
        handTest.active
    ) {

        updateFullBodyTest();

    } else {

        /*
           Normal sign animation.
        */

        updateSignAnimation();
    }


    /*
       Camera.
    */

    updateCamera();


    /*
       Render.
    */

    if (
        renderer &&
        scene &&
        camera
    ) {

        renderer.render(
            scene,
            camera
        );
    }
}


/* =========================================================
   DISPOSE
   ========================================================= */

function dispose() {

    if (
        animationFrame
    ) {

        cancelAnimationFrame(
            animationFrame
        );


        animationFrame =
            null;
    }


    if (
        mixer
    ) {

        mixer.stopAllAction();

        mixer =
            null;
    }


    if (
        renderer
    ) {

        renderer.dispose();
    }


    if (
        scene
    ) {

        scene.traverse(
            function(object) {

                if (
                    object.geometry
                ) {

                    object.geometry.dispose();
                }


                if (
                    object.material
                ) {

                    if (
                        Array.isArray(
                            object.material
                        )
                    ) {

                        object.material.forEach(
                            function(material) {

                                material.dispose();
                            }
                        );

                    } else {

                        object.material.dispose();
                    }
                }
            }
        );
    }


    scene =
        null;


    camera =
        null;


    renderer =
        null;


    avatar =
        null;


    remyLoaded =
        false;


    restPose.clear();
}


/* =========================================================
   GLOBAL API
   (module-safe: never clobber app.js UI handlers)
   ========================================================= */

window.setSign =
    setSign;


// Avatar-level replay (reads lesson state from window).
// Exposed under a distinct name so it cannot overwrite
// app.js window.playSignAnimation (which adds flash UI).
window.playAvatarSignAnimation =
    playSignAnimation;


// Backward compat: only provide window.playSignAnimation
// if app.js hasn't defined its own UI version yet.
if (
    !window.playSignAnimation
) {

    window.playSignAnimation =
        playSignAnimation;
}


window.focusCamera =
    resetCamera;


window.resetCamera =
    resetCamera;


window.resizeAvatar =
    resizeAvatar;


window.initAvatar =
    init;


// app.js calls bare init() — expose it for compat.
// (Modules don't create globals automatically.)
if (
    !window.init
) {

    window.init =
        init;
}


window.dispose =
    dispose;


window.testHandMovement =
    startFullBodyTest;


window.playFBXAnimation =
    playFBXAnimation;


window.stopFBXAnimation =
    stopFBXAnimation;


window.animateHandToPose =
    function(pose) {

        if (
            !remyLoaded
        ) {

            return;
        }


        handTest.active =
            false;


        stopFBXAnimation();


        restoreBody();


        currentSignPose =
            pose;


        signAnimation.active =
            true;


        signAnimation.startTime =
            performance.now();


        signAnimation.pose =
            pose;
    };


// Debug functions
window.debugAvatar = function() {
    console.log("=== Avatar Debug Info ===");
    console.log("remyLoaded:", remyLoaded);
    console.log("hasFBXBones:", hasFBXBones());
    console.log("signAnimation:", signAnimation);
    console.log("handTest:", handTest);
    console.log("currentSignKey:", currentSignKey);
    console.log("currentSignPose:", currentSignPose);
    console.log("proceduralArm.created:", proceduralArm.created);
    console.log("avatar:", avatar ? "loaded" : "not loaded");
    if (avatar) {
        console.log("avatar position:", avatar.position);
        console.log("avatar scale:", avatar.scale);
    }
    console.log("scene children:", scene ? scene.children.length : 0);
};

window.debugBones = function() {
    if (!avatar) {
        console.log("Avatar not loaded yet");
        return;
    }
    console.log("=== Bone Map ===");
    console.log("Right Arm:", remyBones.rightArm ? remyBones.rightArm.name : "MISSING");
    console.log("Right ForeArm:", remyBones.rightForeArm ? remyBones.rightForeArm.name : "MISSING");
    console.log("Right Hand:", remyBones.rightHand ? remyBones.rightHand.name : "MISSING");
    console.log("Left Arm:", remyBones.leftArm ? remyBones.leftArm.name : "MISSING");
    console.log("Left ForeArm:", remyBones.leftForeArm ? remyBones.leftForeArm.name : "MISSING");
    console.log("Left Hand:", remyBones.leftHand ? remyBones.leftHand.name : "MISSING");
    console.log("Right Thumb:", remyBones.rightThumb.length, "bones");
    console.log("Right Index:", remyBones.rightIndex.length, "bones");
    console.log("Right Middle:", remyBones.rightMiddle.length, "bones");
    console.log("Right Ring:", remyBones.rightRing.length, "bones");
    console.log("Right Pinky:", remyBones.rightPinky.length, "bones");
};

window.testSign = function(key) {
    setSign(key || "A");
    console.log("Testing sign:", key || "A");
};


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}