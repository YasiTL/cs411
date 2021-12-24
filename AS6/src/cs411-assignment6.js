"use strict";

////////////////////////////////////////////////////////////////////////////////////////
//
// cs411 assignment 6 - illumination
//
/////////////////////////////////////////////////////////////////////////////////////////

var canvas;
var gl;
var buffers;                        // vertex buffers
var model;                          // object model

var lastAnimationTime = Date.now(); // last time tick() was called
var angleStep = 10;                 // increments of rotation angle (degrees)
var fps = 30;                       // frames per second
var currentAngle = 0.0;             // current rotation angle [degree]

// var objName = 'https://raw.githubusercontent.com/cs411iit/public/master/mycube.obj'; 
var objName = 'https://raw.githubusercontent.com/cs411iit/public/master/cow.obj';  

var camZ = 0;
var invertNorm = 1;
var curRot = new Matrix4();
var leftRot = new Matrix4();
var rightRot = new Matrix4();
var upRot = new Matrix4();
var downRot = new Matrix4();
var tmpRot = new Matrix4();

// My new AS6 Variables
var xLightPosition = -0.35;
var yLightPosition = 0.35;
var zLightPosition = 0.87;

// Attenuation Constants
var k_constant = 1.0;
var k_linear = 1.0;
var k_quadratic = 1.0;

var i_ambient = 1.0;
var k_ambient = 0.5;

var i_diffuse = 1.0;
var k_diffuse = 0.5;

var i_specular = 1.0;
var k_specular = 0.5;
var ns = 1; // highlight size



// vertex shader program
var VSHADER_SOURCE = 
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +

  // New Variable for light direction
  'uniform vec3 u_lightDirection;\n' +
  // New Variables for Attenuation coefficients
  'uniform float u_kconstant;\n' +
  'uniform float u_klinear;\n' +
  'uniform float u_kquadratic;\n' +
  // New Variables for calculating ambient light
  'uniform float u_Iambient;\n' + // intensity for ambient light
  'uniform float u_kambient;\n' + // material property for ambient light
  // New Variables for calculating specular reflection
  'uniform float u_Ispecular;\n' + // intensity for specular light
  'uniform float u_kspecular;\n' + // material property for specular light
  'uniform float u_ns;\n' + // highlight size paramater for specular light
  // New Variables for calculating specular reflection
  'uniform float u_Idiffuse;\n' + // intensity for diffuse reflection
  'uniform float u_kdiffuse;\n' + // material property for diffuse reflection

  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  // '  vec3 lightDirection = vec3(-0.35, 0.35, 0.87);\n' +

  // Change position of light
  '  vec3 lightDirection = u_lightDirection;\n' +

  //** Calculate Attenuation **
  '  float dist = length(u_lightDirection + vec3(a_Position.xyz));\n' + // Distance to obj from light source + distance to camera from obj
  '  float attenuation = 1.0/(u_kconstant + (u_klinear*dist) + (u_kquadratic*pow(dist, 2.0)));\n' +

  // Starter Code Position Stuff
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +

  // Needed Paramaters and Diffuse/Specular Calculations
  '  vec3 R = (2.0*nDotL*normal) - u_lightDirection.xyz;\n' + // calculate the vector R from slides
  '  float RdotV = max(dot(R, vec3(gl_Position)), 0.0);\n' + // calculate R dot V, no need for approx, we have gl_Position.

  // Calculate ambient, specular and diffuse reflection with calculated paramaters and user inputs
  '  float ambient = u_kambient * u_Iambient;\n' + // Equation for ambient light from slides
  '  float specular = u_kspecular * u_Ispecular * pow(RdotV, u_ns);\n' + // Equation for specualr reflection from slides 
  '  float diffuse = u_kdiffuse * u_Idiffuse * nDotL;\n' + // Equation for diffuse reflection from slides
  '  float Itotal = ambient + (attenuation * (specular + diffuse));\n' +

  '  v_Color = vec4(a_Color.rgb * Itotal, a_Color.a);\n' +
  '}\n';

// fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// COPIED FROM LIB OBJ-LOADER.JS AND MODIFIED TO NOT NORMALIZE THE RESULT
function calcNormal(p0, p1, p2) {
  var v0 = new Float32Array(3);
  var v1 = new Float32Array(3);
  for (var i = 0; i < 3; i++){
    v0[i] = p0[i] - p1[i];
    v1[i] = p2[i] - p1[i];
  }

  // The cross product of v0 and v1
  var c = new Float32Array(3);
  c[0] = v0[1] * v1[2] - v0[2] * v1[1];
  c[1] = v0[2] * v1[0] - v0[0] * v1[2];
  c[2] = v0[0] * v1[1] - v0[1] * v1[0];

  var v = new Vector3(c);
  return v.elements;
}

