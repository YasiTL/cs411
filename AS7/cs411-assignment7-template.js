"use strict";

////////////////////////////////////////////////////////////////////////////////////////
//
// cs411 assignment 7 - texture mapping
//
/////////////////////////////////////////////////////////////////////////////////////////

var canvas;
var gl;
var buffers;                        // vertex buffers
var model;                          // object model
var texture;			    // texture map

var lastAnimationTime = Date.now(); // last time tick() was called
var angleStep = 10;                 // increments of rotation angle (degrees)
var fps = 30;                       // frames per second
var currentAngle = 0.0;             // current rotation angle [degree]

// AS7 Global Variables
var wrap = 'CLAMP_TO_EDGE'; // Can be CLAMP_TO_EDGE, REPEAT, or MIRRORED_REPEAT
var minMagParamater = 'LINEAR';
var doMipMap = false;

var objName = 'https://raw.githubusercontent.com/cs411iit/public/master/my-textured-cube.obj';
// var objName = 'data/my-textured-cube.obj'; 


var camZ = 0;
var invertNorm = 0;
var curRot = new Matrix4();
var leftRot = new Matrix4();
var rightRot = new Matrix4();
var upRot = new Matrix4();
var downRot = new Matrix4();
var tmpRot = new Matrix4();

var pauseRotationFlag = false;


// vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec2 a_Texture;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  vec3 lightDirection = vec3(-0.35, 0.35, 0.87);\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  v_Color = vec4(a_Color.rgb * nDotL, a_Color.a);\n' +
  '  v_TexCoord = a_Texture;\n' +
  '}\n';

// fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord)*v_Color;\n' +
  '}\n';


// event handlers

function turnLeft() {
  tmpRot.set(leftRot);
  tmpRot.multiply(curRot);
  curRot.set(tmpRot);
}

function turnRight() {
  tmpRot.set(rightRot);
  tmpRot.multiply(curRot);
  curRot.set(tmpRot);
}

function turnUp() {
  tmpRot.set(upRot);
  tmpRot.multiply(curRot);
  curRot.set(tmpRot);
}

function turnDown() {
  tmpRot.set(downRot);
  tmpRot.multiply(curRot);
  curRot.set(tmpRot);
}

function zoomIn() {
  camZ += 1;
}

function zoomOut() {
  camZ -= 1;
  if (camZ < 0) camZ = 0;
}

function pauseRotation() {
  pauseRotationFlag = !pauseRotationFlag;
}

function setRepeat() {
  console.log("SET TO REPEAT");
  wrap = 'REPEAT'
  texture = loadTexture(gl, 'https://raw.githubusercontent.com/cs411iit/public/master/frac2.png');
}

function setMirroredRepeat() {
  console.log("SET TO MIRRORED_REPEAT");
  wrap = 'MIRRORED_REPEAT'
  texture = loadTexture(gl, 'https://raw.githubusercontent.com/cs411iit/public/master/frac2.png');
}

function setClampToEdge() {
  console.log("SET TO CLAMP_TO_EDGE");
  wrap = 'CLAMP_TO_EDGE'
  texture = loadTexture(gl, 'https://raw.githubusercontent.com/cs411iit/public/master/frac2.png');
}

function setLinear() {
  console.log("SET TO LINEAR");
  minMagParamater = 'LINEAR'
  texture = loadTexture(gl, 'https://raw.githubusercontent.com/cs411iit/public/master/frac2.png');
}

function setNearest() {
  console.log("SET TO NEAREST");
  minMagParamater = 'NEAREST';
  texture = loadTexture(gl, 'https://raw.githubusercontent.com/cs411iit/public/master/frac2.png');
}

function setMipMap() {
  doMipMap = !doMipMap;
  texture = loadTexture(gl, 'https://raw.githubusercontent.com/cs411iit/public/master/frac2.png');
}


// create a buffer object, assign it to attribute variable, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
  var buffer = gl.createBuffer();  // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

  return buffer;
}


