// Add a debug gui for exploring and modifying variables of a threejs scene.

import { GUI } from 'dat.gui'
import * as THREE from 'three';
import anime from 'animejs/lib/anime.es.js';

import { TransformControls } from 'three/addons/controls/TransformControls.js';
var transformControl;

var scene
var sceneEl
var lastNodeMovedAt
var lastGui

var camera

var onGUIKey = {}
var guiByUUID = {}
var folders = {}

// Several Object3D and Materials variables are used rarely, so it's probably better to hide them by default unless shift is pressed
var keysToHideWhenNotPressingShift = [
    "uuid", "name", "up", "quaternion", "matrix", "matrixAutoUpdate", "matrixWorld", "matrixWorldNeedsUpdate", "layers", "castShadow", "receiveShadow", "frustumCulled",
    "stencilFail", "stencilFunc", "stencilFuncMask", "stencilRef", "stencilWrite", "stencilWriteMask", "stencilZFail", "stencilZPass",
    "polygonOffset", "polygonOffsetFactor", "polygonOffsetUnits", "defines", "_listeners",
    "version", "wireframeLinecap", "wireframeLinejoin", "wireframeLinewidth"
]

function addSceneFolderToGUI(name, gui){
    addDynFolder(name, gui, scene, function(types, event){
        Object.keys(folders).forEach(folder => {
            folders[folder].unnamedNodesCount = 0;
        })
        var guiNodeCount = 0
        scene.traverse(node => {
            if(!folders[node.type]) folders[node.type] = types.addFolder(node.type)

            var nodeGui
            try {
                if(!node.name || node.name == ""){
                    folders[node.type].unnamedNodesCount = (folders[node.type].unnamedNodesCount || 0) + 1
                    nodeGui = addDynFolder(node.el.id + " " + folders[node.type].unnamedNodesCount, folders[node.type], node, function(folder, event){
                        addObjectToGUI(folder, node, event)
                    })
                }
                else {
                    nodeGui = addDynFolder(node.name, folders[node.type], node, function(folder, event){
                        addObjectToGUI(folder, node, event)
                    })
                }
            }
            catch(e){
                try {
                    folders[node.type].unnamedNodesCount = (folders[node.type].unnamedNodesCount || 0) + 1
                    nodeGui = addDynFolder(folders[node.type].unnamedNodesCount, folders[node.type], node, function(folder, event){
                        addObjectToGUI(folder, node, event)
                    })
                }
                catch(e){
                    console.error(e)
                    console.error("Error on adding the gui node :")
                    console.log(node)
                }
            }

            guiByUUID[node.uuid] = nodeGui
            console.log("Adding GUI Node n°" + guiNodeCount++)
        });
    })
}

onGUIKey["position"]                 = function(nodeGui, node){
    let folder = addDynFolder("position", nodeGui, node, function(folder, event){
        folder.add(node.position, "x").step(0.001)
        folder.add(node.position, "y").step(0.001)
        folder.add(node.position, "z").step(0.001)
        folder.add({ locate:function(){
            locate(node)
        }},'locate');
        folder.add({ moveTo:function(){
            moveTo(node)
        }},'moveTo');
        controlNode(node, 'translate')
    })
    setFolderFontSize(folder)
    lastNodeMovedAt = node
}

onGUIKey["rotation"]                 = function(nodeGui, node){
    let folder = addDynFolder("rotation", nodeGui, node, function(folder, event){
        folder.add(node.rotation, "x", 0, Math.PI * 2).step(0.01)
        folder.add(node.rotation, "y", 0, Math.PI * 2).step(0.01)
        folder.add(node.rotation, "z", 0, Math.PI * 2).step(0.01)
        controlNode(node, 'rotate')
    })
    setFolderFontSize(folder)
}

