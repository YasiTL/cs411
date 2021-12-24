"use strict";

/////////////////////////////////////////////////////////////////////////////////////////
//
// cs411 assignment 1 - raster graphics
//
/////////////////////////////////////////////////////////////////////////////////////////


var ctx;
var imageData;

var pauseFlag = 1;
var lineFlag = 1;
var triangleFlag = 1;
var fillFlag = 1;
var scanlineFillFlag = 0;


function togglePause() {
  pauseFlag = 1 - pauseFlag;
  console.log('pauseFlag = %d', pauseFlag);
}

function toggleLine() {
  lineFlag = 1 - lineFlag;
  console.log('lineFlag = %d', lineFlag);
}

function toggleTriangle() {
  triangleFlag = 1 - triangleFlag;
  console.log('triangleFlag = %d', triangleFlag);
}

function toggleFill() {
  fillFlag = 1 - fillFlag;
  console.log('fillFlag = %d', fillFlag);
}

function toggleScanlineFill() {
  scanlineFillFlag = 1 - scanlineFillFlag;
  console.log('scanlineFillFlag = %d', scanlineFillFlag);
}

function animate() {
  if (!pauseFlag) {
    if (lineFlag) drawRandomLineSegment();
    if (triangleFlag) drawRandomTriangle();
  }
  setTimeout(animate, 100); // call animate() in 1000 msec
}


function initImage(img) {
  var canvas = document.getElementById('mycanvas');
  ctx = canvas.getContext('2d');

  ctx.drawImage(img, 0, 0);
  imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // get reference to image data
}


function main() {
  // load and display image
  var img = new Image();

  img.crossOrigin = "Anonymous"
  //img.src = 'data/frac2.png';
  img.src = 'https://raw.githubusercontent.com/cs411iit/public/master/frac2.png';
  img.onload = function () { initImage(this); }

  // set button listeners
  var grayscalebtn = document.getElementById('grayscaleButton');
  grayscalebtn.addEventListener('click', grayscale);

  var pausebtn = document.getElementById('pauseButton');
  pausebtn.addEventListener('click', togglePause);

  var linebtn = document.getElementById('lineButton');
  linebtn.addEventListener('click', toggleLine);

  var trianglebtn = document.getElementById('triangleButton');
  trianglebtn.addEventListener('click', toggleTriangle);

  var fillbtn = document.getElementById('fillButton');
  fillbtn.addEventListener('click', toggleFill);

  var scanlinefillbtn = document.getElementById('scanlineFillButton');
  scanlinefillbtn.addEventListener('click', toggleScanlineFill);

  // start animation
  animate();
}


/////////////////////////////////////////////////////////////////////////////////////////
//
// conversion to grayscale
// 
/////////////////////////////////////////////////////////////////////////////////////////

function grayscale() {
  var data = imageData.data;
  for (var i = 0; i < data.length; i += 4) {
    var m = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = m; // red
    data[i + 1] = m; // green
    data[i + 2] = m; // blue
  }
  ctx.putImageData(imageData, 0, 0);
}


/////////////////////////////////////////////////////////////////////////////////////////
//
// draw lines
//
/////////////////////////////////////////////////////////////////////////////////////////


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// REPLACE THIS WITH YOUR FUNCTION FOLLOWING THE ASSIGNMENT SPECIFICATIONS
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// function drawLineSegment(vs,ve,color)
// {
//   var data = imageData.data;
//   var h = imageData.height;
//   var w = imageData.width;

//   var dx = ve[0] -vs[0]; 
//   var dy = ve[1] -vs[1]; 
//   var m = dy/dx;             // slope 
//   var b = vs[1]-m*vs[0];     // y-intercept

//   // ignore invalid lines
//   if ((vs[0] <0) || (vs[1] <0) || (ve[0] >= w) || (ve[1] >= h)) return;
//   if ((vs[0] == ve[0]) && (vs[1] == ve[1])) return;

//   // handle nearly horizontal lines
//   if(Math.abs(m)<1){
//     for (var x = Math.min(vs[0],ve[0]); x <= Math.max(vs[0],ve[0]); x++) {
//       var y=Math.round(m*x+b); // compute y coordinate
//       var yi=h-y;//invert y coordinate
//       data[(yi*w+x)*4+0]     = color[0]; // red
//       data[(yi*w+x)*4+1]     = color[1]; // green
//       data[(yi*w+x)*4+2]     = color[2]; // blue
//     }    
//   }

//   // handle nearly vertical lines
//   else {
//     for (var y = Math.min(vs[1],ve[1]); y <= Math.max(vs[1],ve[1]); y++) {
//       var x=Math.round((y-b)/m); // compute y coordinate
//       var yi=h-y;//invert y coordinate
//       data[(yi*w+x)*4+0]     = color[0]; // red
//       data[(yi*w+x)*4+1]     = color[1]; // green
//       data[(yi*w+x)*4+2]     = color[2]; // blue
//     }    
//   }

//   // update image
//   ctx.putImageData(imageData, 0, 0);
// }

