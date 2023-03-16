# 8gui

When creating few 8thwall projects, three things slowed our project development on 8thwall :
1/ Setting up scenegraph nodes positions/rotations/scales is a lot of guessing the good values, reloading app and visually confirming it's fine.
2/ Setting up threejs materials can be complicated and time consuming for doing nice effects.
3/ Sometimes we load up new assets and are searching them for hours. It could be because of :
- tiny scales, gigantic scales
- far away position
- invisible material setup
- animations not running
- disabled scene part
- some model data never loaded
- skinned mesh bounding box issues

For those three reasons we wanted to have the ability to edit during runtime objects transforms, to have tools to locate them in space, and to be able to edit material property during runtime too.

Thus we created a tool for this purpose : 8gui
8gui provides a runtime scene inspector GUI.

We showcase it in a 8thwall face effect project copy :
	https://flamingofilter.8thwall.app/official-8thwall-face-demo

You should notice the top right GUI. Try to explore contexts and change values. (Simplest test should be Glasses --> visible : on/off)
_______________________
It's simple to setup :
1/ Add the 8gui-standalone.js to the 8thwall project
2/ In your js, add :    require('./8gui-standalone') 
3/ And further, use the only exposed function 'document.inspect()' on every object you want to inspect/edit:

_______________________
The three lines we added in the original face-scene.js from 8thwall official demo :

```js
require('./8gui-standalone')                        // <----- Make sure 8gui is loaded
// .....
loader.load(require('./assets/Models/stereo-glasses.glb'), (glassesObj) => {
    glassesObj.scene.scale.set(1.1, 1.1, 1.1)
    glasses.add(glassesObj.scene)
    document.inspect(glasses, "Glasses")            // <----- New line for inspecting the glasses object3d
  })
// .....
const {scene} = XR8.Threejs.xrScene()
document.inspect(scene)                             // <----- New line for inspecting the whole scene
```

We also made 8gui an npm js module : https://www.npmjs.com/package/8gui

We are trying to make the inspector more intelligent with specific tools.
One of them already present is a 'locate' button inside 'position' objects.
Clicking on it should create a yellow bounding box on the target with a 3D arrow going from camera center to the target world position.

A few other tools like this are in progress but not working as intended yet, like MoveTo buttons next to Locate buttons.
Feedback and participations are welcome.

Feel free to use 8gui in your projects for speeding up development ! (Licence is Apache 2.0)

Cheers from the Flamingos