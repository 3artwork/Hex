function setHeight(target, parent, height) {
	var item = getFromMap(map, target);
	item.height = item.height + height;
	if(item.height < 0)
		item.height = 0;
	placeInMap(engine.map, target, item);
	var coords = hexToCoords(item.hex);
	coords.z = item.height;
	var parser = new DOMParser();
	parent[0].outerHTML = drawHex(defaultViewBox, coords, (engine.colors[item.color]), item.clickEvent);
}
function setColor(target, parent, colorIndex) {
	var item = getFromMap(engine.map, target);
	item.color = colorIndex;
	placeInMap(engine.map, target, item);
	if(!item.border)
		parent[0].classList = [engine.colors[colorIndex]];
}

function setColorOperation(colorIndex) {
	engine.currentOperation = function(item, parent) { setColor(item, parent, colorIndex); };
}

function setHeightOperation(height) {
	engine.currentOperation = function(item, parent) { setHeight(item, parent, height); }
}

function spin(spinFunction) {
	var spunMap = new Map();
	engine.map.forEach(function(value, key) {
		value.hex = spinFunction(value.hex, engine.currentPosition);
		placeInMap(spunMap, value.hex, value);
	});
	engine.map = spunMap;
	drawMap(engine.LOS);
}

function drawControls() {
	var controlsContainer = $('.controls');
	for(var i = 0; i < engine.colors.length - 1; i++) {
		/* viewBox, oords, radius, color */
		controlsContainer.append('<div>' + drawSVG({x:200, y:200}, [{dimensions:{x:0, y:0, z:1, format: 'coord'}, color:engine.colors[i], clickEvent:('setColorOperation('+i+')'), ignoreTransform:true}]) + '</div>');
	}
	controlsContainer.append('<h1 onclick="setHeightOperation(1)">Increase Height</h1>');
	controlsContainer.append('<h1 onclick="setHeightOperation(-1)">Decrease Height</h1>');
	controlsContainer.append('<h1 onclick="saveMap()">Save Map</h1>');
}
