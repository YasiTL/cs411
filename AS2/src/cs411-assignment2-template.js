"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
//
// cs411 assignment 2 - 2d modeling and viewing
//
/////////////////////////////////////////////////////////////////////////////////////////

// global variables
var canvas;
var gl;
var lastAnimationTime = Date.now();
var fps=30;
var u_ModelMatrix;
var u_FragColor;
var a_Position;
var vertices;
var n;

var rotateMatrix = new Matrix4()
var translateMatrix = new Matrix4()
var prevPosX=0;
var prevPosY=0;

var speed=0.1;
var angSpeed=1; 
var renderMode=0;
var pauseFlag=1;
var pauseRotation=1;
var pauseRotationNormal=1;

var boardW=10.0;          // board width
var boardH=10.0;          // board height
var curPosX=0,curPosY=0;  // current position of object
var curRotAngle = 0;      // current rotation of object
var dX,dY;                // currect direction of motion (unit vector)
var past = [];

var global_M = new Matrix4();


// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 3.0;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' + 
  '}\n';


// button event handlers
function speedUp() {
  speed *= 2;
  angSpeed += 1;
  console.log('speed = %f, angSpeed = %f', speed, angSpeed);
}

function speedDown() {
  speed /= 2;
  angSpeed -= 1;
  if (speed<0.0001) speed=0.0001;
  if (angSpeed<1) angSpeed=1;
  console.log('speed = %f, angSpeed = %f', speed, angSpeed);
}

function zoomIn() {
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// YOUR CODE HERE //////////////////////////////////
// Change board width/height and add a scale transformation to mvMatrix
//////////////////////////////////////////////////////////////////////////////////
mvMatrix.scale(1.1, 1.1, 1.1);
}

function zoomOut() {
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// YOUR CODE HERE //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Change board width/height and add a scale transformation to mvMatrix
//////////////////////////////////////////////////////////////////////////////////
mvMatrix.scale(0.9, 0.9, 0.9);
}

function toggleRenderMode() {
  renderMode++; 
  if(renderMode>1) renderMode=0;
  console.log('renderMode = %d', renderMode);
}

function togglePause() {
  pauseFlag = 1-pauseFlag;
  console.log('pauseFlag = %d', pauseFlag);
}

function toggleRotate(){
  //////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// YOUR CODE HERE //////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////
  // Toggle rotation mode
  //////////////////////////////////////////////////////////////////////////////////

  // If normal rotation is on, turn that off.
  if (!pauseRotationNormal) {
    pauseRotation = true;
  }
  pauseRotation = !pauseRotation;
  console.log('Constant Rotation: ', pauseRotation, 'Normal Rotation:', pauseRotationNormal);
}

function toggleNormalRotation(){
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// YOUR CODE HERE //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Toggle rotation to be normal to the path mode
//////////////////////////////////////////////////////////////////////////////////

  // If constant rotation is on, turn that off.
  if (!pauseRotation){
    pauseRotation = true;
  }
  pauseRotationNormal = !pauseRotationNormal;
  console.log('Normal Rotation:', pauseRotationNormal, 'Constant Rotation: ', pauseRotation);
}


function initVertexBuffers(gl) 
{
//////////////////////////////////////////////////////////////////////////////////
////////////////////////// DO NOT CHANGE THIS OBJECT /////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
vertices = new Float32Array(
    [0,    0.3,   
    -0.3, -0.3,   
     0.3, -0.3,
     0.0,  -0.1]); // CM
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  /** 
   * Bind the buffer object to target:
   * 
   * gl.bindBuffer(gl.ARRAY_BUFFER, myBuffer);
   * The first parameter is the type of buffer that we are creating. 
   * We have two options for this parameteres:
   * gl.ARRAY_BUFFER: Vertex data
   * gl.ELEMENT_ARRAY_BUFFER: Index data
   */
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  
  /**
   * Write data into the buffer object
   * WebGL does not accept JavaScript arrays directly as a parameter for 
   * the bufferData method. Instead, WebGL uses typed arrays, so that the 
   * buffer data can be processed in its native binary form with the objective 
   * of speeding up geometry processing performance.
   */
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  /**
   * For un-bind buffer:
   *  gl.bindBuffer(gl.ARRAY_BUFFER, null);
   */

  /**
   * This function receives the current program object and a string that contains the 
   * name of the attribute that needs to be retrieved. Then this function returns a reference 
   * to the respective attribute.
   * 
   * getAttribLocation(Object program,String name)
   */
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  /**
   * Assign the buffer object to a_Position variable:
   * The WebGL function that allows pointing attributes to the currently 
   * bound VBOs is vertexAttribPointer. The following is its signature:
   * 
   *   gl.vertexAttribPointer(Index,Size,Type,Norm,Stride,Offset);
   * Parameters:
   * -Index: An attribute's index that we are going to map the currently bound buffer to.
   * -Size: Indicates the number of values per vertex that are stored in the currently bound buffer.
   * -Type: Specifies the data type of the values stored in the current buffer.
   * -Norm: This parameter can be set to true or false. It handles numeric conversions that lie out of 
   *  the scope of this introductory guide. For all practical effects, we will set this parameter to false.
   * -Stride: If stride is zero, then we are indicating that elements are stored sequentially in the buffer.
   * -Offset: The position in the buffer from which we will start reading values for the corresponding attribute.
   */
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);


  /** 
   * Enable the assignment to a_Position variable:
   * ctivate the vertex shader attribute
   */
  gl.enableVertexAttribArray(a_Position);

  return n;
}


