cnvs = document.getElementById("cnvs")
ctx = cnvs.getContext("2d")

var width, height

cnvs.width = width = innerWidth
cnvs.height = height = innerHeight

document.addEventListener("keydown", keyPress)

window.addEventListener("resize", function(e){
	cnvs.width = width = innerWidth
	cnvs.height = height = innerHeight
	startUp()
} )


function keyPress(event){
	key = event.keyCode

	if (key == 67) restart()				//c for restart
	
	
	if (key == 88) cam.z -= cam.step		//x	fly down
	if (key == 90) cam.z += cam.step		//z fly up
	if (key == 87) takeStep(cam.yaw)		//w	walk forward
	if (key == 83) takeStep(cam.yaw + 180)	//s walk backwards
	if (key == 65) takeStep(cam.yaw - 90)	//a walk left
	if (key == 68) takeStep(cam.yaw + 90)	//d walk right	
	if (key == 69) cam.yaw   += cam.lookStep			//e	//look left
	if (key == 81) cam.yaw   -= cam.lookStep  			//q	//look right
	if (key == 82) cam.pitch += cam.lookStep			//r	//look up
	if (key == 70) cam.pitch -= cam.lookStep   			//f	//look down
	if (key == 89) cam.roll  += cam.lookStep			//y //roll left
	if (key == 84) cam.roll  -= cam.lookStep			//t //roll right
	if (key == 187) cam.fov += 5				//+ increase fov
	if (key == 189) cam.fov -= 5				//- decrease fov
	if (key == 71) wireframe = !wireframe   	//g toggle wireframe
	if (key == 77) miniMap = !miniMap 			//m toggle minimap
	renderWorld()
	
	
}


function startUp(){
	
	ctx.textBaseline = "middle"
	ctx.fillStyle = "#c6b9cc"
	ctx.font = "150px cambria"
	ctx.textAlign = "center"
	ctx.fillText("Welcome", width / 2, height / 5)
	lines = [
	"",
	"",
	"The aim is to escape the maze.",
	"Good luck!",
	"",
	"Full screen (F11) is recommended",
	"",
	"Controls:",
	"w: walk forward",
	"a: walk left",
	"s: reverse",
	"d: walk right",
	"q: yaw left",
	"e: yaw right",
	"r: pitch up",
	"f: pitch down",
	"+: increase fov",
	"-: decrease fov",
	"g: toggle wireframe",
	"m: toggle mini map",
	"c: begin"
	]
	ctx.textAlign = "left"
	ctx.font = "25px cambria"
	for (l = 0; l < lines.length; l ++){
		ctx.fillText(lines[l], width / 2 - 200, height / 5 + l * 25 + 60)
	}
}

startUp()

wireframe = false
miniMap = true

function restart(){
	playing = true
	
	blockWidth = 40
	
	cam = {x: 60, y: -100, z: 10, pitch: 0, yaw: 0, roll: 0, fov: 40, step: 4, lookStep: 10}		//camera

	cube = { coords: block, c: "#c6b9cc", x: 0, y: 0, z: 0, yaw: 0 }
	
	objects = []
	
	
	for (var y = 0; y < mazeHeight * 2 + 1; y ++){
		for (var x = 0; x < mazeWidth * 2 + 1; x++){
			if (maze[y][x])	objects.push({ coords: block, c: "#c6b9cc", x: x * blockWidth , y: y * blockWidth, z : 0, yaw :0 })
		}
	}
	
	renderWorld()
}

function takeStep(yaw){
	cam.x = cam.step * Math.sin(radFromDeg(yaw)) + cam.x
	cam.y = cam.step * Math.cos(radFromDeg(yaw)) + cam.y
}

distanceBetween = (co1, co2) => Math.sqrt(Math.pow(co2.x - co1.x , 2) + Math.pow(co2.y - co1.y , 2) + Math.pow(co2.z - co1.z , 2))

