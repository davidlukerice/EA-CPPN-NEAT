;

/**
 * A component that controls the player
 **/
(function() {
	var namespace = SE.namespace('SE.Components'),
		playerAI;

	playerAI = function(skill) {
		namespace.Component.call(this);
		this.type = "playerAI";

		this.skill = skill;

		this.transformComp = null;
		this.movementComp = null;
		this.scene = null;

		this.door = null;
		this.keys = [];
		this.enemies = [];
	
		this.jitter = 0;
		this.avoidance = 0;
	};

	playerAI.prototype = new namespace.Component();

	/**
	 * @override from Component
	 **/
	playerAI.prototype.init = function() {
		this.transformComp = this.entity.getComponentOfType("transform");
		if ( this.transformComp === false )
			SE.error("playerAI requires a transform Component");
		
		this.movementComp = this.entity.getComponentOfType("movement");
		if ( this.movementComp === false )
			SE.error("playerAI requires a movement Component");

		this.scene = DES_GAME.SE.sceneManager.getCurrentScene();

		var skillTypes = playerAI.Skill;
		if (this.skill === skillTypes.Novice) {
			SE.log("Starting novice player");
			this.jitter = 1;
			this.avoidance = 0;
		}
		else if (this.skill === skillTypes.Experienced) {
			SE.log("Starting Experienced player");
			this.jitter = 0.5;
			this.avoidance = 0.2;
		}
		else if (this.skill === skillTypes.Master) {
			SE.log("Starting Master player");
			this.jitter = 0;
			this.avoidance = 0.8;
		}
		else
			SE.error("Incorrect Skill given for player AI");
	};

	/**
	 * @override from Component
	 **/
	playerAI.prototype.start = function() {
		// Build out player's knowledge of the world
		var sceneEntities = this.scene.entities,
			i = sceneEntities.length;
		while (i--) {
			entity = sceneEntities[i];
			if (entity.type === 'key')
				this.keys.push(entity);
			else if (entity.type === 'enemy')
				this.enemies.push(entity);
			else if (entity.type === 'door')
				this.door = entity;
		}
	};

	/**
	 * @override from Component
	 **/
	playerAI.prototype.stop = function() {
	};

	/**
	 * @override from Component
	 * @param deltaTime The change in time (milliseconds) since the last
	 *					update was called.
	 **/
	playerAI.prototype.update = function(deltaTime) {

		var target = this.findClosestKey();
		if (!target)
			target = this.door;

		var targetTransComp = target.getComponentOfType('transform');
		var pos = targetTransComp.getPosition();
		var currentPos = this.transformComp.getPosition();
		var vect = new SE.Vector2(pos.x, pos.y);
		vect.sub(currentPos);
		vect.normalize();

		// TODO: calculate offsets from enemies
		
		var i = this.enemies.length,
			enemy, enemyPos, vectToEnemy = new SE.Vector2(0,0);
		while (i--) {
			enemy = this.enemies[i];
			enemyPos = enemy.getComponentOfType('transform').getPosition();
			vectToEnemy.x = enemyPos.x;
			vectToEnemy.y = enemyPos.y;
			vectToEnemy.sub(currentPos);
			vectToEnemy.inverse();
			vectToEnemy.normalize();
			vectToEnemy.scale(this.avoidance);
			vect.add(vectToEnemy);
		}

		// Add random jitter based on player 'skill'
		var jitterVect = SE.Vector2.getRandomUnitVector();
		jitterVect.scale(this.jitter);
		vect.add(jitterVect);
		vect.normalize();

		this.movementComp.setTargetPosition({x:currentPos.x + 20*vect.x,
											 y:currentPos.y + 20*vect.y});

	};

	playerAI.prototype.shouldFindNextTarget = function() {
		return !this.target
				|| ! ((this.target.type === 'key' && !this.target.getComponentOfType('Collectable').isCollected)
					   || this.target.type === 'door');
	};

	playerAI.prototype.findClosestKey = function() {
		var keys = this.keys,
			i = keys.length,
			key, keyTransform, keyDistance,
			bestKey = null, alreadyCollected,
			bestDistance = Number.MAX_VALUE;
		while (i--) {
			key = keys[i];
			keyTransform = key.getComponentOfType('transform');
			keyDistance = DESMath.DistanceSquared(this.transformComp.getPosition(),
												  keyTransform.getPosition());
			alreadyCollected = key.getComponentOfType('Collectable').isCollected;
			if ( !alreadyCollected && keyDistance < bestDistance) {
				bestDistance = keyDistance;
				bestKey = key;
			}
		}
		return bestKey;
	};

	/// Static 
	playerAI.Skill = {
		'Novice': 'N',
		'Experienced':'E',
		'Master':'M'
	};

	namespace['PlayerAIComponent'] = playerAI;
})();
