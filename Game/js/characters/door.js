;


(function() {
	var namespace = DES_GAME.namespace('DES_GAME.Characters'),
		components = SE.namespace('SE.Components'),
		door;

	door = function(scene, layer, startPos) {
		SE.Entity.call(this, scene, layer);
		this.type = 'door';

		var self = this,
			encounterManager = DES_GAME.encounterManager,
			transformComp,
			boxRenderComp;

		transformComp = new components.Transform({ startPos: startPos,
												   scale: {x:2.0, y:4.0} });
		this.registerComponent( transformComp );

		boxRenderComp = new components.BoxRender({fillColor: 'brown'});
		this.registerComponent(boxRenderComp);

		this.registerComponent( new components.CircleCollider({
			isTrigger: true,
			getRadius: function(){ return 40; },
			onTriggerEnter: function(entity) {
				if (encounterManager.allKeysCollected())
					encounterManager.winEncounter();
			},
			shouldTriggerOn: function(entity) {return entity.type === "player";},
			showDebug: true
		}));
	};
	door.prototype = new SE.Entity();
		
	namespace['Door'] = door;
})();