// Add a debug gui for exploring and modifying variables of a threejs scene.

import { GUI } from 'dat.gui'
import * as THREE from 'three';

var scene
var lastGui 
function load(sceneElem){
    if(!sceneElem || !sceneElem.object3D || !sceneElem.camera){
        console.error("load() argument expects a THREE.Scene to run on (with object3D and camera variables).")
        return;
    }
    scene = sceneElem
    try {
        lastGui = new GUI()
        addSceneFolderToGUI(lastGui)
        return lastGui
    } catch(e){
        console.error(e)
    }
}

var onGUIKey = {}
var guiByUUID = {}
var folders = {}

function addSceneFolderToGUI(gui){
    addDynFolder("8GUI", gui, scene, function(types){
        Object.keys(folders).forEach(folder => {
            folders[folder].unnamedNodesCount = 0;
        })
        var guiNodeCount = 0
        scene.object3D.traverse(node => {
            if(!folders[node.type]) folders[node.type] = types.addFolder(node.type)

            var nodeGui
            try {
                if(!node.name || node.name == ""){
                    folders[node.type].unnamedNodesCount = (folders[node.type].unnamedNodesCount || 0) + 1
                    nodeGui = addDynFolder(node.el.id + " " + folders[node.type].unnamedNodesCount, folders[node.type], node, function(folder){
                        addObjectToGUI(folder, node)
                    })
                }
                else {
                    nodeGui = addDynFolder(node.name, folders[node.type], node, function(folder){
                        addObjectToGUI(folder, node)
                    })
                }
            }
            catch(e){
                try {
                    folders[node.type].unnamedNodesCount = (folders[node.type].unnamedNodesCount || 0) + 1
                    nodeGui = addDynFolder(folders[node.type].unnamedNodesCount, folders[node.type], node, function(folder){
                        addObjectToGUI(folder, node)
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
    let folder = addDynFolder("position", nodeGui, node, function(folder){
        folder.add(node.position, "x").step(0.001)
        folder.add(node.position, "y").step(0.001)
        folder.add(node.position, "z").step(0.001)
        folder.add({ locate:function(){
            locate(node)
        }},'locate');
        folder.add({ moveTo:function(){
            moveTo(node)
        }},'moveTo');
    })
    setFolderFontSize(folder)
}

onGUIKey["rotation"]                 = function(nodeGui, node){
    let folder = addDynFolder("rotation", nodeGui, node, function(folder){
        folder.add(node.rotation, "x", 0, Math.PI * 2).step(0.01)
        folder.add(node.rotation, "y", 0, Math.PI * 2).step(0.01)
        folder.add(node.rotation, "z", 0, Math.PI * 2).step(0.01)
    })
    setFolderFontSize(folder)
}

onGUIKey["scale"]                    = function(nodeGui, node){
    let folder = addDynFolder("scale", nodeGui, node, function(folder){
        folder.add(node.scale, "x").step(0.01)
        folder.add(node.scale, "y").step(0.01)
        folder.add(node.scale, "z").step(0.01)
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

onGUIKey["filmGauge"]             = function(nodeGui, node){} // Unknown uses
onGUIKey["filmOffset"]            = function(nodeGui, node){} // Unknown uses
onGUIKey["type"]                  = function(nodeGui, node){}
onGUIKey["fog"]                   = function(nodeGui, node){} // Fog isn't in the official doc...
onGUIKey["vertexColors"]          = function(nodeGui, node){
    node.vertexColors = node.vertexColors ? true : false;
    objectGui.add(object, "vertexColors")
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
    addDynFolder("matrix", nodeGui, node, function(folder){
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

function addObjectToGUI(objectGui, object){
    var keys = Object.keys(object)
    for(var i = 0; i < keys.length; i++){
        var key = keys[i]
        if(!object.hasOwnProperty(key)) continue

        if(onGUIKey[key]) {
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
                addDynFolder(key, objectGui, target, function(folder){
                    addObjectToGUI(folder, target)
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

    folder.__ul.onclick = function(e){
        if(e.target.innerHTML != folderName) return; // Prevent this click reaction outside of the folder

        if(!folder.loaded){
            if(node && e.getModifierState("Shift")) console.log(node[folderName] || node) // Also log node in console when shift + opening
            populateFolderFunction(folder)
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


var boxHelper
var arrowHelper
function locate(node){
    if(boxHelper){
        scene.object3D.remove(boxHelper)
    }
    boxHelper = new THREE.BoxHelper( node, 0xffff00 );
    scene.object3D.add(boxHelper)

    if(arrowHelper){
        scene.object3D.remove(arrowHelper)
    }
    var camera = scene.camera
    var targetPosition = new THREE.Vector3(  node.matrixWorld.elements[12], node.matrixWorld.elements[13], node.matrixWorld.elements[14])
    var cameraPosition = new THREE.Vector3(camera.matrixWorld.elements[12] - 0.01 * camera.matrixWorld.elements[8], camera.matrixWorld.elements[13] - 0.01 * camera.matrixWorld.elements[9], camera.matrixWorld.elements[14] - 0.01 * camera.matrixWorld.elements[10])
    var fromCameraToTarget = new THREE.Vector3(
        node.matrixWorld.elements[12] - camera.matrixWorld.elements[12],
        node.matrixWorld.elements[13] - camera.matrixWorld.elements[13],
        node.matrixWorld.elements[14] - camera.matrixWorld.elements[14])
    var distance = targetPosition.distanceTo(cameraPosition)
    arrowHelper = new THREE.ArrowHelper( fromCameraToTarget.normalize(), cameraPosition, distance, Math.random() * 0xffffff )
    scene.object3D.add(arrowHelper)
}

function moveTo(node){
    var camera = scene.camera
    var cameraman = camera.parent
    var targetWorldBoundingSphereRadius
    try {
        var xNodeVector = new THREE.Vector3(node.matrixWorld.elements[0], node.matrixWorld.elements[1], node.matrixWorld.elements[2])
        var xScale = Math.sqrt(xNodeVector.x * xNodeVector.x + xNodeVector.y * xNodeVector.y + xNodeVector.z * xNodeVector.z)
        var center = node.geometry.boundingSphere.center
        targetWorldBoundingSphereRadius = ((node.geometry.boundingSphere.radius + Math.sqrt(center.x * center.x + center.y * center.y + center.z * center.z)) * xScale) * 2.0
    } catch(e) {
        console.error(e)
        targetWorldBoundingSphereRadius = 1.0
    }

    var targetPosition = new THREE.Vector3(
        node.matrixWorld.elements[12] + targetWorldBoundingSphereRadius * camera.matrixWorld.elements[8 ],
        node.matrixWorld.elements[13] + targetWorldBoundingSphereRadius * camera.matrixWorld.elements[9 ],
        node.matrixWorld.elements[14] + targetWorldBoundingSphereRadius * camera.matrixWorld.elements[10]
    )
    var cameramanPosition = new THREE.Vector3(cameraman.matrixWorld.elements[12], cameraman.matrixWorld.elements[13], cameraman.matrixWorld.elements[14])

    AFRAME.ANIME({
        targets: cameraman.position,
        easing: 'easeInQuad', duration: 1000, loop: false,
        x: [cameramanPosition.x, targetPosition.x],
        y: [cameramanPosition.y, targetPosition.y],
        z: [cameramanPosition.z, targetPosition.z],
    })
}

function inspect(name, target){
    addDynFolder(name, null, target, function(folder){
        addObjectToGUI(folder, target)
    })
}


export default {
  load,
  inspect
};