// event handlers

function turnLeft()
{
  tmpRot.set(leftRot);
  tmpRot.multiply(curRot);
  curRot.set(tmpRot);    
}

function turnRight()
{
  tmpRot.set(rightRot);
  tmpRot.multiply(curRot);
  curRot.set(tmpRot);    
}

function turnUp()
{
  tmpRot.set(upRot);
  tmpRot.multiply(curRot);
  curRot.set(tmpRot);    
}

function turnDown()
{
  tmpRot.set(downRot);
  tmpRot.multiply(curRot);
  curRot.set(tmpRot);    
}

function zoomIn()
{
  camZ+=1;
}

function zoomOut()
{
  camZ-=1;
  if (camZ<0) camZ=0;
}

function invertNormals()
{
  invertNorm = !invertNorm;
  
  for (var i = 0; i < model.arrays.normals.length; i++) {
    for (var j = 0; j < 3; j++) {
      model.arrays.normals[i * 3 + j] *= -1;
    }
  }
  assignVertexBuffersData(gl, buffers, model);
  console.log(model.arrays.normals);
}

// AS6 Related Event Handlers

//Lighting
function setLightDirectionX(e)
{
  xLightPosition = e.target.value;
}

function setLightDirectionY(e)
{
  yLightPosition = e.target.value;
}

function setLightDirectionZ(e)
{
  zLightPosition = e.target.value;
}

// Attenuation
function setKConstant(e)
{
  k_constant = e.target.value;
  console.log(e.target.value)
}

function setKLinear(e)
{
  k_linear = e.target.value;
}

function setKQuadratic(e)
{
  k_quadratic = e.target.value;
}

// Ambient
function setKAmbient(e)
{
  k_ambient = e.target.value;
  console.log(e.target.value);
}

function setIAmbient(e)
{
  i_ambient = e.target.value;
  console.log(e.target.value);
}

//Specular
function setKSpecular(e)
{
  k_specular = e.target.value;
  console.log(e.target.value);
}

function setISpecular(e)
{
  i_specular = e.target.value;
  console.log(e.target.value);
}

function setHighlightSize(e)
{
  ns = e.target.value;
  console.log(e.target.value);
}

// Diffuse
function setKDiffuse(e)
{
  k_diffuse = e.target.value;
  console.log(e.target.value);
}

function setIDiffuse(e)
{
  i_diffuse = e.target.value;
  console.log(e.target.value);
}

// create a buffer object, assign it to attribute variable, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) 
{
  var buffer =  gl.createBuffer();  // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

  return buffer;
}


function initVertexBuffers(gl, program) 
{
  var o = new Object(); // create new object. Utilize Object object to return multiple buffer objects
  o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT); 
  o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();
  if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return o;
}


function assignVertexBuffersData(gl, buffers, model) 
{
  // write date into the buffer objects
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, model.arrays.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, model.arrays.normals, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, model.arrays.colors, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.arrays.indices, gl.STATIC_DRAW);
}


function getShaderVariables(program)
{
  //get the storage locations of attribute and uniform variables
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  program.a_Color = gl.getAttribLocation(program, 'a_Color');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');

  // Added

  // Lighting Vector direction
  program.u_lightDirection = gl.getUniformLocation(program, 'u_lightDirection');

  // Attenuation
  program.u_kconstant = gl.getUniformLocation(program, 'u_kconstant');
  program.u_klinear = gl.getUniformLocation(program, 'u_klinear');
  program.u_kquadratic = gl.getUniformLocation(program, 'u_kquadratic');

  //Ambient
  program.u_Iambient = gl.getUniformLocation(program, 'u_Iambient');
  program.u_kambient = gl.getUniformLocation(program, 'u_kambient');

  // Specular
  program.u_Ispecular = gl.getUniformLocation(program, 'u_Ispecular');
  program.u_kspecular = gl.getUniformLocation(program, 'u_kspecular');
  program.u_ns = gl.getUniformLocation(program, 'u_ns');

  // Diffuse
  program.u_Idiffuse = gl.getUniformLocation(program, 'u_Idiffuse');
  program.u_kdiffuse = gl.getUniformLocation(program, 'u_kdiffuse');

  if (program.a_Position < 0 ||  program.a_Normal < 0 || program.a_Color < 0 ||
      !program.u_MvpMatrix || !program.u_NormalMatrix) {
    console.log('attribute, uniform'); 
    return false;
  }
  return true;
}


