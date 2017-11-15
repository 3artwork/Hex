const express = require('express');
const app = express();
const port = 3000;

app.get('/', request, response) => {
	response.send('Hello from Express!');
}
app.listen(port, (err) => {
	if (err) {
    	return console.log('something bad happened', err);
  	}

  	console.log(`server is listening on ${port}`);
});

var vectors = [
	{x: 1, y: -1, z: 0},
	{x: 1, y: 0, z: -1},
	{x: 0, y: 1, z: -1},
	{x: -1, y: 1, z: 0},
	{x: -1, y: 0, z: 1},
	{x: 0, y: -1, z: 1}
]

var engine = {
	colors: ['gray','blue','darkgreen','yellow','red', 'white', 'border'],
	yscale: 0.5,
	zscale: 15,
	defaultViewBox: {x:2002, y:2002},
	currentPosition: {x:0, y:0, z:0, format:"hex"},
	baseHex: {},
	block: false,
	LOS: 5,
	Fog: 1,
	zoom: 1
}

function preloadMap() {
	engine.map = preloadMap();
	engine.baseHex = preCalcHex(180 * engine.zoom);
	var preloadedMap = new Map(JSON.parse(localStorage.getItem('preloaded')));
	var max = { x:-Infinity, y:-Infinity, z:-Infinity };
	var min = { x:Infinity, y:Infinity, z:Infinity };
	var adjustedMap = new Map();
	preloadedMap.forEach(function(value, key) {
		min.x = Math.min(min.x, value.hex.x);
		min.y = Math.min(min.y, value.hex.y);
		min.z = Math.min(min.z, value.hex.z);
		max.x = Math.max(max.x, value.hex.x);
		max.y = Math.max(max.y, value.hex.y);
		max.z = Math.max(max.z, value.hex.z);
	});
	var offset = { x:0 - Math.floor((min.x + max.x) / 2), y:0 - Math.floor((min.y + max.y) / 2), z:0 - Math.floor((min.z + max.z) / 2) };
	preloadedMap.forEach(function(value, key) {
		var hex = value.hex;
		hex.x += offset.x;
		hex.y += offset.y;
		hex.z += offset.z;
		placeInMap(adjustedMap, hex, { hex:hex, height:value.height, color:value.color, clickEvent:('engine.currentOperation('+JSON.stringify(hex)+', $(this).parent())'), ignoreTransform:false });
	});
	return adjustedMap;
}

function getKeyDownFunc(mode) {
	switch(mode) {
		case 'creator':
			var keydownFunc = function(e) {
				if(!engine.block) {
					engine.block = true;
					switch(e.which) {
						case 38: 
							//move up
							e.preventDefault();
							engine.currentPosition = newPosition(engine.currentPosition, vectors[2], 1);
							drawMap(engine.LOS);
							break;
						case 40:
							//move down
							e.preventDefault();
							engine.currentPosition = newPosition(engine.currentPosition, vectors[5], 1);
							drawMap(engine.LOS);
							break;
						case 39:
							//rotate right
							e.preventDefault();
							spin(rotateLeft);
							break;
						case 37:
							//rotate left
							e.preventDefault();
							spin(rotateRight);
							break;
					}
					engine.block = false;
				}
			}
			return keydownFunc;
		default:
			break;
	}
}
function saveMap() {
	localStorage.setItem('preloaded', JSON.stringify([...engine.map]));
}

function getRange(range, origin, buffer) {
	var targets = [];
	var ymax = origin.y + range;
	var ymin = origin.y - range;
	var xmax = origin.x + range;
	var xmin = origin.x - range;
	var zmax = origin.z + range;
	var zmin = origin.z - range;
	for(var i = ymax; i >= ymin; i--) {
		var lower = Math.max(xmin, -i - zmax);
		var upper = Math.min(xmax, -i - zmin);
		for(var j = upper; j >= lower; j--) {
			var hex = {x:j, y:i, z:(-i-j), format:"hex" }
			var current = getFromMap(engine.map, hex);
			if(typeof current !== 'undefined') {
				if( hex.y >  ymax -  buffer || hex.y < ymin +  buffer || 
					hex.x > upper - buffer || hex.x < lower + buffer || 
					hex.z > zmax -  buffer || hex.z < zmin +  buffer)
					current.border = true;
				else current.border = false;
				targets.push(current);
			}
		}
	}
	return targets;
}