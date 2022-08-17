;


(function() {
	var namespace = DES_GAME.namespace('DES_GAME.Characters'),
		components = SE.namespace('SE.Components'),
		player;

	player = function(scene, layer, startPos) {
		SE.Entity.call(this, scene, layer);
		this.type = 'player';

		var self = this;

		var transformComp = new components.Transform({ startPos: startPos,
													   scale: {x:2.0, y:2.0} });
		this.registerComponent( transformComp );
		var movementComp = new components.Movement({ targetPos: {x:startPos.x, y:startPos.y} });
		this.registerComponent( movementComp );

		var boxRenderComp = new components.BoxRender({
			fillColor: 'green'
		});
		this.registerComponent(boxRenderComp);

		this.registerComponent( new components.BoxCollider({
										getWidth: function() {
											return boxRenderComp.getWidth();
										},
										getHeight: function() {
											return boxRenderComp.getHeight();
										}
									}));

		this.registerComponent( 
			new components.PlayerAIComponent(components.PlayerAIComponent.Skill.Experienced)
		);

		this.registerComponent( new components.CircleCollider({
			isTrigger: true,
			getRadius: function(){ return 30; },
			onTriggerEnter: function(entity) {
				var collectable = entity.getComponentOfType("Collectable");
				collectable.collected();
			},
			shouldTriggerOn: function(entity) {return entity.type === "key";},
			showDebug: true
		}));

	};
	player.prototype = new SE.Entity();
		
	namespace['Player'] = player;
})();