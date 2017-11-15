$(document).ready(function() {
	var cellRadius = 15;
	drawMap(cellRadius);
	drawControls();
	window.onkeydown = 
});

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

function rearrangeRange(radius, origin) {
	var targets = getRange(radius, origin, engine.Fog);
	var hexGrid = [];
	targets.forEach(function(value) {
		var key = hexToCoords(value.hex);
		hexGrid.push({dimensions:{x:key.x, y:key.y, z:value.height, format:"coord"}, border:value.border, color:engine.colors[value.color], clickEvent:('engine.currentOperation('+JSON.stringify(value.hex)+', $(this).parent())'), ignoreTransform:value.ignoreTransform});
	});
	return hexGrid;
}

function placeInMap(map, key, value) {
	map.set(JSON.stringify(hexToCoords(key)), value);
}

function getFromMap(map, target) {
	return map.get(JSON.stringify(hexToCoords(target)));
}
