
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
	 * Handles the NEAT evolution for CPPN.Networks
	 **/
	var NEAT = function(options) {

		this.options = $.extend({}, this.defaultOptions, options);

		// An array of {network, fitness}
		this.population = null;
		this.buildInitialPopulation();

		this.generationMutationSplitCache = [];
		this.generationMutationConnectionCache = [];
	};
	NEAT.prototype = {
		
		/**
		 * Defaults from Stanley's 2002 paper on NEAT
		 **/
		defaultOptions: {
			populationSize: 250,
			
			speciation_c1: 1.0,
			speciation_c2: 1.0,
			speciation_c3: 0.4,
			speciation_c4: 0.4,

			// Smaller number --> More species
			speciation_deltaT: 3.0,
			
			generationStagnantLimit: 15,

			mutationRate_weights: 0.8,

			// Random change otherwise
			mutationRate_weights_perturbed: 0.9,
			mutationRate_weights_perturbed_range: {'min':-0.2, 'max':0.2},
			mutationRate_split: 0.03,
			mutationRate_link: 0.05,

			numInputs: 2,
			numOutputs: 3,

			/// @return a rational
			fitness: function(network) {
				var len = network.numInputs,
					inputs=[], output, fitness=0;
				while (len--)
					inputs.push(0.5);
				output = network.run(inputs);
				len = output.length;
				while (len--)
					fitness+=output[len];
				fitness/=output.length;

				// The fitness tries to get networks to generate the largest
				// absolute numbers they can
				return Math.abs(fitness);
			}
		},

		createNewPopulation: function() {
			var opts = this.options;
			return new CPPN.Population(this.options.fitness,
									   opts.speciation_c1,
									   opts.speciation_c2,
									   opts.speciation_c3,
									   opts.speciation_c4,
									   opts.speciation_deltaT);
		},

		buildInitialPopulation: function() {
			// TODO: Something better?
			// Like take into account repeated stuffs.
			this.population = this.createNewPopulation();
			var i = this.options.populationSize;
			while(i--)
				this.population.addIndividual( this.createIndividual() );
			this.population.run();
			this.population.sort();
		},

		/**
		 * Runs and calculates the next generation
		 **/
		nextGeneration: function() {

			this.generationMutationSplitCache = [];
			this.generationMutationConnectionCache = [];

			// Gets the base population which contains the best species
			// from the last generation and a representative from each of the
			// previous species with more than 15 individuals
			var newPopulation = this.population.copyStubPopulation();
			var spotsLeft = this.options.populationSize;
			spotsLeft-= newPopulation.getTotalPopulation();

			var bestSpecies = this.population.getBestSpecies();
			var totalAvgFitness = this.population.getTotalAvgFitness();
			if (bestSpecies)
				totalAvgFitness-= bestSpecies.avgFitness;

			// Add the rest of the individuals
			var species = this.population.species;
			var sIndex= species.length, iIndex,
				aSpecies, numIndividuals, individuals;
			while (sIndex--) {
				aSpecies = species[sIndex];
				if (aSpecies === bestSpecies)
					continue;

				numIndividuals = Math.floor(aSpecies.avgFitness/totalAvgFitness*spotsLeft);
				individuals = this.createIndividualsFromSpecies(aSpecies, numIndividuals);
				iIndex = individuals.length;
				while (iIndex--) {
					newPopulation.addIndividual(individuals[iIndex]);
				}
			}

			// if there are any spots left over (due to rounding)
			// add a few new individuals to the population
			spotsLeft = this.options.populationSize - newPopulation.getTotalPopulation();
			while (spotsLeft--)
				newPopulation.addIndividual(this.createIndividual());
			
			newPopulation.run();
			this.population.sort();
			this.population = newPopulation;
		},

		/**
		 * Creates an individual {fitness, network} with the given network
		 * @param network (optional) Creates a new network if none given.
		 **/
		baseNetwork: false,
		baseNetworkCache: [],
		createIndividual: function(network) {

			// Start all the networks from the same base so the input/output nodes
			// match correctly
			if (typeof network === 'undefined') {
				if (!this.baseNetwork)
					this.baseNetwork = new CPPN.Network(this.options.numInputs,
														this.options.numOutputs);
				network = this.baseNetwork.copy();

				// Randomize the output activation indexes
				var types = CPPN.Node.Type,
					i = network.nodes.length,
					node, conn, actFtn, cache;
				while (i--) {
					node = network.nodes[i];
					if (node.type !== types.Output)
						continue;

					actFtn = node.randomActivationFunctionIndex();
					node.activationFunctionIndex = actFtn;

					cache = this.baseNetworkCache[actFtn];
					if (cache)
						node.id = cache;
					else {
						// if it hasn't happened yet, assign a new id since
						// the node is different
						node.id = node.getNextId();
						this.baseNetworkCache[actFtn] = node.id;
					}
				}

				// Randomize the connection weights
				i = network.connections.length;
				while (i--) {
					conn = network.connections[i];
					conn.weight = conn.randomWeight();
				}
			}
			
			return { fitness: false,
					 network:  network};
		},

		/**
		 * Creates the desired number of individuals from the species.
		 * Two parents are selected and then crossed. The child is then mutated
		 * based on the NEAT parameters
		 * @return An array of Individuals
		 **/
		createIndividualsFromSpecies: function(species, numberOfIndividuals) {

			if (numberOfIndividuals < 0) {
				log('numberOfIndividuals negative')
				return [];
			}

			var options = this.options,
				randomChance = CPPN.Utils.randomChance,
				newIndividuals = [],
				len = species.length,
				numToRemove = Math.round(0.1*len),
				child, mutationInfo;

			// remove at most the worst %10 of the species
			// TODO: In rare cases when the fitness of the entire population does not improve for more than 20 generations,
			//		 only the top two species are allowed to reproduce, refocusing the search into the most promising spaces
			this.removeLowestSpecies(species, numToRemove);

			while (numberOfIndividuals--) {

				child = this.crossTwoIndividualsInSpecies(species);

				// Check to see if the new child should mutate

				// Weight Mutation
				if (randomChance() <= options.mutationRate_weights) {
					log("Weight Mutation");
					child.network.mutateAllConnectionWeights(options.mutationRate_weights_perturbed,
															 options.mutationRate_weights_perturbed_range)
				}

				// Connection Split mutation
				if (randomChance() <= options.mutationRate_split) {
					log("Split Mutation");
					mutationInfo = child.network.splitRandomConnection();
					this.updateMutationSplitFromCache(mutationInfo);
				}
				
				// New Connection mutation
				if (randomChance() <= options.mutationRate_link) {
					log("Connection Mutation");
					mutationInfo = child.network.addRandomConnection();
					this.updateMutationConnectionFromCache(mutationInfo);				
				}


				newIndividuals.push(child);
			}

			return newIndividuals;
		},

		/**
		 * This makes sure that the same mutation hasn't happened already in
		 * this generation. If it has, just reassign the innovation/id numbers.
		 * @param splitInfo { old: connection,
		 *						 firstConnection: firstConnection
		 *						 newNode: newNode,
		 *						 secondConnection: secondConnection }
		 **/
		updateMutationSplitFromCache: function(splitInfo) {
			
			var cache = this.generationMutationSplitCache,
				i = cache.length, cachedInfo, found = false;
			while (i-- && !found) {
				cachedInfo = cache[i];
				if (splitInfo.old.innovationNumber === cachedInfo.old.innovationNumber)
				{
					splitInfo.firstConnection.innovationNumber = cachedInfo.firstConnection.innovationNumber;
					splitInfo.secondConnection.innovationNumber = cachedInfo.secondConnection.innovationNumber;
					
					// check the split node
					if (splitInfo.newNode.activationFunctionIndex === cachedInfo.newNode.activationFunctionIndex)
						splitInfo.newNode.id = cachedInfo.newNode.id;

					found = true;
				}
			}

			if (!found)
				cache.push(splitInfo);
		},

		/**
		 * This makes sure that the same mutation hasn't happened already in
		 * this generation. If it has, just reassign the innovation number.
		 * @param connection CPPN.Connection
		 **/
		updateMutationConnectionFromCache: function(connection) {
			if (!connection)
				return;

			var cache = this.generationMutationConnectionCache,
				i = cache.len, cachedConn, found = false;
			while (i-- && !found) {
				cachedConn = cache[i];
				if (connection.inNode.id === cachedConn.inNode.id
					&& connection.outNode.id === cachedConn.outNode.id)
				{
					connection.innovationNumber = cachedConn.innovationNumber;
					found = true;
				}
			}

			if (!found)
				cache.push(connection);
		},

		/**
		 * @note A species' individuals should already be sorted with the least
		 * 		fit ones at the end
		 **/
		removeLowestSpecies: function(species, numberToRemove) {
			if (numberToRemove <= 0)
				return;

			var individuals = species.individuals;
			while (numberToRemove--)
				individuals.pop();
		},

		crossTwoIndividualsInSpecies: function(species) {
			var p1 = this.selectIndividualInSpecies(species),
				p2 = this.selectIndividualInSpecies(species);
			return this.createIndividual(CPPN.crossover(p1.network, p1.fitness,
														p2.network, p2.fitness));
		},

		/**
		 * Uses proportional selection
		 **/
		selectIndividualInSpecies: function(species) {
			var individuals = species.individuals,
				totalFitness = this.totalFitnessForSpecies(species),
				randomFitness = CPPN.Utils.randomIn(0, totalFitness),
				fitnessCount = 0,
				len = individuals.length,
				i, individual;
			for (i=0; i<len; ++i) {
				individual = individuals[i];
				fitnessCount+=individual.fitness;
				if (fitnessCount <= randomFitness)
					return individual;
			}

			// None selected, so just return the last one
			return individuals[len-1];
		},

		totalFitnessForSpecies: function(species) {
			var individuals = species.individuals,
				fitness = 0,
				i = individuals.length;
			while (i--)
				fitness+=individuals[i].fitness;
			return fitness;
		}

	};

	/**
	 * Provided fitness function for testing network diversity
	 **/
	NEAT.diversityFitness = function(network) {
		
		// Render out each output of the network into a canvas
		var canvases = CPPN.renderBWNetwork(network,WORLD_WIDTH,WORLD_HEIGHT),
			len = canvases.length, positions,
			fitness = 0, i, canvas, xDev, yDev;

		// Run quadtree selection on it and add up the pitness
		for (i=0; i<len; ++i) {
			canvas = canvases[i];
			positions = CPPN.quadtreeMultiSelection(canvas,
													VARIANCE_THRESHHOLD,
													PRUNING_THRESHOLD,
													CPPN.Utils.getRed);

			xDev = CPPN.Math.stdDev(positions, getPosX);
			yDev = CPPN.Math.stdDev(positions, getPosY);

			fitness+= positions.length * xDev * yDev; 
		}

		return fitness;
	}

	function getPosX(pos) { return pos.x; }
	function getPosY(pos) { return pos.y; }


	CPPN['NEAT'] = NEAT;

})();