function newPosition(origin, vector, velocity) {
	return { x:(origin.x + vector.x) * velocity, y:(origin.y + vector.y) * velocity, z:(origin.z + vector.z) * velocity, format:"hex"};
}

function rotateRight(hex, center) {
	var vector = { x:(hex.x - center.x), y:(hex.y - center.y), z:(hex.z - center.z) };
	var rotated = { x:-vector.z, y:-vector.x, z:-vector.y };
	return { x:(rotated.x + center.x), y:(rotated.y + center.y), z:(rotated.z + center.z), format:hex.format };
}

function rotateLeft(hex, center) {
	var vector = { x:(hex.x - center.x), y:(hex.y - center.y), z:(hex.z - center.z) };
	var rotated = { x:-vector.y, y:-vector.z, z:-vector.x };
	return { x:(rotated.x + center.x), y:(rotated.y + center.y), z:(rotated.z + center.z), format: hex.format };
}

function hexToCoords(hex) {
	if(hex.format !== 'hex')
		throw 'not a hex format! Format: ' + hex.format;
	var x = hex.x;
	var y = hex.z + (hex.x + (hex.x & 1)) / 2;
	return {x:x, y:y, format: "coord" };
}

function coordsToHex(coords) {
	if(coords.format !== 'coord' && coords.format !== 'control')
		throw 'not a coordinate or control format! Format: ' + coords.format;
	var x = coords.x;
	var z = coords.y - (coords.x + (coords.x & 1)) / 2;
	y = -x - z;
	return { x:x, y:y, z:z, format:"hex" }
}
function preCalcHex(radius) {
	var center = [radius / 2, radius / 2];
	var points = [];
	for (var i = 0; i < 6; i++) {
		var point = { };
		point.x = Math.floor(center[0] + radius / 2 * Math.cos(i * 2 * Math.PI / 6));
		point.y = Math.floor(center[1] + radius / 2 * Math.sin(i * 2 * Math.PI / 6));
		points.push(point);
	}
	return {radius:radius, points: points};
}

function getZPath(coords, points, position) {
	var path = '<path class="hex fore '+ position + '" ' + 
			'd="M ' + points[0].x + ' ' + points[0].y + 
			' L ' + points[0].x + ' ' + (points[0].y + 2*engine.zscale*coords.z) + 
			' L ' + points[1].x + ' ' + (points[1].y + 2*engine.zscale*coords.z) + 
			' L ' + points[1].x + ' ' + points[1].y + ' z"/>';
	return path;
}

function drawHex(viewBox, coords, color, border, clickEvent){
	var xoff = Math.floor(viewBox.x / 2 + (coords.x * 3 / 4 * engine.baseHex.radius)) - engine.baseHex.radius / 2;
	var off = (coords.x & 1) / 2;
	var yoff = Math.floor(viewBox.y / 2 + (engine.baseHex.radius / 2) * ((coords.y - off) * Math.sqrt(3) * engine.yscale - 1 / 2 ) - engine.zscale * coords.z);
	var hexcoord = coordsToHex(coords);
	var transform = 'translate(' + xoff + ', ' + yoff + '), scale(1, ' + engine.yscale + ')';
	//var text = '<text onclick=\''+clickEvent+'\' transform="scale(1, 2)" x="40" y="60" font-family="Helvetica" font-size="40">'+hexcoord.x+','+hexcoord.y+','+hexcoord.z+'</text>';
	var hex = '';

	for (var i = 0; i < engine.baseHex.points.length; i++) {
		hex += ' ' + engine.baseHex.points[i].x + ',' + engine.baseHex.points[i].y;
	}

	hex = '<polygon class="hex top" points="' + hex + '" onclick=\''+clickEvent+'\'/>';
	if(coords.z*engine.zscale > 0) {
		var supports = [];
		var rect = 'M ';
		supports.push(getZPath(coords, [engine.baseHex.points[0], engine.baseHex.points[1]], 'right'));
		supports.push(getZPath(coords, [engine.baseHex.points[1], engine.baseHex.points[2]], 'center'));
		supports.push(getZPath(coords, [engine.baseHex.points[2], engine.baseHex.points[3]], 'left'));
		hex = makeBackground(false) + supports[0] + "\n\t" + supports[2] + "\n\t" + supports[1] + "\n\t" + hex + (border ? makeBackground(true) : '');
	}
	function makeBackground(border) {
		var background = '<path class="hex fill' + (border ? ' border' : '') + '" ' +
			'd="M ' + engine.baseHex.points[0].x + ' ' + (engine.baseHex.points[0].y + 2*engine.zscale * coords.z);
		for(var i = 0; i <= 3; i++) {
			background += ' L ' + engine.baseHex.points[i].x + ' ' + (engine.baseHex.points[i].y + 2*engine.zscale * coords.z);
		}
		for(var i = 3; i <= 5; i++) {
			background += ' L ' + engine.baseHex.points[i].x + ' ' + engine.baseHex.points[i].y;
		}
		background += ' L ' + engine.baseHex.points[0].x + ' ' + engine.baseHex.points[0].y + ' z"/>';
		return background;
	}
	return '<g class="' + color + '"'+((typeof transform !== 'undefined') ? ' transform="' + transform + '" ' : '')+'>' + hex + '</g>';
}