function printModelInfo(model) 
{
  console.log("number of vertices=%d",model.arrays.vertices.length/3);
  console.log("number of normals=%d",model.arrays.normals.length/3);
  console.log("number of colors=%d",model.arrays.colors.length/4);
  console.log("number of faces=%d",model.arrays.indices.length/3);

  for(var i=0;i<10 && i< model.arrays.vertices.length; i++){
    console.log("v[%d]=(%f,%f,%f)",i,
      model.arrays.vertices[i*3+0],
      model.arrays.vertices[i*3+1],
      model.arrays.vertices[i*3+2]);
  }
  for(var i=0;i<10 && i< model.arrays.vertices.length; i++){
    console.log("n[%d]=(%f,%f,%f)",i,
      model.arrays.normals[i*3+0],
      model.arrays.normals[i*3+1],
      model.arrays.normals[i*3+2]);
  }
  for(var i=0;i<10 && i< model.arrays.indices.length; i++){
    console.log("f[%d]=(%d,%d,%d)",i,
      model.arrays.indices[i*3+0],
      model.arrays.indices[i*3+1],
      model.arrays.indices[i*3+2]);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
// Fix the vertex and face array
//////////////////////////////////////////////////////////////////////////////////////////
function fixVertexAndFaceArray(model){
  // Fix vertex array
  var vertexTable = model.objDoc.vertices;
  var vertexNum = vertexTable.length;
  var vertexArray = [];
  for (var i=0; i<vertexTable.length; i++){
    vertexArray.push(vertexTable[i].x, vertexTable[i].y, vertexTable[i].z);
  }
  model.arrays.vertices = new Float32Array(vertexArray);
  // console.log(vertexArray, vertexArray.length);

  // Fix face array
  var faceTable = model.objDoc.objects[0].faces;
  var faceArray = [];
  for (var i=0; i<faceTable.length;i++){
    faceArray.push(faceTable[i].vIndices[0], faceTable[i].vIndices[1], faceTable[i].vIndices[2]);
  } 
  model.arrays.indices = new Uint16Array(faceArray);

  // Fix normal array
  // Just keep the model.arrays.normals and model.arrays.vertices the same length
  // Need to compute vertex normal again in 2.4. 
  // It seems that there is an outlier vertex in cow.obj, not belonging to any faces. 
  model.arrays.normals = model.arrays.normals.slice(0, vertexArray.length)

  // Set all normals to 0
  for (var i=0; i < model.arrays.normals.length; i++) {
    model.arrays.normals[i] = 0;
  }

  // console.log(faceTable);
  // console.log(vertexTable);
  // console.log('vertex array: ', vertexArray);

  // Loop through the face table
  for (var i=0; i < faceTable.length; i++) {
    // For every face in the face table, I am checking the property vIndicies to get the indicies
    // used in the face, 
    var v0 = Object.values(vertexTable[faceTable[i].vIndices[0]]);
    var v1 = Object.values(vertexTable[faceTable[i].vIndices[1]]);
    var v2 = Object.values(vertexTable[faceTable[i].vIndices[2]]);

    var faceNormal = calcNormal(v0, v1, v2);
    
    for (var j = 0; j < 3; j++) {
      model.arrays.normals[(3 * faceTable[i].vIndices[0]) + j] += faceNormal[j];
      model.arrays.normals[(3 * faceTable[i].vIndices[1]) + j] += faceNormal[j];
      model.arrays.normals[(3 * faceTable[i].vIndices[2]) + j] += faceNormal[j];
    }
  }

  for (var i=0; i < model.arrays.normals.length; i++) {
    var curr_normal = [model.arrays.normals[3*i], model.arrays.normals[3*i + 1], model.arrays.normals[3*i + 2]]

    var length = Math.sqrt((curr_normal[0]**2) + (curr_normal[1]**2) + (curr_normal[2]**2));

    model.arrays.normals[3*i] = curr_normal[0] / length;
    model.arrays.normals[3*i + 1] = curr_normal[1] / length;
    model.arrays.normals[3*i + 2] = curr_normal[2] / length;
  }

  // Fix color array [optional]
  model.arrays.colors = model.arrays.colors.slice(0, vertexArray.length/3*4)
}



function initScene()
{
  // set the clear color and enable the depth test
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // select the viewport
  gl.viewportWidth = canvas.width;
  gl.viewportHeight = canvas.height;
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 
  // set the projection matrix
  pMatrix.setPerspective(30.0, canvas.width/canvas.height, 1.0, 5000.0);

  // set the modelview matrix
  mvMatrix.setIdentity(); // erase all prior transformations
  mvMatrix.lookAt(0.0, 500.0, 200.0,   0.0, 0.0, 0.0,   0.0, 1.0, 0.0);

  // start reading the OBJ file
  model = new Object();
  var scale=60; // 1
  readOBJFile(objName, gl, model, scale, true); // cube.obj

  // init rotation matrices
  curRot.setIdentity(); 
  leftRot.setRotate ( 5, 0,1,0);
  rightRot.setRotate(-5, 0,1,0);
  upRot.setRotate   (-5, 1,0,0);
  downRot.setRotate ( 5, 1,0,0);
}


function drawScene(gl, program, angle, buffers, model) 
{
  // get model arrays if necessary
  if (!model.arrays){
    if(isOBJFileLoaded(model)){
      extractOBJFileArrays(model);
      /////////////////////////////////////////////////////////////////////
      // Fix model arrays
      /////////////////////////////////////////////////////////////////////
      fixVertexAndFaceArray(model)
      
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
  mvMatrix.scale(1+camZ, 1+camZ, 1+camZ);

  // set the normal matrix
  nMatrix.setInverseOf(mvMatrix);
  nMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, nMatrix.elements);

  // compute the combined transformation matrix
  mvpMatrix.set(pMatrix); 
  mvpMatrix.multiply(mvMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  mvPopMatrix();

  // Establish Uniform variables
  gl.uniform3f(program.u_lightDirection, xLightPosition, yLightPosition, zLightPosition);

  // Attenuation 
  gl.uniform1f(program.u_kconstant, k_constant);
  gl.uniform1f(program.u_klinear, k_linear);
  gl.uniform1f(program.u_kquadratic, k_quadratic);

  // Ambient
  gl.uniform1f(program.u_Iambient, i_ambient);
  gl.uniform1f(program.u_kambient, k_ambient);

  // Specular
  gl.uniform1f(program.u_Ispecular, i_specular);
  gl.uniform1f(program.u_kspecular, k_specular);
  gl.uniform1f(program.u_ns, ns);

  // Diffuse
  gl.uniform1f(program.u_Idiffuse, i_diffuse);
  gl.uniform1f(program.u_kdiffuse, k_diffuse);

  gl.uniform1f(program.u_camZ, camZ);

  // draw
  gl.drawElements(gl.TRIANGLES, model.arrays.indices.length, gl.UNSIGNED_SHORT, 0);

}


function animate(angle) 
{
  var now = Date.now(); 
  var elapsed = now - lastAnimationTime;
  if(elapsed < 1000/fps) return angle;
  lastAnimationTime = now;
  // update the current rotation angle (adjusted by elapsed time)
  var newAngle = angle + (angleStep * elapsed) / 1000.0;
  return newAngle % 360;
}


function tick() 
{
  // currentAngle = animate(currentAngle); // update current rotation angles
  drawScene(gl, gl.program, currentAngle, buffers, model);
  requestAnimationFrame(tick, canvas);
}


function main() 
{
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
  if(!getShaderVariables(program)){
    console.log('error locating shader variables');
    return; 
  }

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

  var invertNormalsBtn = document.getElementById('invertNormalsBtn');
  invertNormalsBtn.addEventListener('click', invertNormals);

  // Light Position Event Listeners
  var xLightPositionInput = document.getElementById('x-light-position');
  xLightPositionInput.addEventListener('change', setLightDirectionX);

  var yLightPositionInput = document.getElementById('y-light-position');
  yLightPositionInput.addEventListener('change', setLightDirectionY);

  var zLightPositionInput = document.getElementById('z-light-position');
  zLightPositionInput.addEventListener('change', setLightDirectionZ);

  // Attenuation Event Listeners
  var k_constant = document.getElementById('k_constant-input');
  k_constant.addEventListener('change', setKConstant);

  var k_linear = document.getElementById('k_linear-input');
  k_linear.addEventListener('change', setKLinear);

  var k_quadratic = document.getElementById('k_quadratic-input');
  k_quadratic.addEventListener('change', setKQuadratic);

  // Ambiant Light Event Listeners
  var i_ambient = document.getElementById('ambient-intensity-input');
  i_ambient.addEventListener('change', setIAmbient);

  var k_ambient = document.getElementById('material-ambient-input');
  k_ambient.addEventListener('change', setKAmbient);

  // Specular Light Event Listeners
  var i_specular = document.getElementById('specular-intensity-input');
  i_specular.addEventListener('change', setISpecular);

  var k_specular = document.getElementById('material-specular-input');
  k_specular.addEventListener('change', setKSpecular);

  var ns = document.getElementById('highlight-size-input');
  ns.addEventListener('change', setHighlightSize);

  // Diffuse Light Event Listeners
  var i_diffuse = document.getElementById('diffuse-intensity-input');
  i_diffuse.addEventListener('change', setIDiffuse);

  var k_diffuse = document.getElementById('material-diffuse-input');
  k_diffuse.addEventListener('change', setKDiffuse);

  // initialize the scene and start animation
  initScene();
  tick();
}


// EOF