function drawPoints(canvasCoordinates){	//acctually does the drawing of the coordinates from the canvas coordinates fills in with reference to the shape index array
	
	//splitting the coordinates into triangles i.e the faces
	for (s = 0; s < canvasCoordinates.length; s ++){
		canvasCoordinates.splice(s,3,[canvasCoordinates[s],canvasCoordinates[s+1],canvasCoordinates[s+2]])
	}
	//canvas coordinates is now an array of faces (arrays): [ [ {x: , y: , z: ,...}, {x: , y: , z: ,...}, {x: , y: , z: ,...} ], [ {x: , y: , z: ,...}, ..... ] ]
	
	//sort the triangles
	if (!wireframe) sortedFaces = canvasCoordinates.sort(sortFaces)
	else sortedFaces = canvasCoordinates

	//acctually draw the faces

	for (s = 0; s < sortedFaces.length; s++){
		face = sortedFaces[s]

		if (offScreen(face)) continue
		
		ctx.beginPath(face[0].x, face[0].y)
		ctx.lineTo(face[1].x, face[1].y)
		ctx.lineTo(face[2].x, face[2].y)
		ctx.lineTo(face[0].x, face[0].y)
		ctx.strokeStyle = "black"
		ctx.stroke()
		ctx.closePath()
		if (!wireframe){
			ctx.fillStyle = objects[unifiedCoords[face[0].i].originObj].c
			ctx.fill()
		}
	}	
}


function unifyObjectCoords(){
	objectColours = []
	unifiedCoords = []
	for (o = 0; o < objects.length; o++){
		obj = objects[o]
		newCoords = obj.coords.map(zAxisRotate(-obj.yaw)).map(translate(obj.x,obj.y,obj.z))
		newCoords.forEach( function(i) {i.originObj = o} )
		unifiedCoords.push(...newCoords)
	}
	return unifiedCoords
}

function renderObjects(){				//draws the 3d objects from their coordinates and cam position onto canvas in 2d	
	
	unifiedCoords = unifyObjectCoords()
	
	camPerspectiveCoordinates = unifiedCoords.map( translate(-cam.x, - cam.y, -cam.z) ).map( zAxisRotate(cam.yaw)).map(xAxisRotate(cam.pitch)).map( yAxisRotate(cam.roll)).map(translate(cam.x,cam.y,cam.z))

	coordAnglesFromCamCenter = camPerspectiveCoordinates.map(angleFromCoord)
	
	canvasCoordinates = coordAnglesFromCamCenter.map(mapAngletoFitCanvas)
		
	drawPoints(canvasCoordinates)
}

function mapAngletoFitCanvas(o, index){
	return { x: width / 2 + (o.yaw * (width / cam.fov) ), y: height / 2 - (o.pitch * (width / cam.fov) ), i: index }
}

function angleFromCoord(coord){									   //takes a coordinate and returns the yaw and pitch angles from the camera
	yaw =  degFromRad( Math.atan2(coord.x - cam.x, coord.y - cam.y) )	
	pitch = degFromRad(Math.atan2(coord.z - cam.z, coord.y - cam.y) )

	return {yaw: yaw, pitch: pitch}
}