function initVertexBuffers(gl, program) {
  var o = new Object(); // create new object. Utilize Object object to return multiple buffer objects
  o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
  o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
  o.textureBuffer = createEmptyArrayBuffer(gl, program.a_Texture, 2, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();
  if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.textureBuffer || !o.indexBuffer) { return null; }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return o;
}


function assignVertexBuffersData(gl, buffers, model) {
  // write date into the buffer objects
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, model.arrays.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, model.arrays.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, model.arrays.colors, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureBuffer);
  for (var i = 0; i < model.arrays.textures.length; i++) {
    model.arrays.textures[i] = model.arrays.textures[i] * 2.0;
  }
  console.log(model.arrays.textures);
  gl.bufferData(gl.ARRAY_BUFFER, model.arrays.textures, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.arrays.indices, gl.STATIC_DRAW);
}


function getShaderVariables(program) {
  //get the storage locations of attribute and uniform variables
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  program.a_Color = gl.getAttribLocation(program, 'a_Color');
  program.a_Texture = gl.getAttribLocation(program, 'a_Texture');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
  program.u_Sampler = gl.getUniformLocation(program, 'u_Sampler');

  if (program.a_Position < 0 || program.a_Normal < 0 || program.a_Color < 0 || program.a_Texture < 0 ||
    !program.u_MvpMatrix || !program.u_NormalMatrix || !program.u_Sampler) {
    console.log('Error getting attribute/uniform location');
    return false;
  }

  return true;
}