onGUIKey["scale"]                    = function(nodeGui, node){
    let folder = addDynFolder("scale", nodeGui, node, function(folder, event){
        folder.add(node.scale, "x").step(0.01)
        folder.add(node.scale, "y").step(0.01)
        folder.add(node.scale, "z").step(0.01)
        controlNode(node, 'scale')
    })
    setFolderFontSize(folder)
}

onGUIKey["opacity"]                    = function(nodeGui, node){
    nodeGui.add(node, "opacity", 0, 1).step(0.01)
}

onGUIKey["blendSrc"]                    = function(nodeGui, node){
    var guiValues = [
        "0",
        "1",
        "SrcColor",
        "1 - SrcColor",
        "SrcAlpha",
        "1 - SrcAlpha",
        "DstAlpha",
        "1 - DstAlpha",
        "DstColor",
        "1 - DstColor",
        "SrcAlphaSat"
    ]

    var values =    [
        THREE.ZeroFactor,
        THREE.OneFactor,
        THREE.SrcColorFactor,
        THREE.OneMinusSrcColorFactor,
        THREE.SrcAlphaFactor,
        THREE.OneMinusSrcAlphaFactor,
        THREE.DstAlphaFactor,
        THREE.OneMinusDstAlphaFactor,
        THREE.DstColorFactor,
        THREE.OneMinusDstColorFactor,
        THREE.SrcAlphaSaturateFactor
    ]

    var ctrl = nodeGui.add(node, "blendSrc", guiValues).onChange(function(val){
        node.blendSrc = values[guiValues.indexOf(val)]
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["blendDst"]                    = function(nodeGui, node){
    var guiValues = [
        "0",
        "1",
        "SrcColor",
        "1 - SrcColor",
        "SrcAlpha",
        "1 - SrcAlpha",
        "DstAlpha",
        "1 - DstAlpha",
        "DstColor",
        "1 - DstColor"
    ]

    var values =    [
        THREE.ZeroFactor,
        THREE.OneFactor,
        THREE.SrcColorFactor,
        THREE.OneMinusSrcColorFactor,
        THREE.SrcAlphaFactor,
        THREE.OneMinusSrcAlphaFactor,
        THREE.DstAlphaFactor,
        THREE.OneMinusDstAlphaFactor,
        THREE.DstColorFactor,
        THREE.OneMinusDstColorFactor
    ]

    var ctrl = nodeGui.add(node, "blendDst", guiValues).onChange(function(val){
        node.blendDst = values[guiValues.indexOf(val)]
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["blendEquation"]                    = function(nodeGui, node){
    var guiValues = [            "Add",            "Substract",            "ReverseSubstract",             "Min",             "Max"]
    var values =    [THREE.AddEquation, THREE.SubtractEquation, THREE.ReverseSubtractEquation, THREE.MinEquation, THREE.MaxEquation]
    var ctrl = nodeGui.add(node, "blendEquation", guiValues).onChange(function(val){
        node.blendEquation = values[guiValues.indexOf(val)]
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["blending"]                    = function(nodeGui, node){
    var guiValues = [          "None",             "Normal",             "Additive",             "Subtractive",             "Multiply",             "Custom"]
    var values =    [THREE.NoBlending, THREE.NormalBlending, THREE.AdditiveBlending, THREE.SubtractiveBlending, THREE.MultiplyBlending, THREE.CustomBlending]
    var ctrl = nodeGui.add(node, "blending", guiValues).onChange(function(val){
        node.blending = values[guiValues.indexOf(val)]
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["side"]                    = function(nodeGui, node){
    var guiValues = [    "Front Side",    "Back Side",    "Double Side"]
    var values =    [THREE.FrontSide, THREE.BackSide, THREE.DoubleSide]
    var ctrl = nodeGui.add(node, "side", guiValues).onChange(function(val){
        node.side = values[guiValues.indexOf(val)]
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["depthFunc"]                    = function(nodeGui, node){
    var guiValues = [
        "Never",
        "Always",
        "Equal",
        "Less",
        "LessEqual",
        "GreaterEqual",
        "Greater",
        "Not Equal"
    ]

    var values =    [
        THREE.NeverDepth,
        THREE.AlwaysDepth,
        THREE.EqualDepth,
        THREE.LessDepth,
        THREE.LessEqualDepth,
        THREE.GreaterEqualDepth,
        THREE.GreaterDepth,
        THREE.NotEqualDepth
    ]

    var ctrl = nodeGui.add(node, "depthFunc", guiValues).onChange(function(val){
        node.depthFunc = values[guiValues.indexOf(val)]
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["encoding"]                    = function(nodeGui, node){
    var guiValues = [
        "Linear",
        "sRGB"
    ]

    var values =    [
        THREE.LinearEncoding,
        THREE.sRGBEncoding
    ]

    var ctrl = nodeGui.add(node, "encoding", guiValues).onChange(function(val){
        node.encoding = values[guiValues.indexOf(val)]
        node.needsUpdate = true
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["anisotropy"]                  = function(nodeGui, node){
    nodeGui.add(node, "anisotropy", 1, 16).onChange(function(val){
        node.anisotropy = val
        node.needsUpdate = true
    }).step(1)
}

onGUIKey["wrapS"]                    = function(nodeGui, node){
    var guiValues = [
        "Repeat",
        "ClampToEdge",
        "MirroredRepeat"
    ]

    var values =    [
        THREE.RepeatWrapping,
        THREE.ClampToEdgeWrapping,
        THREE.MirroredRepeatWrapping
    ]

    var ctrl = nodeGui.add(node, "wrapS", guiValues).onChange(function(val){
        node.wrapS = values[guiValues.indexOf(val)]
        node.needsUpdate = true
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["wrapT"]                    = function(nodeGui, node){
    var guiValues = [
        "Repeat",
        "ClampToEdge",
        "MirroredRepeat"
    ]

    var values =    [
        THREE.RepeatWrapping,
        THREE.ClampToEdgeWrapping,
        THREE.MirroredRepeatWrapping
    ]

    var ctrl = nodeGui.add(node, "wrapT", guiValues).onChange(function(val){
        node.wrapT = values[guiValues.indexOf(val)]
        node.needsUpdate = true
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["magFilter"]                    = function(nodeGui, node){
    var guiValues = [
        "Nearest",
        "Linear"
    ]

    var values =    [
        THREE.NearestFilter,
        THREE.LinearFilter
    ]

    var ctrl = nodeGui.add(node, "magFilter", guiValues).onChange(function(val){
        node.magFilter = values[guiValues.indexOf(val)]
        node.needsUpdate = true
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["minFilter"]                    = function(nodeGui, node){
    var guiValues = [
        "Nearest",
        "NearestMipmapNearest",
        "NearestMipmapLinear",
        "Linear",
        "LinearMipmapNearest",
        "LinearMipmapLinear"
    ]

    var values =    [
        THREE.NearestFilter,
        THREE.NearestMipmapNearestFilter,
        THREE.NearestMipmapLinearFilter,
        THREE.LinearFilter,
        THREE.LinearMipmapNearestFilter,
        THREE.LinearMipmapLinearFilter
    ]

    var ctrl = nodeGui.add(node, "minFilter", guiValues).onChange(function(val){
        node.minFilter = values[guiValues.indexOf(val)]
        node.needsUpdate = true
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["format"]                    = function(nodeGui, node){
    var guiValues = [
        "Alpha",
        "Red",
        "RedInteger",
        "RG",
        "RGInteger",
        "RGBA",
        "RGBAInteger",
        "Luminance",
        "LuminanceAlpha",
        "Depth",
        "DepthStencil"
    ]

    var values =    [
        THREE.AlphaFormat,
        THREE.RedFormat,
        THREE.RedIntegerFormat,
        THREE.RGFormat,
        THREE.RGIntegerFormat,
        THREE.RGBAFormat,
        THREE.RGBAIntegerFormat,
        THREE.LuminanceFormat,
        THREE.LuminanceAlphaFormat,
        THREE.DepthFormat,
        THREE.DepthStencilFormat
    ]

    var ctrl = nodeGui.add(node, "format", guiValues).onChange(function(val){
        node.format = values[guiValues.indexOf(val)]
        node.needsUpdate = true
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["mapping"]                    = function(nodeGui, node){
    var guiValues = [
        "UV",
        "CubeReflection",
        "CubeRefraction",
        "EquirectangularReflection",
        "EquirectangularRefraction",
        "CubeUVReflection"
    ]

    var values =    [
        THREE.UVMapping,
        THREE.CubeReflectionMapping,
        THREE.CubeRefractionMapping,
        THREE.EquirectangularReflectionMapping,
        THREE.EquirectangularRefractionMapping,
        THREE.CubeUVReflectionMapping
    ]

    var ctrl = nodeGui.add(node, "mapping", guiValues).onChange(function(val){
        node.mapping = values[guiValues.indexOf(val)]
        node.needsUpdate = true
    })
    ctrl.__select[values.indexOf(ctrl.initialValue)].selected = true
}

onGUIKey["filmGauge"]             = function(nodeGui, node){} // Unknown uses
onGUIKey["filmOffset"]            = function(nodeGui, node){} // Unknown uses
onGUIKey["type"]                  = function(nodeGui, node){}
//onGUIKey["fog"]                   = function(nodeGui, node){} // Fog is an a-frame boolean for toggling the fog effect on it.
onGUIKey["vertexColors"]          = function(nodeGui, node){
    node.vertexColors = node.vertexColors ? true : false;
    nodeGui.add(node, "vertexColors")
}

onGUIKey["fov"]                  = function(nodeGui, node){
    nodeGui.add(node, "fov", 1, 180).onChange(function(val){
        node.fov = val
        node.updateProjectionMatrix()
    })
}

onGUIKey["mask"]                  = function(nodeGui, node){
    nodeGui.add(node, "mask", 1, 31).step(1)
}

onGUIKey["near"]                  = function(nodeGui, node){
    nodeGui.add(node, "near", 0.001, 2.0).onChange(function(val){
        node.near = val
        node.updateProjectionMatrix()
    })
}

onGUIKey["far"]                  = function(nodeGui, node){
    nodeGui.add(node, "far", 1.0, 20000.0).onChange(function(val){
        node.far = val
        node.updateProjectionMatrix()
    })
}

onGUIKey["aspect"]                  = function(nodeGui, node){
    nodeGui.add(node, "aspect", 0.2, 5.0).onChange(function(val){
        node.aspect = val
        node.updateProjectionMatrix()
    })
}

onGUIKey["focus"]                  = function(nodeGui, node){
    if(node.type != "StereoCamera") return;
    nodeGui.add(node, "focus").onChange(function(val){
        node.focus = val
        node.updateProjectionMatrix()
    })
}

onGUIKey["matrix"]                   = function(nodeGui, node){
    addDynFolder("matrix", nodeGui, node, function(folder, event){
        folder.add(node.matrix.elements, "0").step(0.01)
        folder.add(node.matrix.elements, "1").step(0.01)
        folder.add(node.matrix.elements, "2").step(0.01)
        folder.add(node.matrix.elements, "3").step(0.01)
        folder.add(node.matrix.elements, "4").step(0.01)
        folder.add(node.matrix.elements, "5").step(0.01)
        folder.add(node.matrix.elements, "6").step(0.01)
        folder.add(node.matrix.elements, "7").step(0.01)
        folder.add(node.matrix.elements, "8").step(0.01)
        folder.add(node.matrix.elements, "9").step(0.01)
        folder.add(node.matrix.elements, "10").step(0.01)
        folder.add(node.matrix.elements, "11").step(0.01)
        folder.add(node.matrix.elements, "12").step(0.01)
        folder.add(node.matrix.elements, "13").step(0.01)
        folder.add(node.matrix.elements, "14").step(0.01)
        folder.add(node.matrix.elements, "15").step(0.01)

        folder.add({ toIdentityMatrix:function(){
            folder.__controllers[0 ].setValue(1)
            folder.__controllers[1 ].setValue(0)
            folder.__controllers[2 ].setValue(0)
            folder.__controllers[3 ].setValue(0)
            folder.__controllers[4 ].setValue(0)
            folder.__controllers[5 ].setValue(1)
            folder.__controllers[6 ].setValue(0)
            folder.__controllers[7 ].setValue(0)
            folder.__controllers[8 ].setValue(0)
            folder.__controllers[9 ].setValue(0)
            folder.__controllers[10].setValue(1)
            folder.__controllers[11].setValue(0)
            folder.__controllers[12].setValue(0)
            folder.__controllers[13].setValue(0)
            folder.__controllers[14].setValue(0)
            folder.__controllers[15].setValue(1)
        }}, 'toIdentityMatrix');
    })
}

function addObjectToGUI(objectGui, object, event){
    var keys = Object.keys(object)
    for(var i = 0; i < keys.length; i++){
        var key = keys[i]
        if(!object.hasOwnProperty(key)) continue

        if(!event.getModifierState("Shift")){
            if(keysToHideWhenNotPressingShift.includes(key)){
                continue
            }
        }

        if(onGUIKey[key]) {
            if(!scene) tryToFindTheScene(object)
            try {
                onGUIKey[key](objectGui, object)
                continue
            } catch(e){}
        }

        if(Array.isArray(object[key]) && object[key].length == 0) continue;

        var varType = typeof(object[key])
        if(varType == "number") {
            objectGui.add(object, key)
        }
        else if(varType == "string") {
            objectGui.add(object, key)
        }
        else if(varType == "boolean") {
            objectGui.add(object, key)
        }
        else if(varType == "object") {
            var onGUIKeyError = false
            if(onGUIKey[key]) {
                try {
                    onGUIKey[key](objectGui, object)
                    continue
                } catch(e){
                    console.warn(e)
                    onGUIKeyError = true
                }
            }
            if(object[key] === null){
                console.warn("Cannot guess expected valid type of var " + key)
            }
            else if(onGUIKey[key] === undefined || onGUIKeyError){
                let target = object[key]
                if(Object.keys(target).length == 0) continue;
                addDynFolder(key, objectGui, target, function(folder, event){
                    addObjectToGUI(folder, target, event)
                })
            }
        }
        else if(varType == "function") {}
        else if(varType == "undefined") {}
        else {
            console.log("No code for var type " + varType)
        }
    }
}

// Create a special folder that only add its content GUI when opening on click and destroy it's internal GUI on closing,
// allowing us to force refresh gui sliders values with close + open events
function addDynFolder(folderName, nodeGui, node, populateFolderFunction){
    if(!nodeGui) nodeGui = lastGui

    // Create a new folder OR recover it if already existing
    var folder 
    try {        folder = nodeGui.addFolder(folderName)
    } catch(e) { folder = nodeGui.__folders[folderName]}

    folder.__ul.onclick = function(event){
        if(event.target.innerHTML != folderName) return; // Prevent this click reaction outside of the folder

        if(!folder.loaded){
            if(node && event.getModifierState("Shift")) console.log(node[folderName] || node) // Also log node in console when shift + opening
            populateFolderFunction(folder, event)
            colorizeLastOpenedDynFolder(nodeGui, folder)
            folder.loaded = true
        }
        else{
            // Delete sliders
            for(var i = folder.__controllers.length - 1; i >= 0; i--){
                folder.remove(folder.__controllers[i])
            }
            folder.loaded = false
        }
    }

    return folder
}

var supFolderLis
var folderLis
function colorizeLastOpenedDynFolder(supFolder, folder){
    if(supFolderLis){ supFolderLis.forEach(li => {li.style.backgroundColor = "black"; li.style.color = "white" })}
    if(folderLis)   {    folderLis.forEach(li => {li.style.backgroundColor = "black"; li.style.color = "white" })}

    supFolderLis = Array.prototype.slice.call(supFolder.__ul.getElementsByTagName('li'));
    supFolderLis.forEach(li => {
        li.style.backgroundColor = "#082946"
        li.style.color = "coral"
    })

    folderLis = Array.prototype.slice.call(folder.__ul.getElementsByTagName('li'));
    folderLis.forEach(li => {
        li.style.backgroundColor = "#090126"
        li.style.color = "chartreuse"
    })
}

function setFolderFontSize(folder, size){
    if(!size) size = "initial"
    folderLis = Array.prototype.slice.call(folder.__ul.getElementsByTagName('li'));
    folderLis.forEach(li => {li.style["font-size"] = size})
}


var meshHelper
var arrowHelper
function locate(node){
    if(meshHelper){
        scene.remove(meshHelper)
    }
    try {
        meshHelper = new THREE.BoxHelper( node, 0xffff00 );
        scene.add(meshHelper)
    } catch(e){}

    if(arrowHelper){
        scene.remove(arrowHelper)
    }
    if(!camera) tryToFindTheCamera()
    var targetPosition = new THREE.Vector3(  node.matrixWorld.elements[12], node.matrixWorld.elements[13], node.matrixWorld.elements[14])
    var cameraPosition = new THREE.Vector3(camera.matrixWorld.elements[12] - 0.01 * camera.matrixWorld.elements[8], camera.matrixWorld.elements[13] - 0.01 * camera.matrixWorld.elements[9], camera.matrixWorld.elements[14] - 0.01 * camera.matrixWorld.elements[10])
    var fromCameraToTarget = new THREE.Vector3(
        node.matrixWorld.elements[12] - camera.matrixWorld.elements[12],
        node.matrixWorld.elements[13] - camera.matrixWorld.elements[13],
        node.matrixWorld.elements[14] - camera.matrixWorld.elements[14])
    var distance = targetPosition.distanceTo(cameraPosition)
    arrowHelper = new THREE.ArrowHelper( fromCameraToTarget.normalize(), cameraPosition, distance, Math.random() * 0xffffff )
    scene.add(arrowHelper)
}

function moveTo(node){
    if(!camera) tryToFindTheCamera()
    var cameraman = camera.parent
    var targetWorldBoundingSphereRadius
    try {
        var xNodeVector = new THREE.Vector3(node.matrixWorld.elements[0], node.matrixWorld.elements[1], node.matrixWorld.elements[2])
        var xScale = Math.sqrt(xNodeVector.x * xNodeVector.x + xNodeVector.y * xNodeVector.y + xNodeVector.z * xNodeVector.z)
        var center = node.geometry.boundingSphere.center
        targetWorldBoundingSphereRadius = ((node.geometry.boundingSphere.radius + Math.sqrt(center.x * center.x + center.y * center.y + center.z * center.z)) * xScale) * 2.0
    } catch(e) {
        targetWorldBoundingSphereRadius = 1.0
    }

    var targetPosition = new THREE.Vector3(
        node.matrixWorld.elements[12] + targetWorldBoundingSphereRadius * camera.matrixWorld.elements[8 ],
        node.matrixWorld.elements[13] + targetWorldBoundingSphereRadius * camera.matrixWorld.elements[9 ],
        node.matrixWorld.elements[14] + targetWorldBoundingSphereRadius * camera.matrixWorld.elements[10]
    )
    var cameramanPosition = new THREE.Vector3(cameraman.matrixWorld.elements[12], cameraman.matrixWorld.elements[13], cameraman.matrixWorld.elements[14])

    anime({
        targets: cameraman.position,
        easing: 'easeInQuad', duration: 1000, loop: false,
        x: [cameramanPosition.x, targetPosition.x],
        y: [cameramanPosition.y, targetPosition.y],
        z: [cameramanPosition.z, targetPosition.z],
    })

    graphSceneSelect(node)

    lastNodeMovedAt = node
}



function moveToParent(){
    if(lastNodeMovedAt && lastNodeMovedAt.parent){
        locate(lastNodeMovedAt.parent)
        moveTo(lastNodeMovedAt.parent)
    }
    else if(lastNodeMovedAt){
        locate(scene)
        moveTo(scene)
    }
}

function moveToFirstChild(){
    if(lastNodeMovedAt && lastNodeMovedAt.children && lastNodeMovedAt.children[0]){
        locate(lastNodeMovedAt.children[0])
        moveTo(lastNodeMovedAt.children[0])
    }
    else console.log("No child")
}

function moveToPreviousBrother(){
    if(lastNodeMovedAt && lastNodeMovedAt.parent){
        var children = lastNodeMovedAt.parent.children
        var currentIndex = children.indexOf(lastNodeMovedAt)
        var brother = children[currentIndex - 1]
        if(brother){
            locate(brother)
            moveTo(brother)
        }
        else console.log("No previous brother")
    }
}

function moveToNextBrother(){
    if(lastNodeMovedAt && lastNodeMovedAt.parent){
        var children = lastNodeMovedAt.parent.children
        var currentIndex = children.indexOf(lastNodeMovedAt)
        var brother = children[currentIndex + 1]
        if(brother){
            locate(brother)
            moveTo(brother)
        }
        else console.log("No next brother")
    }
}

window.addEventListener('keydown', function(event) {
    if(event.getModifierState("Shift")){
        if(!lastNodeMovedAt) return
        switch (event.which) {
        case 73: // I
            console.log("Move To Parent")
            moveToParent()
            break;

        case 74: // J
            console.log("Move To Previous Brother")
            moveToPreviousBrother()
            break;

        case 75: // K
            console.log("Move To First Child")
            moveToFirstChild()
            break;

        case 76: // L
            console.log("Move To Next Brother")
            moveToNextBrother()
            break;
        }
    }
});

function controlNode(node, mode){
    if(!sceneEl) return;
    if(!transformControl){
        if(!camera) tryToFindTheCamera()
        transformControl = new TransformControls( camera, sceneEl.renderer.domElement );
        scene.add(transformControl)
    }
    if(node != transformControl && node != transformControl.parent){
        transformControl.attach( node );
        transformControl.setMode( mode );
    }
}

function tryToFindTheScene(object){
    // Check from aframe element
    if(object.el && object.el.sceneEl){
        sceneEl = object.el.sceneEl
        scene = sceneEl.object3D
    }

    // Check if object is the scene directly
    else if(object.type == "Scene")
        scene = object

    // Check object parents recursively
    else {
        var parent = object.parent
        while(parent && parent.parent){
            parent = parent.parent
            if(parent && parent.isScene){
                scene = parent
                return;
            }
        }
    }
}

function tryToFindTheCamera(){
    if(sceneEl) camera = sceneEl.camera
    else if(scene){
        scene.traverse((node) => {
            if(node.type == "PerspectiveCamera"){
                camera = node
                return
            }
        })
    }
    console.warn("Couldn't find any perspective camera !")
}


//---------------------------------------------------------
// https://stackoverflow.com/questions/15505225/inject-css-stylesheet-as-string-using-javascript
/**
 * Utility function to add CSS in multiple passes.
 * @param {string} styleString
 */
function addStyle(styleString) {
  const style = document.createElement('style');
  style.textContent = styleString;
  document.head.append(style);
}

// Solve potential z-index issue on 8thwall experiences
addStyle(`
  .dg.ac {
    z-index: 9001 !important;
  }
`);
//---------------------------------------------------------






var sceneGraph
var sceneGraphGeo
var sceneGraphMat
var parentLine
var localLine
var childrenLine
function graphSceneSelect(node){
    if(!node){
        console.error("NO NODE ??")
        return;
    }
    console.log(node)
    var parent = node.parent
    var family = [node]
    var index = 0
    if(parent){
        console.log("Node has a parent")
        family = node.parent.children
        console.log("Family size is " + family.length)
        index = family.indexOf(node)
        console.log("Index is " + index)
    }

    if(!sceneGraph){
        sceneGraph = new THREE.Object3D()
        sceneGraph.position.z = -0.05
        sceneGraph.position.y = -0.025
        sceneGraph.scale.x = 0.01
        sceneGraph.scale.y = 0.01
        sceneGraph.scale.z = 0.01

        parentLine   = new THREE.Object3D()
        localLine    = new THREE.Object3D()
        childrenLine = new THREE.Object3D()

        parentLine.position.y = 0.5
        childrenLine.position.y = -0.5

        sceneGraph.add(parentLine)
        sceneGraph.add(localLine)
        sceneGraph.add(childrenLine)

        sceneEl.camera.parent.add(sceneGraph)
    }


    if(!sceneGraphGeo) sceneGraphGeo = new THREE.PlaneGeometry(0.2, 0.4)
    if(!sceneGraphMat){
        sceneGraphMat = new THREE.MeshStandardMaterial()
        sceneGraphMat.color.r = 82 / 255
        sceneGraphMat.color.g = 255 / 255
        sceneGraphMat.color.b = 66 / 255
    }

    if(parent){
        parentLine.visible = true
        if(!parentLine.children[0]){
            parentLine.add(new THREE.Mesh(sceneGraphGeo, sceneGraphMat))
        }
    }
    else {
        parentLine.visible = false
    }

    var brothersCountMissing = family.length - localLine.children.length
    while(brothersCountMissing > 0){
        var bro = new THREE.Object3D()
        bro.add(new THREE.Mesh(sceneGraphGeo, sceneGraphMat))
        localLine.add(bro)
        bro.position.x = 0.3 * localLine.children.indexOf(bro)
        brothersCountMissing--
    }
    console.log("Family length is " + family.length)
    for(var i = 0; i < localLine.children.length; i++){
        
        if(i < family.length){
            //console.log("Showing " + i + " / " + localLine.children.length)
            localLine.children[i].visible = true
        }
        else {
            //console.log("Hiding " + i + " / " + localLine.children.length)
            localLine.children[i].visible = false
        }
    }

    const startX = localLine.position.x
    anime({
        targets: localLine.position,
        easing: 'easeInQuad', duration: 250, loop: false,
        x: [startX, -0.3 * index],
    })
    //localLine.position.x = -0.3 * index

    var childrenCountMissing = node.children.length - childrenLine.children.length
    while(childrenCountMissing > 0){
        var child = new THREE.Object3D()
        child.add(new THREE.Mesh(sceneGraphGeo, sceneGraphMat))
        childrenLine.add(child)
        child.position.x = 0.3 * childrenLine.children.indexOf(child)
        childrenCountMissing--
    }
    for(var i = 0; i < childrenLine.children.length; i++){
        if(i < node.children.length) childrenLine.children[i].visible = true
        else childrenLine.children[i].visible = false
    }
    
}






var sceneCount = 0
var objectCount = 0
function inspect(target, name){
    if(target === undefined || target === null){
        console.error("Target to inspect is " + target + ".")
        return;
    }
    if(!lastGui) lastGui = new GUI()
    try {
        if(target && target.isScene){
            if(target.object3D){
                sceneEl = target
                scene = target.object3D
            }
            else{
                scene = target
            }
            if(!name) name = "8GUI Scene " + (++sceneCount)
            addSceneFolderToGUI(name, lastGui)
        }
        else {
            if(!name) name = "8GUI Object " + (++objectCount)
            addDynFolder(name, lastGui, target, function(folder, event){
                addObjectToGUI(folder, target, event)
            })
        }
    } catch(e) {
        console.error(e)
    }
    return lastGui
}

export default {
  inspect
};

document.inspect = inspect