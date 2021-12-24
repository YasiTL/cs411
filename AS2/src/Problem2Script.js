// Translate 2D vector
function translate2DCoordinate(coordinate, translation) {
    return [coordinate[0] + translation[0], coordinate[1] + translation[1]];
}

// Scale 2D vector
function scale2DCoordinate(coordinate, translation) {
    return [coordinate[0] * translation[0], coordinate[1] * translation[1]];
}

// Convert from degrees to radians.
Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
}
Math.radians(90); // 1.5707963267948966

// Rotate a 2D vector
function rotate2DCoordinate(coordinate, degrees, pivot) {
    // Get sin and cos of degree in radians
    var sin_rad = Math.sin(Math.radians(degrees));
    var cos_rad = Math.cos(Math.radians(degrees));

    // Subtract the target coordinate by the location of the pivot of the rotation
    // Makes it easier to rotate around the origin
    coordinate[0] -= pivot[0];
    coordinate[1] -= pivot[1];

    // rotate point
    var new_x = coordinate[0] * cos_rad - coordinate[1] * sin_rad;
    var new_y = coordinate[0] * sin_rad + coordinate[1] * cos_rad;

    // Add the new x/y value due to rotation and the pivot to translate it back.
    coordinate[0] = new_x + pivot[0];
    coordinate[1] = new_y + pivot[1];

    return coordinate;
}

// Find the Homogeneous coordinate from 2D
function convert2DToHomogeneousCoordinate(coordinate) {
    return [coordinate[0], coordinate[1], 1]
}

function convertHomogeneousTo2DCoordinate(coordinate) {
    return [(coordinate[0]/coordinate[2]), (coordinate[1]/coordinate[2])]
}


console.log("2a. ", translate2DCoordinate([1,1], [2,3]).toString());
console.log("2b. ", scale2DCoordinate([1,1], [2,2]).toString());
console.log("2c. ", rotate2DCoordinate([1,1], 45, [0,0]).toString());
console.log("2d. ", convert2DToHomogeneousCoordinate([1,1]).toString());
console.log("2e. ", convertHomogeneousTo2DCoordinate([1,1,2]).toString());
console.log("2f. ", [2, 4, 6].toString());
console.log("2i. ", rotate2DCoordinate([2,5], 30, [0,0]).toString());
console.log("2j. ", rotate2DCoordinate([2,5], 30, [1,2]).toString());
console.log("2k. ", rotate2DCoordinate(translate2DCoordinate([2,5], [3,4]), 45, [0,0]).toString());
console.log("2l. ", translate2DCoordinate(rotate2DCoordinate([2,5], 45, [0,0]), [3,4]).toString());
console.log("2m. ", rotate2DCoordinate(translate2DCoordinate([5,6], [1,2]), 45, [0,0]).toString());

