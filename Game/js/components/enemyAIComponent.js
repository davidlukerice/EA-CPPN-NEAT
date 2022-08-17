;

/**
 * A component that controls the player
 **/
(function() {
	var namespace = SE.namespace('SE.Components'),
		enemyAI;

	enemyAI = function() {
		namespace.Component.call(this);
		this.type = "enemyAI";

		this.transformComp = null;
		this.movementComp = null;
		this.scene = null;

		this.target = null;
	};

	enemyAI.prototype = new namespace.Component();

	/**
	 * @override from Component
	 **/
	enemyAI.prototype.init = function() {
		this.transformComp = this.entity.getComponentOfType("transform");
		if ( this.transformComp === false )
			SE.error("enemyAI requires a transform Component");
		
		this.movementComp = this.entity.getComponentOfType("movement");
		if ( this.movementComp === false )
			SE.error("enemyAI requires a movement Component");

		this.scene = DES_GAME.SE.sceneManager.getCurrentScene();
		this.target = DES_GAME.player;
	};

	/**
	 * @override from Component
	 **/
	enemyAI.prototype.start = function() {
	};

	/**
	 * @override from Component
	 **/
	enemyAI.prototype.stop = function() {
	};

	/**
	 * @override from Component
	 * @param deltaTime The change in time (milliseconds) since the last
	 *					update was called.
	 **/
	enemyAI.prototype.update = function(deltaTime) {

		var targetTransComp = this.target.getComponentOfType('transform');
		var pos = targetTransComp.getPosition();

		// TODO: Add random jitter based on enemy 'skill'

		this.movementComp.setTargetPosition({x:pos.x,y:pos.y});

	};

	/// Static 

	enemyAI.Type = {
		'Easy': 'E',
		'Medium':'M',
		'Hard':'H'
	};

	namespace['EnemyAIComponent'] = enemyAI;
})();
