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

function applySigningArm(side, progress, wrist) {
    if (side !== "right") return;

    if (hasFBXBones()) {
        rotateBoneRelative(remyBones.rightArm, 0.00, 0.25, -1.15, progress);
        rotateBoneRelative(remyBones.rightForeArm, 0.15, -0.35, -0.55, progress);
        const w = wrist || [0, 0, 0];
        rotateBoneRelative(
            remyBones.rightHand,
            -0.25 + (w[0] || 0),
            0.25 + (w[1] || 0),
            -0.15 + (w[2] || 0),
            progress
        );
    }
}

/* =========================================================
   FINGER BEND (FBX only)

   Mixamo finger bones point along local +Y, so natural
   curl (flexion toward the palm) is a rotation about
   local X — NOT Z. The old code bent about Z, which
   splayed fingers sideways (the "scary" look), and used
   raw -1.6..-2.0 rad on EVERY joint, coiling fingers
   >360 deg straight through the palm.

   Pose values are legacy radians in [-1.6, 0] (0 =
   straight, -1.6 = full fist). They are normalized to a
   0..1 curl and mapped to per-joint anatomical limits so
   a fist closes naturally without clipping.
   ========================================================= */

// Max flexion (radians) per joint at full curl.
// [base/MCP, PIP, DIP, tip] — a tight fist needs ~250 deg of
// total curl; middle joints do most of the work.
const FINGER_CURL_MAX = [1.05, 1.55, 1.10, 0.70];

// Thumb is oriented differently — smaller curl plus a
// touch of opposition so it rests across the fingers
// instead of stabbing through them.
const THUMB_CURL_MAX = [0.25, 0.55, 0.50, 0.40];
const THUMB_OPPOSITION_Z = 0.12;

function poseToCurl(amount) {

    if (
        typeof amount !==
        "number" ||
        !isFinite(amount)
    ) {

        return 0;
    }


    // Legacy: 0 = straight, negative = curled.
    // (Positive values are also tolerated.)
    const curl =
        amount <= 0
            ? -amount / 1.6
            : amount / 1.6;


    return Math.max(
        0,
        Math.min(1, curl)
    );
}

// Max sideways fan (radians) at |spread| = 1. Applied ONLY to
// the base joint — spreading every joint would twist fingers.
const SPREAD_MAX = 0.30;

// Extra thumb rotation toward the palm at thumbOpp = 1
// (thumb folded across the palm as in B / S).
const THUMB_OPP_GAIN_Z = 0.45;

function clamp01(v) {
    if (typeof v !== "number" || !isFinite(v)) return 0;
    return Math.max(0, Math.min(1, v));
}

function bendFinger(finger, curl01, progress, opts) {

    if (
        !finger ||
        finger.length === 0
    ) {

        return;
    }


    opts =
        opts || {};


    const eased =
        easeInOut(
            progress
        );


    const curl =
        clamp01(
            curl01
        ) * eased;


    const opp =
        clamp01(
            opts.thumbOpp || 0
        ) * eased;


    if (
        curl <= 0.0001 &&
        opp <= 0.0001
    ) {

        return;
    }


    const isThumb =
        !!opts.isThumb;


    const maxes =
        isThumb
            ? THUMB_CURL_MAX
            : FINGER_CURL_MAX;


    finger.forEach(
        function(bone, index) {

            const rest =
                restPose.get(
                    bone.uuid
                );


            if (
                !rest
            ) {

                return;
            }


            const max =
                maxes[
                    Math.min(
                        index,
                        maxes.length - 1
                    )
                ];


            let ex =
                max * curl;

            let ez =
                0;


            if (
                isThumb
            ) {

                ez =
                    THUMB_OPPOSITION_Z * curl +
                    THUMB_OPP_GAIN_Z * opp;
            }


            const euler =
                new THREE.Euler(
                    ex,
                    0,
                    ez,
                    "XYZ"
                );


            const q =
                new THREE.Quaternion()
                    .setFromEuler(
                        euler
                    );


            bone.quaternion.copy(
                rest.quaternion
            );


            bone.quaternion.multiply(
                q
            );
        }
    );
}