function drawLineSegment(vs, ve, color) {
  var data = imageData.data;
  var w = imageData.width;

  // Every element must be floored into an int or else the comparison in the while loop may never execute
  var x0 = Math.floor(vs[0]);
  var y0 = Math.floor(vs[1]);
  var x1 = Math.floor(ve[0]);
  var y1 = Math.floor(ve[1]);

  function fill(p) {
    data[(p[1] * w + p[0]) * 4 + 0] = color[0];
    data[(p[1] * w + p[0]) * 4 + 1] = color[1];
    data[(p[1] * w + p[0]) * 4 + 2] = color[2];
  }

  var dx = Math.abs(x1 - x0);
  var dy = Math.abs(y1 - y0);
  var sx = (x0 < x1) ? 1 : -1;
  var sy = (y0 < y1) ? 1 : -1;
  var err = dx - dy;

  while (x0 != x1 || y0 != y1) {
    fill([x0, y0])

    var e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  // update image
  ctx.putImageData(imageData, 0, 0);
}

function drawRandomLineSegment() {
  var h = imageData.height;
  var w = imageData.width;

  var xs = Math.floor(Math.random() * w);
  var ys = Math.floor(Math.random() * h);
  var xe = Math.floor(Math.random() * w);
  var ye = Math.floor(Math.random() * h);
  var r = Math.floor(Math.random() * 255);
  var g = Math.floor(Math.random() * 255);
  var b = Math.floor(Math.random() * 255);

  drawLineSegment([xs, ys], [xe, ye], [r, g, b]);
}


/////////////////////////////////////////////////////////////////////////////////////////
//
// draw triangles
//
/////////////////////////////////////////////////////////////////////////////////////////


function triangleArea(a, b, c) {
  var area = ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]));
  area = Math.abs(0.5 * area);
  return area;
}

function vertexInside(v, v0, v1, v2) {
  var T = triangleArea(v0, v1, v2);

  var alpha = triangleArea(v, v0, v1) / T;
  var beta = triangleArea(v, v1, v2) / T;
  var gamma = triangleArea(v, v2, v0) / T;

  if ((alpha >= 0) && (beta >= 0) && (gamma >= 0) && (Math.abs(alpha + beta + gamma - 1) < 0.00001)) return true;
  else return false;
}


//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// REPLACE THIS WITH YOUR FUNCTION FOLLOWING THE ASSIGNMENT SPECIFICATIONS
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
function drawTriangle(v1, v2, v3, color) {

  // If no fill flag, simply draw the lines that make up the triangles.
  if (!fillFlag) {
    drawLineSegment(v1, v3, color);
    drawLineSegment(v2, v3, color);
    drawLineSegment(v2, v1, color);
  } else {
    const randRgb = () => [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];

    function fillBottomFlatTriangle(v1, v2, v3) {
      const inverted_slope1 = Math.floor((v2[0] - v1[0]) / (v2[1] - v1[1]));
      const inverted_slope2 = Math.floor((v3[0] - v1[0]) / (v3[1] - v1[1]));

      let current_x1 = v1[0];
      let current_x2 = v1[0];

      for (let scan = v1[1]; scan <= v2[1]; scan++) {
        drawLineSegment([current_x1, scan], [current_x2, scan], scanlineFillFlag ? randRgb() : color);
        current_x1 += inverted_slope1;
        current_x2 += inverted_slope2;
      }
    }

    function fillTopFlatTriangle(v1, v2, v3) {
      const inverted_slope1 = Math.floor((v3[0] - v1[0]) / (v3[1] - v1[1]));
      const inverted_slope2 = Math.floor((v3[0] - v2[0]) / (v3[1] - v2[1]));

      let current_x1 = v3[0], current_x2 = v3[0];

      for (let scan = v3[1]; scan > v1[1]; scan--) {
        drawLineSegment([current_x1, scan], [current_x2, scan], scanlineFillFlag ? randRgb() : color);
        current_x1 -= inverted_slope1;
        current_x2 -= inverted_slope2;
      }
    }

    // sort coords by y elevation
    [v1, v2, v3] = [v1, v2, v3].sort((a, b) => a[1] - b[1]);

    // trivial cases, those where the veticies are already positioned to be a bottom/top flat triangle.
    if (v2[1] == v3[1]) {
      return fillBottomFlatTriangle(v1, v2, v3);
    } else if (v1[1] == v2[1]) {
      return fillTopFlatTriangle(v1, v2, v3);
    } else {
      // split triangle in half to form top and bottom flat triangles
      var v4 = [v1[0] + ((v2[1] - v1[1]) / (v3[1] - v1[1])) * (v3[0] - v1[0]), v2[1]];

      // Fill both new triangles
      fillBottomFlatTriangle(v1, v2, v4);
      fillTopFlatTriangle(v2, v4, v3);
    }
  }
}

function drawRandomTriangle() {
  var h = imageData.height;
  var w = imageData.width;

  var v0x = Math.floor(Math.random() * w);
  var v0y = Math.floor(Math.random() * h);
  var v1x = Math.floor(Math.random() * w);
  var v1y = Math.floor(Math.random() * h);
  var v2x = Math.floor(Math.random() * w);
  var v2y = Math.floor(Math.random() * h);
  var r = Math.floor(Math.random() * 255);
  var g = Math.floor(Math.random() * 255);
  var b = Math.floor(Math.random() * 255);

  drawTriangle([v0x, v0y], [v1x, v1y], [v2x, v2y], [r, g, b]);

}



//
// EOF
//
