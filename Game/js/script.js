
;
/// ANN Designer Game
this['DES_GAME'] = this['DES_GAME'] || {};

(function() {

	DES_GAME.namespace = SE.generateNameSpaceHandler(DES_GAME, 'DES_GAME');

	DES_GAME.initGame = function() {
		var namespace = DES_GAME.namespace('DES_GAME'),
			managers = DES_GAME.namespace('DES_GAME.Managers'),
			characters = DES_GAME.namespace('DES_GAME.Characters');

		// Create the engine
		namespace.SE = new SE.Engine({
			// Called before any of SE's initialization
			preInitHandler: function() {

			},
			// Called after SE's initialization
			postInitHandler: function() {
				var currentScene = SE.Engine.Instance.currentScene;

				namespace.interfaceManager = new managers.InterfaceManager();
				namespace.encounterManager = new managers.EncounterManager();

				/** Create the entities **/
				namespace.cameraMan = new characters.CameraMan(currentScene, 2, {x:250, y:250});
				namespace.cameraMan.init();
				currentScene.registerEntity(namespace.cameraMan);

				// Create the player character
				namespace.player = new characters.Player(currentScene,
														 2,
														 {x:0, y:0});
				namespace.player.init();
				currentScene.registerEntity(namespace.player);

				var key = new characters.Key(currentScene, 2, {x:150, y:150});
				key.init();
				currentScene.registerEntity(key);
				key = new characters.Key(currentScene, 2, {x:250, y:150});
				key.init();
				currentScene.registerEntity(key);
				key = new characters.Key(currentScene, 2, {x:150, y:250});
				key.init();
				currentScene.registerEntity(key);

				var door = new characters.Door(currentScene, 2, {x:400, y:400});
				door.init();
				currentScene.registerEntity(door);
			
				var enemy = new characters.Enemy(currentScene, 2, {x:500, y:10});
				enemy.init();
				currentScene.registerEntity(enemy);
			},
			// Called after things are loaded right before
			// the game loop
			startHandler: function() {
				
			},
			// Called on every update after entities are
			// updated
			updateHandler: function(deltaTime) {
				DES_GAME.cameraMan.getComponentOfType("camera").camera.render();
			},
			// Called when the engine is paused
			pauseHandler: function() {

			},
			// Called when the engine is unpaused right
			// before the game loop is resumed
			unpauseHandler: function() {

			},

			imageFiles: DES_GAME_ImageFiles,
			audioFiles: DES_GAME_AudioFiles,

			EDGE_SMOOTHING: false,

			DEBUG_MODE: true,
			DEBUG_COLLIDER_MODE: true,
			DEBUG_HIT_BOXES: true
		}); // eo engine
	}; // eo game

	$(function() {
		DES_GAME.initGame();
		DES_GAME.SE.init();
	});
	
})();