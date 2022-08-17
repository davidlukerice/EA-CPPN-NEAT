;


(function() {
	var namespace = DES_GAME.namespace('DES_GAME.Characters'),
		components = SE.namespace('SE.Components'),
		key;

	key = function(scene, layer, startPos) {
		SE.Entity.call(this, scene, layer);
		this.type = 'key';

		var self = this,
			encounterManager = DES_GAME.encounterManager,
			transformComp,
			boxRenderComp,
			collectableComp;

		transformComp = new components.Transform({ startPos: startPos,
												   scale: {x:1.0, y:1.0} });
		this.registerComponent( transformComp );

		boxRenderComp = new components.BoxRender({fillColor: 'yellow'});
		this.registerComponent(boxRenderComp);

		this.registerComponent( new components.BoxCollider({
										getWidth: function() {
											return boxRenderComp.getWidth();
										},
										getHeight: function() {
											return boxRenderComp.getHeight();
										},
										showDebug: true
									}));

		collectableComp = new components.Collectable();
		this.registerComponent(collectableComp);

		encounterManager.registerKey(this);
	};
	key.prototype = new SE.Entity();
		
	namespace['Key'] = key;
})();