/* =========================================================
   POSE SPEC (accurate ASL format + legacy support)

   Accurate format:
     { curl:   {thumb,index,middle,ring,pinky}  0..1
       spread: {index,middle,ring,pinky}        -1..1
       thumbOpp: 0..1  (thumb across palm)
       wrist: [x,y,z]  (added to base hand orientation)
       motion: null | "J" | "Z" }

   Legacy format {thumb,index,...} (or {right:{...}}) holds
   raw radian numbers in [-1.6, 0] and still works.
   ========================================================= */

function normalizeCurlValue(v) {

    if (
        typeof v !==
        "number" ||
        !isFinite(v)
    ) {

        return 0;
    }


    // New format uses 0..1 directly; legacy uses
    // negative radians, converted by poseToCurl().
    if (
        v < 0
    ) {

        return poseToCurl(
            v
        );
    }


    return Math.max(
        0,
        Math.min(1, v)
    );
}

function normalizeSpec(pose) {

    const out = {

        curl: {
            thumb: 0,
            index: 0,
            middle: 0,
            ring: 0,
            pinky: 0
        },

        spread: {},

        thumbOpp: 0,

        wrist: [0, 0, 0],

        motion: null
    };


    if (
        !pose
    ) {

        return out;
    }


    // Legacy: {right:{thumb,...}} wrapper.
    const src =
        pose.right &&
        !pose.curl
            ? pose.right
            : pose;


    if (
        src.curl
    ) {

        ["thumb", "index", "middle", "ring", "pinky"].forEach(
            function(k) {

                out.curl[k] =
                    normalizeCurlValue(
                        src.curl[k]
                    );
            }
        );


        if (
            src.spread
        ) {

            ["index", "middle", "ring", "pinky"].forEach(
                function(k) {

                    const v =
                        src.spread[k];


                    if (
                        typeof v ===
                        "number" &&
                        isFinite(v)
                    ) {

                        out.spread[k] =
                            Math.max(
                                -1,
                                Math.min(1, v)
                            );
                    }
                }
            );
        }


        if (
            typeof src.thumbOpp ===
            "number"
        ) {

            out.thumbOpp =
                clamp01(
                    src.thumbOpp
                );

        } else {

            // Sensible default: partly oppose whenever the
            // thumb is curled (legacy poses have no field).
            out.thumbOpp =
                out.curl.thumb * 0.4;
        }


        if (
            Array.isArray(
                src.wrist
            )
        ) {

            out.wrist = [
                src.wrist[0] || 0,
                src.wrist[1] || 0,
                src.wrist[2] || 0
            ];
        }


        if (
            src.motion === "J" ||
            src.motion === "Z"
        ) {

            out.motion =
                src.motion;
        }

    } else {

        // Legacy flat numbers (raw radians).
        ["thumb", "index", "middle", "ring", "pinky"].forEach(
            function(k) {

                out.curl[k] =
                    poseToCurl(
                        src[k] || 0
                    );
            }
        );


        out.thumbOpp =
            out.curl.thumb * 0.4;
    }


    return out;
}


/* =========================================================
   DYNAMIC LETTERS (J traces a hook, Z traces a zigzag)
   Extra wrist offset as a function of animation progress.
   At progress = 1 the end state is held.
   ========================================================= */

function motionWrist(motion, progress) {

    const e =
        easeInOut(
            Math.max(
                0,
                Math.min(1, progress)
            )
        );


    if (
        motion === "J"
    ) {

        // Twist down and hook: ends rotated (as a real J does).
        return [
            0.25 * Math.sin(e * Math.PI),
            -0.9 * e,
            0
        ];
    }


    if (
        motion === "Z"
    ) {

        // Side-to-side zigzag tracing the Z.
        const wiggle =
            Math.sin(
                e * Math.PI * 2
            );


        return [
            0,
            0.15 * wiggle,
            0.35 * wiggle
        ];
    }


    return [0, 0, 0];
}

