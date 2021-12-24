"use strict";

// SIGNIFICANTLY GUTTED/SIMPLIFIED/ALTERED VERSION OF ASSIGNMENT 2

// global variables
var canvas;
var gl;
var u_ModelMatrix;
var u_FragColor;
var a_Position;
var vertices;
var n;
var u_BGR;

var boardW = 10.0;          // board width
var boardH = 10.0;          // board height
var curPosX = 0, curPosY = 0;  // current position of object
var curRotAngle = 0;      // current rotation of object
var dX, dY;                // currect direction of motion (unit vector)
var past = [];

var zoom = 1;
var rotateFirst = false;
var translateFirst = false;
var triangles = true;
var BGR = false;

function toggleRotateFirst() {
  rotateFirst = true;
  translateFirst = false;
  drawScene();
}

function toggleTranslateFirst() {
  translateFirst = true;
  rotateFirst = false;
  drawScene();
}

function toggleTriangles() {
  triangles = !triangles;
  drawScene();
}

function toggleBGR() {
  BGR = !BGR;
  gl.uniform1i(u_BGR, BGR ? 1 : 0);
  drawScene();
}

function toggleZoomIn() {
  zoom += 0.1;
  drawScene();
}

function toggleZoomOut() {
  zoom -= 0.1;
  drawScene();
}

const VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform mat4 u_ModelMatrix;
attribute vec3 a_Color;
varying vec3 v_Color;
void main() {
  gl_Position = u_ModelMatrix * a_Position;
  gl_Position.x *= 0.5;
  gl_PointSize = 5.0;
  v_Color = a_Color;
}
`;

const FSHADER_SOURCE = `
precision mediump float;
varying vec3 v_Color;
uniform int u_BGR;
void main() {
  if (u_BGR == 0)
      gl_FragColor = vec4(v_Color, 1);
  else
      gl_FragColor = vec4(v_Color.bgr, 1);
}
`;

let buffer;

function initVertexBuffers() {
  let makeShape = () => {

    let ret = [0, 0, Math.random(), Math.random(), Math.random()]; // x,y,r,g,b

    var totalPoints = 12;

    for (let i = 0; i < totalPoints; i++) {
      var theta = ((Math.PI * 2) / totalPoints);
      var angle = (theta * i);

      var x = 1 * Math.cos(angle);
      var y = 0.5 * Math.sin(angle);

      ret = ret.concat([x, y, Math.random(), Math.random(), Math.random()])
    }

    ret = ret.concat([1, 0, Math.random(), Math.random(), Math.random()])
    console.log({ ret })
    return new Float32Array(ret);
  };

  buffer = makeShape();

  // VIEW AS2 FOR DETAILS ON BELOW

  let vBuffer = gl.createBuffer();
  if (!vBuffer) {
    console.error("Failed to create buffer object");
    return false;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.error("Failed to get the storage location of a_Position");
    return -1;
  }

  let a_Color = gl.getAttribLocation(gl.program, "a_Color");
  if (a_Color < 0) {
    console.error("Failed to get storage location of a_Color");
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 5 * buffer.BYTES_PER_ELEMENT, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 5 * buffer.BYTES_PER_ELEMENT, 2 * buffer.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(a_Color);

}

function initScene() {

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  mvMatrix.setIdentity();

  pMatrix = new Matrix4();
  pMatrix.setIdentity();

  mvMatrix.multiply(pMatrix);
}

function drawScene() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // UNSURE IF THIS IS SUPPOSED TO BE THIS STRAIGHT FORWARD. DOES NOT VISUALLY LOOK GREAT.
  if (translateFirst) {
    mvMatrix.translate(0.5, 0, 0);
    mvMatrix.rotate(45, 0, 0, 1);
  }
  else if (rotateFirst) {
    mvMatrix.rotate(45, 0, 0, 1);
    mvMatrix.translate(0.5, 0, 0);
  }

  // MUST BE DONE LAST
  mvMatrix.setScale(zoom, zoom, zoom);

  // draw triangles
  gl.uniformMatrix4fv(u_ModelMatrix, false, mvMatrix.elements);
  if (triangles)
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 14);
  else
    gl.drawArrays(gl.POINTS, 0, 14);

}

function main() {
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // get canvas height/width
  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;
  console.log(gl.viewportWidth);
  console.log(gl.viewportHeight);

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.error("Failed to initialize shaders");
    return;
  }

  n = initVertexBuffers(gl);
  if (n < 0) {
    console.error("Failed to set positions of verticies");
    return;
  }

  // uniform variable ptrs
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.error("Failed to get storage location of u_ModelMatrix")
  }

  u_BGR = gl.getUniformLocation(gl.program, 'u_BGR');
  if (!u_BGR) {
    console.error("Failed to get the storage location of u_BGR");
    return;
  }


  // add button events
  var rotateFirstBtn = document.getElementById('rotateFirstButton');
  rotateFirstBtn.addEventListener('click', toggleRotateFirst);

  var translateFirstBtn = document.getElementById('translateFirstButton');
  translateFirstBtn.addEventListener('click', toggleTranslateFirst);

  var trianglesOffBtn = document.getElementById('trianglesOffButton');
  trianglesOffBtn.addEventListener('click', toggleTriangles);

  var toggleBGRBtn = document.getElementById('toggleBGRButton');
  toggleBGRBtn.addEventListener('click', toggleBGR);

  var zoomInBtn = document.getElementById('zoomInButton');
  zoomInBtn.addEventListener('click', toggleZoomIn);

  var zoomOutBtn = document.getElementById('zoomOutButton');
  zoomOutBtn.addEventListener('click', toggleZoomOut);

  drawScene();
}