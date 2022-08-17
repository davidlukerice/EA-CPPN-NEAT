;

/**
 * A component that see's if the component is collceted or not
 **/
(function() {
	var namespace = SE.namespace('SE.Components'),
		collectableComponent;

	collectableComponent = function() {
		namespace.Component.call(this);
		this.type = "Collectable";

		this.renderComponent = null;
		this.isCollected = false;
	};

	collectableComponent.prototype = new namespace.Component();

	/**
	 * @override from Component
	 **/
	collectableComponent.prototype.init = function() {
		this.renderComponent = this.entity.getComponentOfType("render");
		if ( this.renderComponent === false )
			SE.error("CollectableComponent requires a Render Component");
	};

	/**
	 * @override from Component
	 **/
	collectableComponent.prototype.start = function() {

	};

	/**
	 * @override from Component
	 **/
	collectableComponent.prototype.stop = function() {

	};

	/**
	 * @override from Component
	 * @param deltaTime The change in time (milliseconds) since the last
	 *					update was called.
	 **/
	collectableComponent.prototype.update = function(deltaTime) {

	};

	collectableComponent.prototype.collected = function() {
		this.isCollected = true;
		this.renderComponent.stop();
	};


	namespace['Collectable'] = collectableComponent;
})();
