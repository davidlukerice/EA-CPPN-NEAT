
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/
var CPPN = CPPN || {};

(function() {

	/**
	 * CPPN.Connection
	 * @param inNode A CPPN.Node
	 * @param outNode A CPPN.Node
	 * @param weight (optional) A Number in [-1,1]
	 **/
	CPPN.Connection = function(inNode, outNode, weight) {
		
		// the CPPN.Node that starts the connection
		this.inNode = inNode;
		// The CPPN.Node that the connection outputs to
		this.outNode = outNode;
		// A number that differentiates each connection
		this.innovationNumber = this.getNextInnovationNumber();
		// A number not copied during copy
		this.deepInnovationNumber = this.getNextDeepInnovationNumber();

		// The weight of the connection. Random if not provided
		if (typeof weight === 'undefined')
			weight = this.randomWeight();
		this.weight = weight;

		// Whether the connection is enabled or not
		this.enabled = true;
	};
	CPPN.Connection.prototype = {

		getNextInnovationNumber: function() {
			return CPPN.Connection.nextInnovationNumber++;
		},
		getNextDeepInnovationNumber: function() {
			return CPPN.Connection.nextDeepInnovationNumber++;
		},

		randomWeight: function() {
			return CPPN.Utils.randomIn(-1,1);
		},

		/**
		 * Performs a deep copy of the connection and duplicates the in/out nodes
		 * if none were provided
		 * @param inNode (optional)
		 * @param outNode (optional)
		 * @return a CPPN.Connection
		 **/
		copy: function(inNode, outNode) {
			var inNode = inNode || this.inNode.copy();
			var outNode = outNode || this.outNode.copy();
			var copy = new CPPN.Connection(inNode, outNode, this.weight);
			copy.innovationNumber = this.innovationNumber;
			copy.enabled = this.enabled;
			return copy;
		},

		toString: function() {
			return '{('+this.innovationNumber+':'+this.deepInnovationNumber+') '
						+ (this.enabled ? 'E' : 'D')
						+' '
						+ this.inNode.id+"("+this.inNode.deepId+")"
						+ '-->'
						+ this.outNode.id+"("+this.outNode.deepId+")"
						+ ':'
						+ this.weight
					+ "}";
		}
	};

	// Static stores for the innovation numbers so they are not duplicated
	// in the population
	CPPN.Connection.nextInnovationNumber = 0;
	CPPN.Connection.nextDeepInnovationNumber = 0;
})();