function printModelInfo(model) {
  console.log("number of vertices=%d", model.arrays.vertices.length / 3);
  console.log("number of normals=%d", model.arrays.normals.length / 3);
  console.log("number of colors=%d", model.arrays.colors.length / 4);
  console.log("number of texturs=%d", model.arrays.textures.length / 2);
  console.log("nummer of faces=%d", model.arrays.indices.length / 3);

  for (var i = 0; i < 10 && i < model.arrays.vertices.length / 3; i++) {
    console.log("v[%d]=(%f,%f,%f)", i,
      model.arrays.vertices[i * 3 + 0],
      model.arrays.vertices[i * 3 + 1],
      model.arrays.vertices[i * 3 + 2]);
  }
  for (var i = 0; i < 10 && i < model.arrays.vertices.length / 3; i++) {
    console.log("vn[%d]=(%f,%f,%f)", i,
      model.arrays.normals[i * 3 + 0],
      model.arrays.normals[i * 3 + 1],
      model.arrays.normals[i * 3 + 2]);
  }
  for (var i = 0; i < 10 && i < model.arrays.vertices.length / 3; i++) {
    console.log("ccc[%d]=(%d,%d,%d,%d)", i,
      model.arrays.colors[i * 3 + 0],
      model.arrays.colors[i * 3 + 1],
      model.arrays.colors[i * 3 + 2],
      model.arrays.colors[i * 3 + 3]);
  }
  for (var i = 0; i < 6 && i < model.arrays.textures.length / 2; i++) {
    console.log("Vertex texture coordinate: vt[%d]=(%d,%d)", i,
      model.arrays.textures[i * 2 + 0],
      model.arrays.textures[i * 2 + 1]);
  }
  for (var i = 0; i < 10 && i < model.arrays.indices.length / 3; i++) {
    console.log("f[%d]=(%d,%d,%d)", i,
      model.arrays.indices[i * 3 + 0],
      model.arrays.indices[i * 3 + 1],
      model.arrays.indices[i * 3 + 2]);
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function floorPowerOfTwo(value) {
  return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

// Initialize a texture and load an image.
function loadTexture(gl, url) {

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;

  // set default texture (red)
  const pixel = new Uint8Array([255, 0, 0, 255]);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  // load texture (asynchronous)
  const image = new Image();
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  image.onload = function () {
    let width = floorPowerOfTwo(image.width);
    let height = floorPowerOfTwo(image.height);

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, width, height);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(canvas.width) && isPowerOf2(canvas.height)) {

      // Yes, it's a power of 2. Generate mips.
      if (wrap === "REPEAT") {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

      } else if (wrap === "MIRRORED_REPEAT") {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }

      if (doMipMap) {
        console.log("MIPMAP ACTIVATED")
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);  // Get the image data

        var mipmap0 = imageData.data;
        var mipmap1 = imageData.data;
        var mipmap2 = imageData.data;

        for (var i = 0; i < imageData.data.length; i++) {
          imageData.data[4 * i + 0] = 0;  // zero out red channel
          imageData.data[4 * i + 1] = 0;  // zero out green channel
          // imageData.data[4 * i + 2] = 0;  // zero out blue channel
        }

        // for (var i = 0; i < mipmap1.length; i++) {
        //   mipmap0[4 * i + 0] = 0;  // zero out red channel
        //   mipmap1[4 * i + 1] = 0;  // zero out green channel
        //   // mipmap1[4 * i + 2] = 0;  // zero out blue channel
        // }
        
        // for (var i = 0; i < mipmap2.length; i++) {
        //   // mipmap0[4 * i + 0] = 0;  // zero out red channel
        //   mipmap2[4 * i + 1] = 0;  // zero out green channel
        //   mipmap2[4 * i + 2] = 0;  // zero out blue channel
        // }

        ctx.putImageData(imageData, 0, 0);

        // gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, srcFormat, srcType, canvas);
        // gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 516, 256, 0, srcFormat, srcType, mipmap0);
        // gl.texImage2D(gl.TEXTURE_2D, 1, internalFormat, 256, 128, 0, srcFormat, srcType, mipmap1);
        // gl.texImage2D(gl.TEXTURE_2D, 2, internalFormat, 256, 128, 0, srcFormat, srcType, mipmap2);
        // gl.texImage2D(gl.TEXTURE_2D, 3, internalFormat, 64, 32, 0, srcFormat, srcType, imageData.data);
        // gl.texImage2D(gl.TEXTURE_2D, 4, internalFormat, 32, 16, 0, srcFormat, srcType, imageData.data);
        // gl.texImage2D(gl.TEXTURE_2D, 5, internalFormat, 16, 8, 0, srcFormat, srcType, imageData.data);
        // gl.texImage2D(gl.TEXTURE_2D, 6, internalFormat, 8, 4, 0, srcFormat, srcType, imageData.data);
        // gl.texImage2D(gl.TEXTURE_2D, 7, internalFormat, 4, 2, 0, srcFormat, srcType, imageData.data);
        // gl.texImage2D(gl.TEXTURE_2D, 8, internalFormat, 2, 1, 0, srcFormat, srcType, imageData.data);
        // gl.texImage2D(gl.TEXTURE_2D, 9, internalFormat, 1, 1, 0, srcFormat, srcType, imageData.data);

        // gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, imageData);


        // gl.bindTexture(gl.TEXTURE_2D, texture);
      }
    } else {
      // No, it's not a power of 2. Turn of mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    if (minMagParamater === "NEAREST") {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, canvas);

  };
  image.src = url;
  image.crossOrigin = "anonymous";
  return texture;
}



function initScene() {
  // set the clear color and enable the depth test
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // select the viewport
  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // set the projection matrix
  pMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 5000.0);

  // set the modelview matrix
  mvMatrix.setIdentity(); // erase all prior transformations
  mvMatrix.lookAt(0.0, 500.0, 200.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  // start reading the OBJ file
  model = new Object();
  var scale = 60; // 1
  readOBJFile(objName, gl, model, scale, true); // cube.obj

  // init rotation matrices
  curRot.setIdentity();
  leftRot.setRotate(5, 0, 0, 1);
  rightRot.setRotate(-5, 0, 0, 1);
  upRot.setRotate(-5, 1, 0, 0);
  downRot.setRotate(5, 1, 0, 0);

}


function drawScene(gl, program, angle, buffers, model) {

  // Specify the texture map
  gl.activeTexture(gl.TEXTURE0); // use texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(program.u_Sampler, 0);

  // get model arrays if necessary
  if (!model.arrays) {
    if (isOBJFileLoaded(model)) {
      extractOBJFileArrays(model);
      assignVertexBuffersData(gl, buffers, model);
      printModelInfo(model);
    }
    if (!model.arrays) return;   // drawing failed
  }

  // clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

  // perform modeling transformations (rotate)
  mvPushMatrix();
  mvMatrix.multiply(curRot);
  mvMatrix.rotate(angle, 1.0, 0.0, 0.0); // about x
  mvMatrix.rotate(angle, 0.0, 1.0, 0.0); // about y
  mvMatrix.rotate(angle, 0.0, 0.0, 1.0); // about z
  mvMatrix.scale(1 + camZ, 1 + camZ, 1 + camZ);

  // set the normal matrix
  nMatrix.setInverseOf(mvMatrix);
  nMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, nMatrix.elements);

  // compute the combined transformation matrix
  mvpMatrix.set(pMatrix);
  mvpMatrix.multiply(mvMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  mvPopMatrix();

  // draw
  gl.drawElements(gl.TRIANGLES, model.arrays.indices.length, gl.UNSIGNED_SHORT, 0);

}


function animate(angle) {
  var now = Date.now();
  var elapsed = now - lastAnimationTime;
  if (elapsed < 1000 / fps) return angle;
  lastAnimationTime = now;
  // update the current rotation angle (adjusted by elapsed time)
  var newAngle = angle + (angleStep * elapsed) / 1000.0;
  return newAngle % 360;
}


function tick() {
  if (!pauseRotationFlag) {
    currentAngle = animate(currentAngle); // update current rotation angles
  }
  drawScene(gl, gl.program, currentAngle, buffers, model);
  requestAnimationFrame(tick, canvas);
}


function main() {
  // retrieve the <canvas> element
  canvas = document.getElementById('webgl');

  // get rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // get storage locations of attribute and uniform variables
  var program = gl.program;
  if (!getShaderVariables(program)) {
    console.log('Error locating shader variables');
    return;
  }

  // load texture
  //  texture = loadTexture(gl, 'data/frac2.png');
  texture = loadTexture(gl, 'https://raw.githubusercontent.com/cs411iit/public/master/frac2.png');

  // prepare empty buffer objects
  buffers = initVertexBuffers(gl, program);
  if (!buffers) {
    console.log('Failed to set the vertex information');
    return;
  }

  // set button event listeners
  var turnLeftBtn = document.getElementById('turnLeftBtn');
  turnLeftBtn.addEventListener('click', turnLeft);

  var turnRightBtn = document.getElementById('turnRightBtn');
  turnRightBtn.addEventListener('click', turnRight);

  var turnUpBtn = document.getElementById('turnUpBtn');
  turnUpBtn.addEventListener('click', turnUp);

  var turnDownBtn = document.getElementById('turnDownBtn');
  turnDownBtn.addEventListener('click', turnDown);

  var zoomInBtn = document.getElementById('zoomInBtn');
  zoomInBtn.addEventListener('click', zoomIn);

  var zoomOutBtn = document.getElementById('zoomOutBtn');
  zoomOutBtn.addEventListener('click', zoomOut);

  var rotationToggle = document.getElementById('rotation-toggle');
  rotationToggle.addEventListener('click', pauseRotation);

  var repeatToggle = document.getElementById('repeat-toggle');
  repeatToggle.addEventListener('click', setRepeat);

  var mirroredRepeatToggle = document.getElementById('mirrored-repeat-toggle');
  mirroredRepeatToggle.addEventListener('click', setMirroredRepeat);

  var clampToEdgeToggle = document.getElementById('clamp-to-edge-toggle');
  clampToEdgeToggle.addEventListener('click', setClampToEdge);

  var linearToggle = document.getElementById('linear-toggle');
  linearToggle.addEventListener('click', setLinear);

  var nearestToggle = document.getElementById('nearest-toggle');
  nearestToggle.addEventListener('click', setNearest);

  var mipMapToggle = document.getElementById('mip-map-toggle');
  mipMapToggle.addEventListener('click', setMipMap);

  // initialize the scene and start animation
  initScene();
  tick();
}


// EOF