function initScene(gl,u_ModelMatrix,u_FragColor,n)
{
  /** 
   * select the viewport
   * gl.viewport to map normalized device coordinates (NDC)s to viewport coordinates: 
   * gl.viewport(minX, minY, width, height);
   */

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 
  // reset the modelview matrix
  mvMatrix.setIdentity(); // erase all prior transformations

  // select the view window (projection camera/ projection transformation)
  var left=-boardW/2.0, right=boardW/2.0, bottom=-boardH/2.0, top=boardH/2.0, near=0, far=10;
  pMatrix.setIdentity();
  pMatrix.ortho(left,right,bottom,top,near,far);
  mvMatrix.multiply(pMatrix);

  // set the camera position and orientation (viewing transformation)
  var eyeX=0, eyeY=0, eyeZ=10;
  var centerX=0, centerY=0, centerZ=0;
  var upX=0, upY=1, upZ=0;
  mvMatrix.lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ);
}



function drawScene(gl,u_ModelMatrix,u_FragColor,n)
{

  // clear canvas
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  mvPushMatrix();
  
  /**
   * Modelview matrix:
   * If we want to translate or move objects around, we use a mvMatrix to specify
   * these transformations.
   */

  // prepare the transformation for the object 
  // Add code to translate and rotate the triangle. 
  // Use mvMatrix.translate and mvMatrix.rotate commands to translate and rotate
  // the triangle as needed

  // To Do normal Rotations
  if(!pauseRotation) {
    mvMatrix.translate(curPosX, curPosY, 0).rotate(curRotAngle, 0, 0, 1).translate(0, 0.1, 0);
  }
  // 
  else if(!pauseRotationNormal && pauseRotation) {
    mvMatrix.translate(curPosX, curPosY, 0);
    mvMatrix.multiply(global_M);
    mvMatrix.translate(0, 0.1, 0);
  }
  else {
    mvMatrix.translate(curPosX, curPosY, 0);
    mvMatrix.rotate(-90, 0, 0, 1);
    mvMatrix.translate(0, 0.1, 0);
  }
  // draw the object
  /**
   * Use the reference to pass the matrix to the shader with:
   *  uniformMatrix[234]fv(WebGLUniformLocation ref,transpose, matrix): 
   * will load 2x2, 3x3, or 4x4 matrices (corresponding to 2, 3, or 4 in the command name) 
   * of floating points into the uniform referenced by ref. 
   * The type of ref is WebGLUniformLocation. For practical purposes, it is an integer number. 
   * According to the specification, the transpose value must be set to false.
   */
  gl.uniformMatrix4fv(u_ModelMatrix, false, mvMatrix.elements);  

  // copy the vertex data
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); 

  // Red triangle drawing: below 2 lines.
  gl.uniform4f(u_FragColor, 1,0,0,1);

  /** 
   * The functions drawArrays and drawElements are used for writing on the framebuffer.
   * drawArrays() uses vertex data in the order in which it is defined in the buffer to create the geometry. 
   * In contrast, drawElements() uses indices to access the vertex data buffers and create the geometry.
   * 
   *   gl.drawArrays(Mode, First, Count)
   * Parameters:
   * - Mode: Represents the type of primitive that we are going to render. 
   *  Possible values for mode are: gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES, gl.TRIANGLE_STRIP, 
   *  gl.TRIANGLE_FAN, and gl.TRIANGLES.
   * - First: Specifies the starting element in the enabled arrays.
   * - Count: The number of elements to be rendered.
   */
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // White point (CM) drawing: below 2 lines.
  gl.uniform4f(u_FragColor, 1,1,1,1);
  gl.drawArrays(gl.POINTS, 3, 1);     

  mvPopMatrix();

  gl.uniformMatrix4fv(u_ModelMatrix, false, mvMatrix.elements);


  // draw the path as lines
  if(renderMode>0){

    gl.uniform4f(u_FragColor, 1,1,0,1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(past), gl.DYNAMIC_DRAW);
    
    var len = past.length/2;
    gl.drawArrays(gl.LINE_STRIP, 0, len);

    

  }
}