function renderMiniMap(){										//renders the minimap
	
	if (!miniMap) return

	mapWidth = width / 5
	mapHeight = height / 5
	
	border = 0.6
	gap = 5
	arrowLength = 70
	
	ctx.fillStyle = "black"
	ctx.fillRect(width - gap, gap, -mapWidth + border * -2, mapHeight + border * 2)
	ctx.fillStyle = "white"
	ctx.fillRect(width - border - gap, border + gap, -mapWidth, mapHeight)
	
	centerX = width - border - gap - mapWidth / 2
	centerY = border + gap + mapHeight / 2
	scale = 0.3
	adjustPointsY = mapHeight / 3
	adjustPointsX = mapWidth / -4
	
	dot = 5;
	
	var coordinates = unifiedCoords
	
	
	
	for (f = 0; f < coordinates.length; f+=3){
		face = [coordinates[f], coordinates[f+1], coordinates[f+2]]
		shape = face
		
		ctx.strokeStyle = "black"
		ctx.beginPath(centerX + shape[0].x * scale + adjustPointsX, centerY  + shape[0].y * -1 * scale + adjustPointsY)
		for (p = 1; p < shape.length; p++){
			ctx.lineTo(centerX + shape[p].x * scale + adjustPointsX, centerY  + shape[p].y * -1 * scale + adjustPointsY)
			ctx.stroke()
		}
		ctx.lineTo(centerX + shape[0].x * scale + adjustPointsX, centerY  + shape[0].y * -1 * scale + adjustPointsY)
		ctx.stroke()
		ctx.closePath()
		ctx.fillStyle = objects[face[0].originObj].c
		ctx.fill()
	}
	
	drawLine(centerX - mapWidth / 2, centerY + adjustPointsY, centerX + mapWidth / 2, centerY + adjustPointsY)
	drawLine(centerX + adjustPointsX, centerY - (mapHeight / 2 + adjustPointsY) + adjustPointsY, centerX + adjustPointsX, centerY + mapHeight / 2)
	
	
	drawCircle(centerX + cam.x * scale + adjustPointsX,  centerY + cam.y * scale * -1 + adjustPointsY, dot / 2, "#00ffed")
	
	
	
	ctx.fillStyle = "rgbA(107,255,125,0.5)"
	ctx.beginPath(centerX + cam.x * scale, centerY + cam.y * scale * -1 + adjustPointsY)
	ctx.lineTo(centerX + (Math.sin(radFromDeg(cam.yaw - 0.5 * cam.fov)) * arrowLength) + cam.x * scale + adjustPointsX, centerY - (Math.cos(radFromDeg(cam.yaw - 0.5 * cam.fov)) * arrowLength) + cam.y * scale * -1 + adjustPointsY)
	ctx.arc(centerX + cam.x * scale + adjustPointsX, centerY + cam.y * scale * -1 + adjustPointsY, arrowLength, radFromDeg(-90 - cam.fov * 0.5 + cam.yaw), radFromDeg(-90 + cam.fov * 0.5 + cam.yaw) )
	ctx.lineTo(centerX + cam.x * scale + adjustPointsX, centerY + cam.y * scale * -1 + adjustPointsY)
	ctx.closePath()
	ctx.fill()
	
}

function renderHUD(){
	if (!miniMap) mapHeight = 0
	
	fontSize = 15
	ctx.font = fontSize.toString() + "px " + "aerial"
	ctx.fillStyle = "red"
	tables = [
	//cam table
	[
	["Camera:", ""],
	["x", padLeft(cam.x)],
	["y", padLeft(cam.y)],
	["z", padLeft(cam.z)],
	["yaw", padLeft(cam.yaw)],
	["pitch", padLeft(cam.pitch)],
	["roll", padLeft(cam.roll)],
	["fov", padLeft(cam.fov)],
	],
	
	//controls
	[
	["Controls:", ""],
	["w", "forward"],
	["a", "left"],
	["s", "backwards"],
	["d", "right"],
	["q", "yaw left"],
	["e", "yaw right"],
	["r", "pitch up"],
	["f", "pitch down"],
	["g", "wireframe"],
	["m", "mini map"], 
	["+", "incr. fov"],
	["-", "decr. fov"]
	]
	]
	
	tableWidth = 80
	tableGap = 20
	
	for (t = 0; t < tables.length; t++){
		table = tables[t]
		for (r = 0; r < table.length; r++){
			ctx.textAlign = "left"
			ctx.fillText(table[r][0], width - (mapWidth + 2 * border + gap) + t * (tableWidth + tableGap), (mapHeight + 2 * border + gap) + r * fontSize + fontSize)
			ctx.textAlign = "right"
			ctx.fillText(table[r][1], width - (mapWidth + 2 * border + gap) + (t+1) * tableWidth + t * tableGap, (mapHeight + 2 * border + gap) + r * fontSize + fontSize)
		}
	}
}

function renderWorld(){											//draws the world from given cam perspective and object coodinates
	
	clearScreen()

	
	moduloCamViewpoint()
	renderObjects()
	renderCrosshairs()
	if (miniMap) renderMiniMap()
	renderHUD()

	
}



//SHORT SPECIFIC FUNCTIONS//SHORT SPECIFIC FUNCTIONS//SHORT SPECIFIC FUNCTIONS//SHORT SPECIFIC FUNCTIONS//SHORT SPECIFIC FUNCTIONS//SHORT SPECIFIC FUNCTIONS//SHORT SPECIFIC FUNCTIONS//SHORT SPECIFIC FUNCTIONS

