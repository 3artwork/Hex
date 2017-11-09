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

$(document).ready(function() {
	var cellRadius = 15;
	//engine.map = expand(cellRadius);
	engine.map = preloadMap();
	gen(engine.map);
	drawControls();
	window.onkeydown = function(e) {
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
});

function gen(map) {
	engine.baseHex = preCalcHex(180 * engine.zoom);
	drawMap(engine.LOS);
}
function drawMap(radius) {
	var hexGrid = rearrangeRange(radius, engine.currentPosition);
	$('.map').html('');
	$('.map').append(drawSVG(engine.defaultViewBox, hexGrid));
}

function drawSVG(viewBox, elements) {
	var svg = '<svg id="svg" xmlns="http://www.w3.org/2000/svg" version="1.1" width="100%" viewBox="0 0 ' + viewBox.x + ' ' + viewBox.y +'" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="100%" height="100%" class="background"></rect>';
	for (var i = 0; i < elements.length; i++) {
		if(!elements[i].ignoreTransform) {
			var hexCoords = coordsToHex(elements[i].dimensions);
			hexCoords.x -= engine.currentPosition.x;
			hexCoords.y -= engine.currentPosition.y;
			hexCoords.z -= engine.currentPosition.z;
			var transformed = hexToCoords(hexCoords);
			elements[i].dimensions.x = transformed.x;
			elements[i].dimensions.y = transformed.y;
		}
		var hex = drawHex(viewBox, elements[i].dimensions, elements[i].color, elements[i].border, elements[i].clickEvent, elements[i].ignoreTransform);
		svg += hex;
	}
	svg += '</svg>';
	return svg;
}

function expand(radius) {
	engine.map = new Map();
	for(var i = radius; i >= -radius; i--) {
		var lower = Math.max(-radius, -i - radius);
		var upper = Math.min(radius, -i + radius);
		for(var j = upper; j >= lower; j--) {
			var current = { x:j, y:i, z:(-i-j), format:"hex" };
			placeInMap(engine.map, current, { hex:current, height:1, color:0, clickEvent:('engine.currentOperation('+JSON.stringify(current)+', $(this).parent())'), ignoreTransform:false });
		}
	}
	return engine.map;
}
function preloadMap() {
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
function saveMap() {
	localStorage.setItem('preloaded', JSON.stringify([...engine.map]));
}

function rearrangeRange(radius, origin) {
	var targets = getRange(radius, origin, engine.Fog);
	var hexGrid = [];
	targets.forEach(function(value) {
		var key = hexToCoords(value.hex);
		hexGrid.push({dimensions:{x:key.x, y:key.y, z:value.height, format:"coord"}, border:value.border, color:engine.colors[value.color], clickEvent:value.clickEvent, ignoreTransform:value.ignoreTransform});
	});
	return hexGrid;
}

function placeInMap(map, key, value) {
	map.set(JSON.stringify(hexToCoords(key)), value);
}

function getFromMap(map, target) {
	return map.get(JSON.stringify(hexToCoords(target)));
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