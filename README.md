Utility tool for modifying Threejs scenes variables during runtime.

Simple npm module with only one function : inspect(), taking up to two arguments.
First argument is mandatory : the variable to setup a GUI for.
Second argument is optionnal : the GUI button name.

## Installation

The easiest way to install 8gui is from [`npm`](https://www.npmjs.com/):

```sh
npm i 8gui
```

## Quickstart

```js
import GUI from '8gui'

// Pure JS use
var someJSObjectToInspect = {aString : "aStringValue", aFloat : "2.8"}
GUI.inspect(someJSObjectToInspect, "my Var GUI Editor")

// Enhanced THREE.Scene use
GUI.inspect(document.getElementById("scene")) // Presume a <a-scene id="scene"> in the dom

```