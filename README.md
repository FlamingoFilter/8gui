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