
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/
var CPPN = CPPN || {};

(function() {

	/**
	 * CPPN.Node
	 * @param type a Node.Type
	 * @param activationIndex (optional)
	 **/
	CPPN.Node = function(type, activationIndex) {
		this.type = type;
		this.id = this.getNextId();
		this.deepId = this.getNextDeepId();

		if (typeof activationIndex === 'undefined')
			activationIndex = this.randomActivationFunctionIndex();
		this.activationFunctionIndex = activationIndex;

		this.cachedRunIndex = null;
		this.cachedRunValue = 0;
	};
	CPPN.Node.prototype = {

		/**
		 * Performs a deep copy of the node
		 **/
		copy: function() {
			var copy = new CPPN.Node(this.type, this.activationFunctionIndex);
			copy.id = this.id;
			return copy;
		},

		getNextId: function() {
			return CPPN.Node.nextId++;
		},
		getNextDeepId: function() {
			return CPPN.Node.nextDeepId++;
		},

		// List of possible activation functions
		// Modified from http://www.cs.ucf.edu/~hastings/index.php?content=ann
		'activationFunctions': [ 
			{'name':'sin', 'ftn':CPPN.Math.sin},
			{'name':'cos', 'ftn':CPPN.Math.cos},
			{'name':'tan', 'ftn':CPPN.Math.tan},
			{'name':'tanh', 'ftn':CPPN.Math.tanh},
			{'name':'bipolarSigmoid', 'ftn':CPPN.Math.bipolarSigmoid},
			{'name':'gaussian', 'ftn':CPPN.Math.gaussian},
			{'name':'ramp', 'ftn':CPPN.Math.ramp},
			{'name':'step', 'ftn':CPPN.Math.step},
			{'name':'spike', 'ftn':CPPN.Math.spike},
			//{'name':'line', 'ftn':CPPN.Math.line},
			{'name':'inverse', 'ftn':CPPN.Math.inverse} ],

		randomActivationFunctionIndex: function() {
			return Math.floor( Math.random()
							   * this.activationFunctions.length);
		},
		getActivationFunction: function() {
			return this.activationFunctions[this.activationFunctionIndex];
		},

		hasCachedValueForRun: function(index) {
			return index === this.cachedRunIndex;
		},

		inInputLayer: function() {
			return this.type === CPPN.Node.Type.Input
				|| this.type === CPPN.Node.Type.Bias;
		},

		inOutputLayer: function() {
			return this.type === CPNN.Node.Type.Output;
		},

		inHiddenLayer: function() {
			return this.type === CPNN.Node.Type.Hidden;
		},

		/**
		 * @param connections An array of CPPN.Connection
		 **/
		run: function(connections) {
			var sum = 0,
				ftn = this.getActivationFunction().ftn,
				i = connections.length,
				connection;

			while(i--)
			{
				connection = connections[i];
				sum+= connection.weight
					 *connection.inNode.cachedRunValue;
			}

			return ftn(sum);
		},

		toString: function() {
			var showFtn = this.type === CPPN.Node.Type.Hidden
						||this.type === CPPN.Node.Type.Output;
			return	"("
						+this.id+"("+this.deepId+"):"+CPPN.Node.typeToString(this.type)
						+(showFtn ? (':'+this.getActivationFunction().name) : '')
					+")";
		}
	};
	CPPN.Node.nextId = 0;
	// Id that isn't copied in  a deep copy
	CPPN.Node.nextDeepId = 0;

	CPPN.Node.Type =  {
		'Input':  0,
		'Bias':   1,
		'Output': 2,
		'Hidden': 3
	};

	CPPN.Node.typeToString = function(type) {
		for (var i in CPPN.Node.Type){
			if (CPPN.Node.Type[i] === type)
				return i;
		}
		return false;
	};

	/**
	 * A comparer for sorting. sorts by type, then id if the types are the same.
	 **/
	CPPN.Node.compare = function(a, b) {
		if (a.type === b.type)
			return a.id - b.id;
		return a.type-b.type;
	};

})();