;


(function() {
	var namespace = DES_GAME.namespace('DES_GAME.Managers'),
		interfaceManager;

	var interfaceManager = function() {

	};
	interfaceManager.prototype = {
		createButton: function(inner, id, classes, clickHandler) {
			var button = $('<div id="'+id+'" class="button '+classes+'">'+inner+'</div>');
			var self = this;

			// Add audio stuff
			$(button).hover(function(e) {
				
			}, function(e) {
				
			});

			$(button).click(function(e) {
				
			});

			return button;
		}

	};

	namespace['InterfaceManager'] = interfaceManager;
})();