function centroidFace(face){
	avgCo = {x: 0, y: 0, z: 0}
	for (c = 0; c < face.length; c++){
		cord = camPerspectiveCoordinates[face[c].i]
		avgCo.x += cord.x
		avgCo.y += cord.y
		avgCo.z += cord.z
	}
	return {x: avgCo.x / face.length, y: avgCo.y / face.length, z: avgCo.z / face.length}
}

function sortFaces(faceA, faceB){
	if ( distanceBetween(cam, centroidFace(faceA)) >  distanceBetween(cam, centroidFace(faceB)) ) return -1
	return 1
}

function offScreen(face){
	for (c = 0; c < face.length; c++){
		if ( (face[c].x > 0 && face[c].x < width) || (face[c].y > 0 && face[c].y < height) ) return false
	}
	return true
}

//////transformation functions.../////

function translate(x,y,z){
	return o => ({x: o.x + x, y: o.y + y, z: o.z + z })
}

function xAxisRotate(deg){
	r = radFromDeg(deg)
	return o => ({x: o.x,  y: o.y * Math.cos(r) + o.z * Math.sin(r),  z:  -o.y * Math.sin(r) + o.z * Math.cos(r)})
}

function yAxisRotate(deg){
	r = radFromDeg(deg)
	return o => ({x: o.x * Math.cos(r) + o.z * Math.sin(r),  y: o.y,  z : -o.x * Math.sin(r) + o.z * Math.cos(r)})
}

function zAxisRotate(deg){
	r = radFromDeg(deg)
	return o => ({x: o.x * Math.cos(r) - o.y * Math.sin(r),  y: o.x * Math.sin(r) + o.y * Math.cos(r),  z: o.z})
}

/////////////////////////////////////


function moduloCamViewpoint(){
	while (cam.yaw <= -180) cam.yaw += 360
	while (cam.yaw > 180) cam.yaw -= 360
	while (cam.pitch <= -180) cam.pitch += 360
	while (cam.pitch > 180) cam.pitch -= 360
	while (cam.roll <= -180) cam.roll += 360
	while (cam.roll > 180) cam.roll -= 360
}

function sortFaceVerticies(a, b){								//orderes face verticies a and b
	if ( distanceBetween(cam, centroidFace(a.v)) >  distanceBetween(cam, centroidFace(b.v)) ) return -1
	return 1
}
	
function padLeft(num){											//returns string of number padded from left to make a 5 charachter string
	return ("\xa0\xa0\xa0\xa0" + parseFloat(num.toFixed(1))).slice(-5)
}

function padRight(string, length){									//pads a string to a 7 charachter string
	return (string + "\xa0\xa0\xa0\xa0\xa0\xa0").slice(0,5)
}

function drawLine(xStart, yStart, xFin, yFin){					//draws a line on the canvas
   ctx.beginPath();
   ctx.moveTo(xStart, yStart);
   ctx.lineTo(xFin, yFin);
   ctx.stroke();
}

function drawCross(x, y, l){									//draws a cross on canvas in relation to the midpoint
	drawLine( width/2 + x + l, height / 2 + y, width / 2 + x - l, height /2 + y)
	drawLine(width /2 + x, height / 2 + y + l,width / 2 + x, height /2 + y - l)
}

function renderCrosshairs(){									//draws the two axis and center crosshar
	drawCross(0, 0, 30)
	for (a = 113.09; a <= 20 * 113.09; a += 113.09){
		drawCross(a, 0, 5)
		drawCross(-1 * a, 0, 5)
		drawCross(0, a, 5)
		drawCross(0, -1 * a, 5)
	}
}

function degFromRad(rad){										//returns degree angle from radian angle
	return rad * (180 / Math.PI)
}

function radFromDeg(deg){
	return deg * ( Math.PI / 180)
}

function clearScreen(){											//returns canvas to balank screen
	ctx.clearRect(0, 0, width, height)
}

function drawCircle(x, y, radius, color){
	ctx.beginPath(x, y)
	ctx.arc(x, y, radius, 0, Math.PI * 2)
	ctx.strokeStyle = "black"
	ctx.stroke()
	ctx.fillStyle = color
	ctx.fill()
}
