//Create the canvas
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
canvas.width =512;
canvas.height =480;
document.body.appendChild(canvas);

//The main game loop
var lastTime;
function main() {
	var now = Date.now();
	var dt = (now - lastTime) / 1000.0;

	update(dt);
	render();

	lastTime = now;
	requestAnimationFrame(main);
}

(function(){
	var resourceCache = {};
	var loading = [];
	var readyCallbacks = [];

	//Load an image url or an array of image urls
	function load(urlOrArr) {
		if (urlOrArr instanceof Array) {
			urlOrArr.forEach(function(url){
				_load(url);
			})
		}
		else {
			_load(urlOrArr);
		}
	}

	function _load(url) {
		if (resourceCache[url]) {
			return resourceCache[url];
		}
		else {
			var img = new Image();
			img.onload = function(){
				resourceCache[url] = img;
			
				if (isReady()) {
					readyCallbacks.forEach(function(func) { func(); });
				}
			};
			resourceCache[url] = false;
			img.src = url;
		}
	}

	function get(url) {
		return resourceCache[url];
	}

	function isReady() {
		var ready = true;
		for (var k in resourceCache) {
			if (resourceCache.hasOwnProperty(k) && !resourceCache[k]) {
				ready = false;
			}
		}
		return ready;
	};

	function onReady(func) {
		readyCallbacks.push(func)
	};

	window.resources = {
		load: load,
		get: get,
		onReady: onReady,
		isReady: isReady
	}
})();

resources.load([
	'images/sprites.png',
	'images/terrain.png'
]);

resources.onReady(init);

function init() {
	terrainPattern = ctx.createPattern(resources.get('images/terrain.png'), 'repeat');
	document.getElementById('play-again').addEventListener('click', function(){
		reset();
	});

	reset();
	lastTime = Date.now();
	main();
}

//Game state
var player = {
	pos: [0,0],
	sprite: new Sprite('img/sprites.png', [0,0], [39,39], 16, [0,1])
};

var bullets = [];
var enemies = [];
var explosions = [];


var lastFire = Date.now();
var gameTime = 0;
var isGameOver;
var terrainPattern;

//The score
var score = 0;
var scoreEl = document.getElementById('score');

function Sprite(url, pos, size, speed, frame, dir, once) {
	this.pos = pos;
	this.size = size;
	this.speed = typeof speed === 'number' ? speed : 0;
	this.frames = frames;
	this._index = 0;
	this.url = url;
	this.dir = dir || 'horizontal';
	this.once = once;
}

Sprite.prototype.update = function(dt) {
	this._index += this.speed*dt;
}

Sprite.prototype.render = function(ctx) {
	var frame;

	if (this.speed > 0) {
		var max = this.frames.length;
		var idx = Math.floor(this._index);
		frame = this.frames[idx % max];

		if (this.once && idx >= max) {
			this.done = true;
			return;
		}
	} 
	else {
		frame = 0;
	}

	var x = this.pos[0];
	var y = this.pos[1];

	if (this.dir == 'vertical') {
		y += frame * this.size[1];
	} 
	else {
		x += frame * this.size[0];
	}

	ctx.drawImage(resources.get(this.url),
		x, y,
		this.size[0], this.size[1],
		0,0,
		this.siz[0], this.size[1])
}

function update(dt) {
	gameTime += dt;

	handleInput(dt);
	updateEntities(dt);

	//It gets harder over time by adding enemies using this:
	//Equation: 1-.993^gameTime
	if (Math.random() < 1 - Math.pow(.993, gameTime)) {
		enemies.push({
			pos: [canvas.width,
				Math.random() * (canvas.height - 39)],
			sprite: new Sprite('img/sprites.png', [0, 78], [80, 39], 6, [0, 1, 2, 3, 2, 1])
		});
	}

	checkCollisions();

	scoreEl.innerHTML = score;
};

//input.js library
(function(){
	var pressedKeys = {};

	function setKey(event, status) {
		var code = event.keyCode;
		var key;

		switch(code) {
		case 32: 
			key = 'SPACE'; break;
		case 37:
			key = 'LEFT'; break;
		case 38:
			key = 'UP'; break;
		case 39:
			key = 'RIGHT'; break;
		case 40:
			key = 'DOWN'; break;
		default:
			//Convert ASCII codes to letters
			key = String.fromCharCode(code);
		}

		pressedKeys[key] = status;
	}

	document.addEventListener('keydown', function(e) {
		setKey(e, true);
	});

	document.addEventListener('keyup', function(e) {
		setKey(e, false);
	});

	window.addEventListener('blur', function() {
		pressedKeys = {};
	});

	window.input = {
		isDown: function(key) {
			return pressedKeys[key.toUpperCase()];
		}
	};
})();

function handleInput(dt) {
	if (input.isDown('DOWN') || input.isDown('s')) {
		player.pos[1] += playerSpeed * dt;
	}

	if (input.isDown('UP') || input.isDown('w')) {
		player.pos[1] -= playerSpeed * dt;
	}

	if (input.isDown('LEFT') || input.isDown('a')) {
		player.pos[0] -= playerSpeed * dt;
	}

	if (input.isDown('RIGHT') || input.isDown('d')) {
		player.pos[0] += playerSpeed * dt;
	}

	if (input.isDown('SPACE') && !isGameOver &&  Date.now() - lastFire > 100) {
		var x = player.pos[0] + player.sprite.size[0] / 2;
		var y = player.pos[1] + player.sprite.size[1] / 2;

		bullets.push({ pos: [x,y],
						dir: 'forward',
						sprite: new Sprite('img/sprites.png', [0,39], [18,8]) });
		
		bullets.push({ pos: [x,y],
						dir: 'up',
						sprite: new Sprite('img/sprites.png', [0,50], [9,5]) });

		bullets.push({ pos: [x,y],
						dir: 'down',
						sprite: new Sprite('img/sprites.png', [0,60], [9,5]) });
		
		lastFire = Date.now();
	}
}






