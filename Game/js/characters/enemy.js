;


(function() {
	var namespace = DES_GAME.namespace('DES_GAME.Characters'),
		components = SE.namespace('SE.Components'),
		enemy;

	enemy = function(scene, layer, startPos) {
		SE.Entity.call(this, scene, layer);
		this.type = 'enemy';

		var self = this;

		var transformComp = new components.Transform({ startPos: startPos,
													   scale: {x:2.0, y:2.0} });
		this.registerComponent( transformComp );
		var movementComp = new components.Movement({ targetPos: {x:startPos.x, y:startPos.y} });
		this.registerComponent( movementComp );

		var boxRenderComp = new components.BoxRender({});
		this.registerComponent(boxRenderComp);

		this.registerComponent( new components.BoxCollider({
										getWidth: function() {
											return boxRenderComp.getWidth();
										},
										getHeight: function() {
											return boxRenderComp.getHeight();
										}
									}));

		this.registerComponent( new components.EnemyAIComponent());

		this.registerComponent( new components.CircleCollider({
			isTrigger: true,
			getRadius: function(){ return 30; },
			onTriggerEnter: function(entity) {
				DES_GAME.encounterManager.failEncounter();
			},
			shouldTriggerOn: function(entity) {return entity.type === "player";},
			showDebug: true
		}));

	};
	enemy.prototype = new SE.Entity();
		
	namespace['Enemy'] = enemy;
})();