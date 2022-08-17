
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/
var CPPN = CPPN || {};

(function() {

	var log = CPPN.Utils.log,
		nodeTypes = CPPN.Node.Type;

	/**
	 * CPPN.Network
	 * A Compositional pattern-producing network constructor
	 * @note Only allows for Feed Forward connections (no recurrence)
	 * @param numInputs
	 * @param numOutputs
	 * @param nodes (optional)
	 * @param connections (optional)
	 **/
	CPPN.Network = function(numInputs, numOutputs, nodes, connections) {
		
		this.numInputs = numInputs;
		this.numOutputs = numOutputs;

		// Nodes are built in the following order
		// Inputs, Bias, Output, Hidden
		this.nodes = nodes || [];
		this.connections = connections || [];

		// Cache the starting indexes of the different
		// types of nodes
		this.inputIndex = 0;
		this.biasIndex = numInputs;
		this.outputIndex = this.biasIndex+1;
		this.hiddenIndex = this.outputIndex+numOutputs;

		if (!nodes) {
			this.addInputNodes(numInputs);
			this.addBiasNode();
			this.addOutputNodes(numOutputs);
		}

		this.topologyChangeCount = 0;

		if (!connections) {
			// Include the bias node as an input
			this.addInitialConnections(numInputs+1, numOutputs);
		}

		// Caching information
		this.lastConnectionChangeCount = 0;
		this.cachedConnections = {};
	};
	CPPN.Network.prototype = {

		/**
		 * @return A deep copy of this CPPN.Network
		 **/
		copy: function() {
			var copy = new CPPN.Network(this.numInputs,
										this.numOutputs);
			
			// Copy the Nodes
			var copyNodes = [],
				len = this.nodes.length,
				i;
			for (i=0; i < len; ++i)
				copyNodes.push(this.nodes[i].copy())
			copy.nodes = copyNodes;

			var copyConnections = [],
				conn;
			len = this.connections.length;
			for (i=0; i < len; ++i) {

				conn = this.connections[i];
				// find both the in and outNodes for the connection
				var inNode = null,
					outNode = null,
					nodeI = copy.nodes.length,
					node;
				while (nodeI-- && !(inNode && outNode)) {
					node = copyNodes[nodeI];
					if (node.id === conn.inNode.id)
						inNode = node;
					else if (node.id === conn.outNode.id)
						outNode = node;
				}

				copyConnections.push(conn.copy(inNode, outNode));
			}
			copy.connections = copyConnections;
			copy.topologyChangeCount = this.topologyChangeCount;

			return copy;
		},

		/**************************
		 *		Initialization
		 **************************/

		addInputNodes: function(numInputs) {
			var nodes = this.nodes,
				inputType = nodeTypes.Input;

			while(numInputs--)
				nodes.push(new CPPN.Node(inputType));
		},

		addBiasNode: function() {
			var nodes = this.nodes,
				biasType = nodeTypes.Bias;

				nodes.push(new CPPN.Node(biasType));
		},

		addOutputNodes: function(numOutputs) {
			var nodes = this.nodes,
				outputType = nodeTypes.Output;

			while(numOutputs--)
				nodes.push(new CPPN.Node(outputType));
		},

		/**
		 * Add a single connection between all the input/bias nodes
		 * and the outPut nodes.
		 * @param numInputs Number of input nodes in the network (includes the
		 * 					single bias node)
		 * @param numOutputs
		 **/
		addInitialConnections: function(numInputs, numOutputs) {
			var nodes = this.nodes,
				connections = this.connections,
				inI,
				outI,
				inNode,
				outNode;

			for (inI = 0; inI < numInputs; ++inI)
			{	
				inNode = nodes[inI];
				for (outI = 0; outI< numOutputs;++outI)
				{
					outNode = nodes[numInputs+outI];
					connections.push(new CPPN.Connection(inNode, outNode));
				}
			}
		},


		/**************************
		 *		Topology Mutators
		 **************************/

		/**
		 * @return Information of what got split and into what
		 **/
		splitRandomConnection: function() {
			var numConnections = this.connections.length,
				splitIndex = CPPN.Utils.randomIndexIn(0, numConnections),
				connection = this.connections[splitIndex];
			// Randomly pick connections until one is found 
			// that is enabled
			while (!connection.enabled)
			{
				splitIndex = CPPN.Utils.randomIndexIn(0, numConnections),
				connection = this.connections[splitIndex];
			}
			
			return this.splitConnection(connection);
		},

		splitConnection: function(connection) {
			var hiddenType = nodeTypes.Hidden,
				oldWeight = connection.weight,
				newNode, firstConnection, secondConnection;

			log('splitting: ' + connection.toString());

			connection.enabled = false;

			newNode = new CPPN.Node(hiddenType);
			firstConnection = new CPPN.Connection(connection.inNode,
												  newNode,
												  1);
			secondConnection = new CPPN.Connection(newNode,
												   connection.outNode,
												   oldWeight);
			this.nodes.push(newNode);
			this.connections.push(firstConnection);
			this.connections.push(secondConnection);
			++this.topologyChangeCount;
			return {
				old: connection,
				firstConnection: firstConnection,
				newNode: newNode,
				secondConnection: secondConnection 
			}
		},

		addRandomConnection: function() {
			var possibleConnections = this.allPossibleConnections(),
				connectionAdded = false,
				connection;
			possibleConnections = CPPN.Utils.shuffle(possibleConnections);

			while(possibleConnections.length
				  && !connectionAdded)
			{
				connection = possibleConnections.pop();
				connectionAdded = this.addConnection(connection);
			}

			if (!connectionAdded)
				log('No Possible Connection');
			return connectionAdded;
		},

		/**
		 * @return true if connection added, false if not
		 **/
		addConnection: function(connection) {
			var notValid = !this.connectionValidFor(connection.inNode,
													connection.outNode),
				createsLoop = this.pathExistsFromNodeToNode(connection.outNode,
															connection.inNode);
			if (notValid || createsLoop)
			{
				log('BadConn:'+connection+' valid:'+notValid+' loop:'+createsLoop);
				return false;
			}

			this.connections.push(connection);
			log("Connection Added: "+connection);
			++this.topologyChangeCount;
			return true;
		},

		/**
		 * @note Slow O(Nodes^2 + Connections)
		 **/
		allPossibleConnections: function() {
			var nodes = this.nodes,
				nodesLen = nodes.length,
				possibleConnections = [],
				inI,
				outI,
				inNode,
				outNode;

			for (inI=0; inI < nodesLen; ++inI)
			for (outI=0; outI < nodesLen; ++outI)
			{
				inNode = nodes[inI];
				outNode = nodes[outI];
				if (this.connectionValidFor(inNode, outNode))
					possibleConnections.push(new CPPN.Connection(
							inNode,
							outNode));
			}

			return possibleConnections;
		},

		/**
		 * @note Doesn't check for reccurence
		 **/
		connectionValidFor: function(inNode, outNode) {

			if (inNode.id === outNode.id)
				return false;
			if (outNode.inInputLayer())
				return false;
			if (this.connectionExists(inNode, outNode))
				return false;

			return true;
		},

		connectionExists: function(inNode, outNode) {
			var connections = this.connections,
				i = connections.length,
				connection;
			while(i--)
			{
				connection = connections[i];
				if (connection.inNode.id === inNode.id
					&& connection.outNode.id === outNode.id)
				{
					return true;
				}
			}
			return false;
		},

		/**
		 * Searches back from the endNode to see if there's a connection
		 * that links from the startNode to it
		 **/
		pathExistsFromNodeToNode: function(startNode, endNode) {
			
			var stack = this.enabledConnectionsWithOutput(endNode),
				startId = startNode.id,
				connection,
				currentInNode,
				newConnections;

			while (stack.length)
			{	
				// Peek the stack
				connection = stack.pop();
				currentInNode = connection.inNode;

				if (currentInNode.id === startId)
					return true;

				if (!currentInNode.inInputLayer())
				{
					newConnections = this.enabledConnectionsWithOutput(currentInNode);
					stack = stack.concat(newConnections);
				}
			}

			return false;
		},

		/**************************
		 *		Weight Mutators
		 **************************/

		/**
		 * Goes through each weight in the network and 
		 * @param perturbedChance (optional) Chance of a weight just being
		 * 			perturbed, otherwise, a new random new weight is assigned.
		 * 			Default: 1.0
		 * @param perturbedRange {min, max} Default: [-0.2, to 0.2]
		 **/
		mutateAllConnectionWeights: function(perturbedChance, perturbedRange) {
			if (typeof perturbedChance === 'undefined')
				perturbedChance = 1.0;
			if (typeof perturbedRange === 'undefined')
				perturbedRange = {min:-0.2,max:0.2};

			var connections = this.connections,
				i = connections.length;
			while(i--)
				this.mutateConnectionWeight(connections[i],
											perturbedChance,
											perturbedRange);
		},

		/**
		 * Mutates the connection weight by adding [-0.2,0.2] to the weight if 
		 * perturbed, setting it to [-1,1] if not
		 * @param connection
		 * @param perturbedChance Chance of a weight just being perturbed,
		 * 			otherwise, a new random new weight is assigned.
		 **/
		mutateConnectionWeight: function(connection, perturbedChance, perturbRange) {
			var randomChance = CPPN.Utils.randomChance,
				randomIn = CPPN.Utils.randomIn,
				newWeight;
			
			// Perterb
			if (randomChance() <= perturbedChance) {
				newWeight = randomIn(perturbRange.min,
									 perturbRange.max);
				connection.weight+= newWeight;
				log('WeightChange(P:'+newWeight+'): '+connection);
			}
			// Assign new random weight
			else {
				newWeight = randomIn(-1,1);
				connection.weight = newWeight;
				log('WeightChange(C:'+newWeight+'): '+connection);
			}
		},


		/**************************
		 *		Running Functions
		 **************************/

		/**
		 * Runs the set of inputs through the network
		 **/
		run: function(inputs) {
			
			// Assumes the first inputs.length nodes are 
			var hiddenIndex = this.hiddenIndex,
				runIndex = this.getNextIndex(),
				outIndex = this.outputIndex,
				nodes = this.nodes,
				nodesLen = nodes.length,
				outPut = [],
				outNode,
				stack,
				connections,
				connectionI,
				allConnectionsCached,
				currentOutNode,
				inNode;

			this.updateInputLayer(inputs, runIndex);

			// For Each output Node
			for (outNode = nodes[outIndex];
				 outIndex < nodesLen && outIndex < hiddenIndex;
				 outNode = nodes[++outIndex])
			{
				stack = [outNode];

				// Run the output units
				while (stack.length)
				{
					currentOutNode = stack[stack.length-1];
					allConnectionsCached = true;
					connections = this.enabledConnectionsWithOutput(currentOutNode);
					connectionI = connections.length;
					while(connectionI--)
					{	
						inNode = connections[connectionI].inNode;
						if (!inNode.inInputLayer()
							&& !inNode.hasCachedValueForRun(runIndex))
						{
							allConnectionsCached = false;
							stack.push(inNode);
						}
					}
					
					// If all the values have been determined
					// run the node with the connections and cache
					// the results
					if (allConnectionsCached)
					{
						stack.pop();
						var result = currentOutNode.run(connections);
						currentOutNode.cachedRunValue = result;
						currentOutNode.cachedRunIndex = runIndex;
					}
				}

				outPut.push(outNode.cachedRunValue);
			}
			
			if (outPut.length !== this.numOutputs)
				CPPN.Utils.error('Output length does not match numOutputs!');

			return outPut;
		},

		updateInputLayer: function(inputs, runIndex) {
			// Assumes the first inputs.length nodes are 
			var nodes = this.nodes,
				inputsLength = inputs.length,
				i = this.inputIndex,
				node;

			// 1. Update the input units
			for (i; i < inputsLength; ++i)
			{
				node = nodes[i];
				node.cachedRunIndex = runIndex;
				node.cachedRunValue = inputs[i];
			}

			// 2. Update the Bias
			node = nodes[this.biasIndex];
			node.cachedRunIndex = runIndex;
			node.cachedRunValue = -1;
		},

		/**
		 * @return A shallow copy of array
		 **/
		enabledConnectionsWithOutput: function(node) {
			// check cache
			
			if (this.topologyChangeCount !== this.lastConnectionChangeCount)
			{
				this.lastConnectionChangeCount = this.topologyChangeCount;
				this.cachedConnections = {};
			}
			else {
				var con = this.cachedConnections[node.id];
				if(typeof con !== 'undefined')
					return con.slice(0);
			}

			var connections = this.connections,
				connectionsToNode = [],
				nodeId = node.id,
				i = connections.length,
				connection;

			while(i--) {
				connection = connections[i];
				if ( connection.enabled && connection.outNode.id === nodeId)
					connectionsToNode.push(connection);
			}
			this.cachedConnections[nodeId] = connectionsToNode;
			return connectionsToNode.slice(0);
		},

		/**
		 * Gets a unique index for the current run
		 **/
		nextRunIndex:0,
		getNextIndex: function() {
			return ++this.nextRunIndex;
		},


		/**************************
		 *		Utilities
		 **************************/

		toString: function() {
			var str = "CPPN Network:\n",
				nodes = this.nodes,
				connections = this.connections,
				numNodes = nodes.length,
				numConnections = connections.length,
				i;

			// Add Nodes
			str+=' Nodes: \n';
			for (i=0; i<numNodes; ++i)
				str+= nodes[i].toString()+', \n';

			// Add Connections
			str+='\n Connections: \n';
			for (i=0; i<numConnections; ++i)
				str+= connections[i].toString()+", \n";

			return str;
		}

	}; // eo Network

})();