/* =========================================================
   FINGER SPREAD (fan / cross)

   Spread must separate fingertips LATERALLY ON SCREEN.
   A finger-local euler can't do that reliably: the
   palm-forward wrist offset twists finger-local frames,
   so a local-Z rotation moves fingertips mostly in DEPTH
   (verified invisible from the default camera).

   Instead, rotate the base joint about the axis that is
   the CAMERA direction expressed in the bone's local
   frame. Palm-forward letters face the camera by
   construction, so this fans fingers exactly within the
   palm plane. It auto-adapts to any wrist offset.
   Positive spread fans toward the thumb (radial) side.
   ========================================================= */

const _spreadHelperQ = { q: null };

function getSpreadHelper() {

    if (
        !_spreadHelperQ.q
    ) {

        _spreadHelperQ.q =
            new THREE.Quaternion();
    }


    return _spreadHelperQ.q;
}

function spreadFinger(finger, spread01, progress) {

    if (
        !finger ||
        finger.length === 0
    ) {

        return;
    }


    const v =
        typeof spread01 ===
        "number" &&
        isFinite(spread01)
            ? Math.max(
                -1,
                Math.min(1, spread01)
            )
            : 0;


    const eased =
        easeInOut(
            Math.max(
                0,
                Math.min(1, progress)
            )
        );


    const angle =
        SPREAD_MAX * v * eased;


    if (
        Math.abs(angle) <= 0.0001
    ) {

        return;
    }


    const bone =
        finger[0];


    const rest =
        restPose.get(
            bone.uuid
        );


    if (
        !rest ||
        !bone.parent ||
        !camera
    ) {

        return;
    }


    // World orientation of the base joint at rest.
    const parentQ =
        new THREE.Quaternion();

    bone.parent.getWorldQuaternion(
        parentQ
    );


    const restWorldQ =
        parentQ.multiply(
            rest.quaternion
        );


    // Camera forward, expressed in the joint's local frame.
    const camDir =
        new THREE.Vector3(0, 0, 1);

    camera.getWorldQuaternion(
        getSpreadHelper()
    );

    camDir.applyQuaternion(
        getSpreadHelper()
    );


    const axis =
        camDir.applyQuaternion(
            restWorldQ.clone().invert()
        );


    if (
        axis.lengthSq() < 1e-6
    ) {

        return;
    }


    axis.normalize();


    const q =
        new THREE.Quaternion()
            .setFromAxisAngle(
                axis,
                angle
            );


    // Compose OVER the curl already applied by bendFinger:
    // spread is applied first (rest frame), then curl.
    const cur =
        bone.quaternion.clone();


    bone.quaternion.copy(
        rest.quaternion
    );


    bone.quaternion.multiply(
        q
    );


    const rel =
        rest.quaternion.clone().invert().multiply(
            cur
        );


    bone.quaternion.multiply(
        rel
    );
}

/* =========================================================
   APPLY HAND POSE (FBX or Procedural)
   ========================================================= */

function applyHandPose(side, pose, progress) {
    if (!pose || side !== "right") return;

    if (hasFBXBones()) {
        const spec = normalizeSpec(pose);
        bendFinger(remyBones.rightThumb, spec.curl.thumb, progress, {
            isThumb: true,
            thumbOpp: spec.thumbOpp
        });
        bendFinger(remyBones.rightIndex, spec.curl.index, progress, {});
        bendFinger(remyBones.rightMiddle, spec.curl.middle, progress, {});
        bendFinger(remyBones.rightRing, spec.curl.ring, progress, {});
        bendFinger(remyBones.rightPinky, spec.curl.pinky, progress, {});
        spreadFinger(remyBones.rightIndex, spec.spread.index || 0, progress);
        spreadFinger(remyBones.rightMiddle, spec.spread.middle || 0, progress);
        spreadFinger(remyBones.rightRing, spec.spread.ring || 0, progress);
        spreadFinger(remyBones.rightPinky, spec.spread.pinky || 0, progress);
    }
}

