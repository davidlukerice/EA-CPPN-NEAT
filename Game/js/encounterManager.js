;

(function() {
	var namespace = DES_GAME.namespace('DES_GAME.Managers'),
		encounterManager;

	var encounterManager = function() {
		this.keys = [];
	};
	encounterManager.prototype = {

		registerKey: function(key) {
			var collectable = key.getComponentOfType('Collectable');
			this.keys.push(collectable);
		},

		allKeysCollected: function() {
			var i = this.keys.length;
			while(i--) if (!this.keys[i].isCollected)
				return false;
			return true;
		},

		failEncounter: function() {
			SE.log('Failed!');
			//DES_GAME.SE.pause();
		},

		winEncounter: function() {
			SE.log('Win!');
			DES_GAME.SE.pause();
		}
	};

	namespace['EncounterManager'] = encounterManager;
})();
