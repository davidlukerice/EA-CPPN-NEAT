
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/

// global for debugging access
var network;
var WORLD_WIDTH = 256,
	WORLD_HEIGHT = 256,
	NUM_GENERATIONS = 8,
	RENDER_ON_STEP = 8,
	VARIANCE_THRESHHOLD = 800,
	PRUNING_THRESHOLD = 25;

;(function($) {
	$(function() {
		var log = CPPN.Utils.log,
			container = $('.container'),
			handler;

		// Mutate a network
		showHandler = function(canvas) {
			CPPN.Utils.showCanvas(container, canvas, true);
			container.append('<br />');
		};
		renderHandler = function(network, width, height) {
			return CPPN.renderBWNetwork(network, width, height);
		};

		container.append('Generating Network <br />');
		network = CPPN.generator(2, 4,
								 WORLD_WIDTH,
								 WORLD_HEIGHT,
								 NUM_GENERATIONS,
								 renderHandler,
								 RENDER_ON_STEP,
								 showHandler, run);

		function run() {
			var canvases = CPPN.renderBWNetwork(network,WORLD_WIDTH,WORLD_HEIGHT),
				startTime = new Date().getTime() / 1000;
			
			CPPN.Utils.showCanvas(container, canvases, true);
			container.append('<br />');

			container.append('Quadtree Selection <br />');
			var len = canvases.length, i, canvas, positions=[];
			for (i=0; i<len; ++i) {
				canvas = canvases[i];
				positions.push(CPPN.quadtreeMultiSelection(canvas, VARIANCE_THRESHHOLD,
								 PRUNING_THRESHOLD, CPPN.Utils.getRed, 
								 	function(tree) {
										CPPN.Utils.showCanvas(container, tree.render(), true);
									}));
				container.append('<br />');
			}

			// [(0,0),(1,1)] --> [(0,0),(width,height)]
			function convertToGameSpace(pos) {
				// x:-3/2*WORLD_WIDTH, y:-WORLD_HEIGHT
				// x:3/2*WORLD_WIDTH, y:WORLD_HEIGHT
				var widthDiff = 3*WORLD_WIDTH;
				var widthMin = -3/2*WORLD_WIDTH;
				var heightDiff = 2*WORLD_HEIGHT;
				var heightMin = -WORLD_HEIGHT;
				pos.x=pos.x*widthDiff + widthMin;
				pos.y=pos.y*heightDiff +heightMin;
				return pos;
			}

			log('RunTime: '+ ((new Date().getTime() / 1000) - startTime))

			DES_GAME.initGame = function() {
				var namespace = DES_GAME.namespace('DES_GAME'),
					managers = DES_GAME.namespace('DES_GAME.Managers'),
					characters = DES_GAME.namespace('DES_GAME.Characters');

				// Create the engine
				namespace.SE = new SE.Engine({
					// Called before any of SE's initialization
					preInitHandler: function() { },
					// Called after SE's initialization
					postInitHandler: function() {
						var currentScene = SE.Engine.Instance.currentScene;

						namespace.interfaceManager = new managers.InterfaceManager();
						namespace.encounterManager = new managers.EncounterManager();

						/** Create the entities **/
						namespace.cameraMan = new characters.CameraMan(currentScene, 2,
																	   {x:0,
																	   	y:0});
						namespace.cameraMan.init();
						currentScene.registerEntity(namespace.cameraMan);

						// Create the player character
						var posIndex = CPPN.Utils.randomIndexIn(0, positions[0].length);
						var pos = positions[0][posIndex];
						convertToGameSpace(pos);
						namespace.player = new characters.Player(currentScene,
																 2,
																 {x:pos.x, y:pos.y});
						namespace.player.init();
						currentScene.registerEntity(namespace.player);

						// Generate Door
						posIndex = CPPN.Utils.randomIndexIn(0, positions[1].length);
						pos = positions[1][posIndex];
						convertToGameSpace(pos);
						var door = new characters.Door(currentScene, 2, {x:3/2*WORLD_WIDTH, y:WORLD_HEIGHT});
						door.init();
						currentScene.registerEntity(door);


						// Generate Keys
						var keyPos = positions[2], keylen = keyPos.length, i;
						for(i=0; i<keylen && i<100; ++i) {
							pos = keyPos[i];
							convertToGameSpace(pos);
							var key = new characters.Key(currentScene, 2, {x:pos.x, y:pos.y});
							key.init();
							currentScene.registerEntity(key);
						}

						// Generate enemy
						var enemyPos = positions[3];
						keylen = enemyPos.length;
						for(i=0; i<keylen && i<5; ++i) {
							pos = enemyPos[i];
							convertToGameSpace(pos);
							var enemy = new characters.Enemy(currentScene, 2, {x:pos.x, y:pos.y});
							enemy.init();
							currentScene.registerEntity(enemy);
						}

					},
					// Called after things are loaded right before
					// the game loop
					startHandler: function() { },
					// Called on every update after entities are
					// updated
					updateHandler: function(deltaTime) {
						DES_GAME.cameraMan.getComponentOfType("camera").camera.render();
					},
					// Called when the engine is paused
					pauseHandler: function() { },
					// Called when the engine is unpaused right
					// before the game loop is resumed
					unpauseHandler: function() { },

					imageFiles: DES_GAME_ImageFiles,
					audioFiles: DES_GAME_AudioFiles,

					EDGE_SMOOTHING: false,

					DEBUG_MODE: false,
					DEBUG_COLLIDER_MODE: false,
					DEBUG_HIT_BOXES: false
				}); // eo engine
			}; // eo game

			
			DES_GAME.initGame();
			DES_GAME.SE.init();
			setTimeout(function() {
				//DES_GAME.SE.pause();
			}, 100);
			
			$('#mainCanvas').click(function() {
				DES_GAME.SE.pause();
				//DES_GAME.SE.unpause();
			});
		}

	});
}) (jQuery);
