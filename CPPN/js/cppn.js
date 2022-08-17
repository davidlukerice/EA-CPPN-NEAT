
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
	 * Generates a CPPN.Network with a number of random mutations
	 * @param numIn The number of input nodes
	 * @param numOut The number of output nodes
	 * @param width The width of the quadtree to use when rendering
	 * @param height
	 * @param numRuns The number of generation runs to do
	 * @param renderHandler A function(network) rendering out a canvas
	 * @param onStep Which steps to call the callback (ie. 2 calls it every two generations)
	 * @param stepCallback A function called with a rendered canvas on each 'step'
	 * @param finishCallback A function called after all the generations are run
	 * @return CPPN.Network (Note: It may be returned before all the generations are completed)
	 **/
	CPPN.generator = function(numIn, numOut, width, height, numRuns,
							  renderHandler, onStep, stepCallback, finishCallback)
	{
		var network = new CPPN.Network(numIn, numOut);
		CPPN.runNetwork(network, width, height, numRuns, renderHandler, onStep, stepCallback, finishCallback);
		return network;
	};

	/**
	 * Runs a CPPN with each generation having 1/3 chance to split,
	 * add a connection, or mutate all the connections
	 **/
	CPPN.runNetwork = function(network, width, height, numRuns, renderHandler,
							   onStep, stepCallback, finishCallback) {
		var canvas,
			runsLeft = numRuns,
			startTime = new Date().getTime() / 1000;
		
		log(network.toString());

		canvas = renderHandler(network, width, height);
		stepCallback(canvas);

		function generation() {

			var index = CPPN.Utils.randomIndexIn(0,2);
			if (index === 0)
				network.splitRandomConnection();
			else if (index === 1)
				network.addRandomConnection();
			else
				network.mutateAllConnectionWeights(0.2);

			// render every onStep generations
			--runsLeft;
			if (!(runsLeft%onStep))
			{
				log(network.toString());
				canvas = renderHandler(network, width, height);
				stepCallback(canvas);
			}

			if (runsLeft>0)
				setTimeout(generation, 0);
			else
			{
				log('RunTime: '+ ((new Date().getTime() / 1000) - startTime));
				if (typeof finishCallback === 'function')
					finishCallback();
			}	
		}

		setTimeout(generation, 0);
	};

	/**
	 * @return A black and white canvas for each output in the network
	 **/
	CPPN.renderBWNetwork = function(network, width, height) {
		var numOutputs = network.numOutputs,
			canvases = [], contexts = [], imageDatas=[],
			canvas, context, imageData, pixels,
			x, y, i, outI, output, outputLen;

		i = numOutputs;
		while (i--) {
			canvas = document.createElement('canvas');
			context = canvas.getContext('2d');
			canvases.push(canvas);
			contexts.push(context);

			canvas.width = width;
			canvas.height = height;
			imageDatas.push(context.createImageData(width, height));
		}

		for( x=0; x<width; ++x)
		for( y=0; y<height; ++y)
		{
			// (0,0) in top left corner
			// +x left, +y down
			i = (y*width+x)*4;
			output = CPPN.getOutput(network, width, height, x, y);
			outputLen = output.length;
			for ( outI=0 ; outI < outputLen; ++outI) {
				pixels = imageDatas[outI].data;
				pixels[i+0] = output[outI]; //red
				pixels[i+1] = output[outI]; //green
				pixels[i+2] = output[outI]; //blue
				pixels[i+3] = 255; //alpha
			}
		}

		i = numOutputs;
		while(i--) {
			contexts[i].putImageData(imageDatas[i], 0, 0);
		}

		return canvases;
	},

	/**
	 * Rendersa network with three outputs and puts each in a different color
	 * channel of the canvas.
	 **/
	CPPN.renderNetwork = function(network, width, height) {
		var canvas = document.createElement('canvas'),
			context = canvas.getContext('2d'),
			imageData, pixels,
			x, y, i, output;

		canvas.width = width;
		canvas.height = height;
		imageData = context.createImageData(width, height);
		pixels = imageData.data;

		for( x=0; x<width; ++x)
		for( y=0; y<height; ++y)
		{
			// (0,0) in top left corner
			// +x left, +y down
			i = (y*width+x)*4;
			output = CPPN.getOutput(network, width, height, x, y);

			pixels[i+0] = output[0]; //red
			pixels[i+1] = output[1]; //green
			pixels[i+2] = output[2]; //blue
			pixels[i+3] = 255; //alpha
		}
		context.putImageData(imageData, 0,0);
		return canvas;
	};

	/**
	 * World: [(0,0), (worldWidth,worldHeight)] with (0,0) top left
	 **/
	CPPN.getOutput = function(network, worldWidth, worldHeight, worldX, worldY) {
		// convert world to [(-1,-1),(1,1)] with (0,0) in center
		var adjustedX =   worldX/worldWidth*2 - 1,
			adjustedY = -(worldY/worldHeight*2 - 1),
			result;

		// Result in [-1,1]
		result = network.run([adjustedX, adjustedY]);
		
		CPPN.Utils.scaleArray(result);
		//CPPN.Utils.absScaleArray(result);

		return result;
	};

	/** 
	 * @return A CPPN.Network if the two parents are compatable, false if not
	 **/
	CPPN.crossover = function(p1, p1Fitness, p2, p2Fitness) {
		
		var p1MoreFit = p1Fitness > p2Fitness,
			p2MoreFit = p2Fitness > p1Fitness,
			p1Nodes = p1.nodes,
			p2Nodes = p2.nodes,
			p1Connections = p1.connections,
			p2Connections = p2.connections,
			childNodes = [],
			childConnections = [];

		var p1Itr = 0, p1len = p1Connections.length,
			p2Itr = 0, p2len = p2Connections.length,
			p1Conn, p2Conn;

		// iterate over eac of the connections and see which ones match
		while (p1Itr < p1len && p2Itr < p2len) {

			p1Conn = p1Connections[p1Itr];
			p2Conn = p2Connections[p2Itr];

			// Same connection
			if (p1Conn.innovationNumber === p2Conn.innovationNumber) {

				if (p1MoreFit || CPPN.Utils.randomBool())
					addConnection(childNodes, childConnections, p1Conn);
				else
					addConnection(childNodes, childConnections, p2Conn);

				++p1Itr;
				++p2Itr;
			}
			// Different connection with P2's being made first
			else if (p1Conn.innovationNumber > p2Conn.innovationNumber) {
				if (p2MoreFit && !p1MoreFit) {
					addConnection(childNodes, childConnections, p2Conn);
				}
				// The same fitness, so 50/50 chance of adding
				else if (!p2MoreFit && !p1MoreFit) {
					if (CPPN.Utils.randomBool())
						addConnection(childNodes, childConnections, p2Conn);
				}
				++p2Itr;
			}
			// Different connection with P1's being made first
			else if (p1Conn.innovationNumber < p2Conn.innovationNumber) {
				if (p1MoreFit && !p2MoreFit) {
					addConnection(childNodes, childConnections, p1Conn);
				}
				// The same fitness, so 50/50 chance of adding
				else if (!p2MoreFit && !p1MoreFit) {
					if (CPPN.Utils.randomBool())
						addConnection(childNodes, childConnections, p1Conn);
				}
				++p1Itr
			}
		}

		// Return if no connections are the same --> Can't cross
		if (childConnections.length === 0) 
			return false;

		// Run out any extra nodes
		while(p1Itr < p1len) {
			if (p1MoreFit || (!p1MoreFit && !p2MoreFit
							  && CPPN.Utils.randomBool())) {
				addConnection(childNodes,
							  childConnections,
							  p1Connections[p1Itr]);
			}
			++p1Itr;
		}
		while (p2Itr < p2len) {
			if (p2MoreFit || (!p1MoreFit && !p2MoreFit
							  && CPPN.Utils.randomBool())) {
				addConnection(childNodes,
							  childConnections,
							  p2Connections[p2Itr]);
			}
			++p2Itr;
		}

		sortNodes(childNodes);

		return new CPPN.Network(p1.numInputs,
								p1.numOutputs,
								childNodes,
								childConnections);
	};

	/**
	 * @param nodes
	 * @param connections
	 * @param connection A non copy connection
	 **/
	function addConnection(nodes, connections, connection) {
		var inNode = connection.inNode,
			outNode = connection.outNode,
			copyInNode, copyOutNode;
		
		copyInNode = findNodeInList(nodes, inNode);
		if (!copyInNode)
		{
			copyInNode = inNode.copy();
			nodes.push(copyInNode);
		}

		copyOutNode = findNodeInList(nodes, outNode);
		if (!copyOutNode) {
			copyOutNode = outNode.copy();
			nodes.push(copyOutNode);
		}
		
		connections.push(connection.copy(copyInNode, copyOutNode));
	}

	function findNodeInList(nodes, node) {
		var i = nodes.length;
		while(i--) if (nodes[i].id === node.id)
			return nodes[i];

		return false;
	}

	function sortNodes(nodes) {
		nodes.sort(CPPN.Node.compare);
	} // eo sortNodes


})();