function animate() 
{
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - lastAnimationTime;
  if(elapsed < 1000/fps) return;

  // record the current time
  lastAnimationTime = now;
  
  //////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// YOUR CODE HERE //////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////
  // store the current position in the prevPosX and prevPosY variables so that we 
  // can compute a path vector to help with rotating the triangle to be normal to 
  // the path 
  //////////////////////////////////////////////////////////////////////////////////

  prevPosX = curPosX
  prevPosY = curPosY

  // compute new angle
  curRotAngle += angSpeed;
  if (curRotAngle >360) curRotAngle-=360;

  // compute new position
  curPosX += speed * dX; 
  curPosY += speed * dY;

  // Compute the direction vector
  var directionX = curPosX - prevPosX;
  var directionY = curPosY - prevPosY;

  var magnitude = Math.sqrt((Math.pow(directionX, 2) + Math.pow(directionX, 2)));

  var normalizedDirectionX = directionX / magnitude;
  var normalizedDirectionY = directionY / magnitude;

  if (!pauseRotationNormal)
  {
    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////// YOUR CODE HERE //////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    // Prepare the rotation matrix needed to rotate the triangle so that it is 
    // perpendicular to the path (Question e)
    //////////////////////////////////////////////////////////////////////////////////

    var V = new Vector4([normalizedDirectionX, normalizedDirectionY, 0]);
    var V3DH = new Vector4([V.elements[0], V.elements[1], 0, 1]);
    global_M.setRotate(90, 0, 0, 1);
    V3DH = global_M.multiplyVector4(V3DH);
    
    var xFormMatrix = new Float32Array([
      V.elements[0], V.elements[1], 0, 0,
      V3DH.elements[0], V3DH.elements[1], 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);

    global_M = new Matrix4();
    global_M.elements = xFormMatrix;
  }

  // compute new angle
  if (!pauseRotation){
    curRotAngle += angSpeed;
    if (curRotAngle >360) curRotAngle-=360;
  }

  if (curPosX < -boardW/2.0){ // left intersection
    curPosX = -boardW/2.0;
    dX *= -1;
  }

  if (curPosX > boardW/2.0){ // right intersection
    curPosX = boardW/2.0;
    dX *= -1;
  }

  if (curPosY < -boardH/2.0){ // bottom intersection
    curPosY = -boardH/2.0;
    dY *= -1;
  }

  if (curPosY > boardH/2.0){ // top intersection
    curPosY = boardH/2.0;
    dY *= -1;
  }

  past.push(curPosX);
  past.push(curPosY);
}


function tick()
{
  if (!pauseFlag) animate();                                   // update position and rotation angle
  drawScene(gl,u_ModelMatrix,u_FragColor,n);   // draw the object
  requestAnimationFrame(tick, canvas);         // request a new animation frame
}


function main() 
{
  // Retrieve <canvas> element
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

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // get pointers to shader uniform variables 
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }


  // set button listeners
  var speedUpBtn = document.getElementById('speedUpButton');
  speedUpBtn.addEventListener('click', speedUp);

  var speedDownBtn = document.getElementById('speedDownButton');
  speedDownBtn.addEventListener('click', speedDown);

  var zoomInBtn = document.getElementById('zoomInButton');
  zoomInBtn.addEventListener('click', zoomIn);

  var zoomOutBtn = document.getElementById('zoomOutButton');
  zoomOutBtn.addEventListener('click', zoomOut);

  var renderModeBtn = document.getElementById('renderModeButton');
  renderModeBtn.addEventListener('click', toggleRenderMode);

  var pauseBtn = document.getElementById('pauseButton');
  pauseBtn.addEventListener('click', togglePause);

  //////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// YOUR CODE HERE //////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////
  // Get 'RotationButton' and 'RotationNormalButton' inputs
  //////////////////////////////////////////////////////////////////////////////////
  var rotButton = document.getElementById("rotateButton");
  rotButton.addEventListener("click", toggleRotate);

  var rotNormalButton = document.getElementById("rotateNormalButton");
  rotNormalButton.addEventListener("click", toggleNormalRotation);
  

  // set path angle
  var pathBaseAngle = 30;
  dX = Math.cos(Math.PI * pathBaseAngle / 180.0);
  dY = Math.sin(Math.PI * pathBaseAngle / 180.0);


  // draw
  initScene(gl,u_ModelMatrix,u_FragColor,n);
  //  drawScene(gl,u_ModelMatrix,u_FragColor,n);
  tick();
}





