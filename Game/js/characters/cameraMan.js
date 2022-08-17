;


(function() {
	var namespace = DES_GAME.namespace('DES_GAME.Characters'),
		components = SE.namespace('SE.Components'),
		cameraMan;

	cameraMan = function(scene, layer, startPos) {
		SE.Entity.call(this, scene, layer);
		this.type = 'cameraMan';

		var self = this;

		var transformComp = new components.Transform({ startPos: startPos,
													 scale: {x:0.5, y:0.5} });
		this.registerComponent( transformComp );

		var boxRenderComp = new components.BoxRender({fillColor: 'black'});
		this.registerComponent(boxRenderComp);

		this.camera = new SE.Camera();
		this.camera.registerScene( scene );
		var updateSceneHandler = function() {

		}
		this.registerComponent( new components.Camera( this.camera, updateSceneHandler ) );
	};
	cameraMan.prototype = new SE.Entity();
		
	namespace['CameraMan'] = cameraMan;
})();