/* =========================================================
   APPLY COMPLETE SIGN (FBX or Procedural)
   ========================================================= */

function applySignPose(pose, progress) {
    if (hasFBXBones()) {
        const spec = normalizeSpec(pose);
        const wrist = [
            spec.wrist[0],
            spec.wrist[1],
            spec.wrist[2]
        ];
        if (spec.motion) {
            const mw = motionWrist(spec.motion, progress);
            wrist[0] += mw[0];
            wrist[1] += mw[1];
            wrist[2] += mw[2];
        }
        applySigningArm("right", progress, wrist);
        applyHandPose("right", spec, progress);
    } else {
        applyProceduralSign(pose, progress);
    }
}


/* =========================================================
   SIGN POSES
   ========================================================= */

const SIGN_POSES = {

    // Palm-forward wrist (palm faces the viewer). Verified:
    // base hand orientation shows the hand edge-on, X -0.9
    // turns the palm to the camera with fingers up.
    // G/H share a sideways wrist, P/Q a downward tilt.

    // A: closed fist, thumb straight alongside the index.
    A: {
        curl: { thumb: 0.30, index: 1, middle: 1, ring: 1, pinky: 1 },
        thumbOpp: 0.15,
        wrist: [-0.9, 0, 0]
    },


    // B: four fingers straight together, thumb folded across palm.
    B: {
        curl: { thumb: 0.55, index: 0, middle: 0, ring: 0, pinky: 0 },
        thumbOpp: 0.90,
        wrist: [-0.9, 0, 0]
    },


    // C: open curve like holding a cup, palm forward.
    C: {
        curl: { thumb: 0.35, index: 0.42, middle: 0.42, ring: 0.42, pinky: 0.42 },
        thumbOpp: 0.35,
        wrist: [-0.9, 0, 0]
    },


    // D: index up, remaining fingers rounded with the thumb.
    D: {
        curl: { thumb: 0.55, index: 0, middle: 0.62, ring: 0.62, pinky: 0.62 },
        thumbOpp: 0.80,
        wrist: [-0.9, 0, 0]
    },


    // E: fingers curled down toward the thumb, thumb across.
    E: {
        curl: { thumb: 0.70, index: 0.55, middle: 0.55, ring: 0.55, pinky: 0.55 },
        thumbOpp: 0.80,
        wrist: [-0.9, 0, 0]
    },


    // F: thumb and index touch (OK circle), other three raised.
    F: {
        curl: { thumb: 0.45, index: 0.45, middle: 0, ring: 0, pinky: 0 },
        thumbOpp: 0.95,
        wrist: [-0.9, 0, 0]
    },


    // G: index + thumb pinch pointing sideways, palm neutral.
    G: {
        curl: { thumb: 0.15, index: 0.05, middle: 1, ring: 1, pinky: 1 },
        thumbOpp: 0.15,
        wrist: [-0.2, -1.3, 0]
    },


    // H: index + middle extended sideways (U shape, sideways).
    H: {
        curl: { thumb: 0.80, index: 0, middle: 0, ring: 1, pinky: 1 },
        thumbOpp: 0.60,
        wrist: [-0.2, -1.3, 0]
    },


    // I: fist with pinky extended up.
    I: {
        curl: { thumb: 0.70, index: 1, middle: 1, ring: 1, pinky: 0 },
        thumbOpp: 0.50,
        wrist: [-0.9, 0, 0]
    },


    // J: I handshape tracing a J hook (dynamic).
    J: {
        curl: { thumb: 0.70, index: 1, middle: 1, ring: 1, pinky: 0 },
        thumbOpp: 0.50,
        wrist: [-0.9, 0, 0],
        motion: "J"
    },


    // K: index + middle up, thumb tip between them.
    K: {
        curl: { thumb: 0.30, index: 0, middle: 0, ring: 1, pinky: 1 },
        thumbOpp: 0.40,
        wrist: [-0.9, 0, 0]
    },


    // L: index up, thumb out — L shape.
    L: {
        curl: { thumb: 0, index: 0, middle: 1, ring: 1, pinky: 1 },
        thumbOpp: 0,
        wrist: [-0.9, 0, 0]
    },


    // M: first three fingers folded over the thumb (tip under).
    M: {
        curl: { thumb: 0.85, index: 1, middle: 1, ring: 1, pinky: 0.95 },
        thumbOpp: 0.25,
        wrist: [-0.9, 0, 0]
    },


    // N: first two fingers folded over the thumb.
    N: {
        curl: { thumb: 0.70, index: 1, middle: 1, ring: 0.95, pinky: 0.90 },
        thumbOpp: 0.25,
        wrist: [-0.9, 0, 0]
    },


    // O: fingers + thumb curved together into a ring.
    O: {
        curl: { thumb: 0.55, index: 0.55, middle: 0.55, ring: 0.55, pinky: 0.55 },
        thumbOpp: 0.85,
        wrist: [-0.9, 0, 0]
    },


    // P: K handshape tilted downward.
    P: {
        curl: { thumb: 0.30, index: 0, middle: 0, ring: 1, pinky: 1 },
        thumbOpp: 0.40,
        wrist: [-0.9, 0, -0.9]
    },


    // Q: G pinch tilted downward.
    Q: {
        curl: { thumb: 0.15, index: 0.05, middle: 1, ring: 1, pinky: 1 },
        thumbOpp: 0.15,
        wrist: [-0.2, 0, -1.0]
    },


    // R: index + middle crossed, others folded.
    R: {
        curl: { thumb: 0.70, index: 0, middle: 0, ring: 1, pinky: 1 },
        thumbOpp: 0.50,
        spread: { index: -0.9, middle: 0.9 },
        wrist: [-0.9, 0, 0]
    },


    // S: closed fist, thumb wrapped across the front.
    S: {
        curl: { thumb: 0.65, index: 1, middle: 1, ring: 1, pinky: 1 },
        thumbOpp: 0.95,
        wrist: [-0.9, 0, 0]
    },


    // T: fist, thumb tip between index and middle.
    T: {
        curl: { thumb: 0.35, index: 1, middle: 1, ring: 1, pinky: 1 },
        thumbOpp: 0.70,
        wrist: [-0.9, 0, 0]
    },


    // U: index + middle together, pointing up.
    U: {
        curl: { thumb: 0.70, index: 0, middle: 0, ring: 1, pinky: 1 },
        thumbOpp: 0.50,
        wrist: [-0.9, 0, 0]
    },


    // V: index + middle fanned apart.
    V: {
        curl: { thumb: 0.70, index: 0, middle: 0, ring: 1, pinky: 1 },
        thumbOpp: 0.50,
        spread: { index: 0.75, middle: -0.75 },
        wrist: [-0.9, 0, 0]
    },


    // W: index + middle + ring extended and fanned.
    W: {
        curl: { thumb: 0.70, index: 0, middle: 0, ring: 0, pinky: 1 },
        thumbOpp: 0.50,
        spread: { index: 0.80, ring: -0.80 },
        wrist: [-0.9, 0, 0]
    },


    // X: hooked index, others folded.
    X: {
        curl: { thumb: 0.70, index: 0.50, middle: 1, ring: 1, pinky: 1 },
        thumbOpp: 0.60,
        wrist: [-0.9, 0, 0]
    },


    // Y: thumb + pinky extended, middle fingers folded.
    Y: {
        curl: { thumb: 0, index: 1, middle: 1, ring: 1, pinky: 0 },
        thumbOpp: 0,
        wrist: [-0.9, 0, 0]
    },


    // Z: index extended, tracing a Z zigzag (dynamic).
    Z: {
        curl: { thumb: 0.70, index: 0, middle: 0.90, ring: 0.90, pinky: 0.90 },
        thumbOpp: 0.55,
        wrist: [-0.9, 0, 0],
        motion: "Z"
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
        applyHandPose("right", { thumb: -0.90, index: -1.6, middle: -1.6, ring: -1.6, pinky: -1.6 }, p);
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

    // Finger bending (supports both accurate and legacy specs).
    if (pose) {
        const spec = normalizeSpec(pose);
        const fingerBends = spec.curl;

        Object.keys(fingerBends).forEach(name => {
            const curl = clamp01(fingerBends[name]);
            proceduralArm.rightFingers[name].forEach((segment, idx) => {
                const strength = 1 - idx * 0.15;
                segment.rotation.x = curl * 0.9 * strength * eased;
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

// TEMPORARY calibration helper (removed before final): play an
// arbitrary accurate-format spec immediately at full pose.
window.testPose = function(spec) {
    if (!remyLoaded) return "not loaded";
    handTest.active = false;
    stopFBXAnimation();
    restoreAll();
    const s = normalizeSpec(spec);
    currentSignKey = "TEST";
    currentSignPose = s;
    signAnimation.active = true;
    signAnimation.startTime = performance.now() - 2000;
    signAnimation.pose = s;
    // Jump straight to the held end-state for screenshots.
    restoreAll();
    applySignPose(s, 1);
    return "held test pose";
};

// Probe for finger-axis debugging: returns serializable bone data.
window.probeHandBones = function() {
    if (!avatar) return { loaded: false };

    function info(bone) {
        if (!bone) return null;
        const wp = new THREE.Vector3();
        bone.getWorldPosition(wp);
        const le = new THREE.Euler().setFromQuaternion(bone.quaternion, "XYZ");
        const rest = restPose.get(bone.uuid);
        let restEuler = null;
        if (rest) {
            const re = new THREE.Euler().setFromQuaternion(rest.quaternion, "XYZ");
            restEuler = [re.x, re.y, re.z];
        }
        // Direction to first bone-child (if any), in world space.
        let childDir = null;
        const boneChild = (bone.children || []).find(c => c.isBone);
        if (boneChild) {
            const cp = new THREE.Vector3();
            boneChild.getWorldPosition(cp);
            childDir = [cp.x - wp.x, cp.y - wp.y, cp.z - wp.z];
        }
        // Local child offset (bone axis in parent space).
        let localChildOffset = null;
        if (boneChild) {
            localChildOffset = [boneChild.position.x, boneChild.position.y, boneChild.position.z];
        }
        return {
            name: bone.name,
            localPos: [bone.position.x, bone.position.y, bone.position.z],
            localEuler: [le.x, le.y, le.z],
            restEuler: restEuler,
            worldPos: [wp.x, wp.y, wp.z],
            childDir: childDir,
            localChildOffset: localChildOffset
        };
    }

    return {
        loaded: true,
        currentSignKey: currentSignKey,
        rightHand: info(remyBones.rightHand),
        rightIndex: remyBones.rightIndex.map(info),
        rightMiddle: remyBones.rightMiddle.map(info),
        rightThumb: remyBones.rightThumb.map(info)
    };
};

// Focus camera on right hand for close-up screenshots.
window.focusHand = function(distance) {
    if (!avatar || !remyBones.rightHand) return "no hand";
    const wp = new THREE.Vector3();
    remyBones.rightHand.getWorldPosition(wp);
    cameraTarget.copy(wp);
    cameraDistance = distance || 1.1;
    cameraHeight = wp.y;
    cameraAngle = 0.35;
    updateCamera();
    return "focused hand at " + wp.toArray();
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