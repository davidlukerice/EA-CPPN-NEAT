
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
	 * A set of individuals broken up into species
	 * @param fitness A function that maps a CPPN.Network to a rational
	 * @param c1 The excess multiplier
	 * @param c2 The Disjoint multiplier
	 * @param c3 The Weight Difference multiplier
	 * @param c4 The Diff Activation function multiplier
	 * @param dT How different a distance must be before a new species is created
	 **/
	var Population = function(fitness, c1, c2, c3, c4, dT) {

		this.fitness = fitness;

		this.c1 = c1;
		this.c2 = c2;
		this.c3 = c3;
		this.c4 = c3;
		this.dT = dT;

		this.species = [];

		this.usedNodes = {
			input: false, // Single
			bias: false, // Single
			output: [],
			hidden: []
		};
		this.usedConnections = [];
	};

	Population.prototype = {

		/**
		 * Creates a population with the best species and a single
		 * individual from each of the other populations
		 **/
		copyStubPopulation: function() {
			var newPopulation = new Population(this.fitness, this.c1, this.c2,
											   this.c3, this.c4, this.dT),
				bestSpecies = this.getBestSpecies(),
				len = this.species.length,
				i, species;

			for (i=0; i < len; ++i) {
				species = this.species[i];
				if (species === bestSpecies)
					newPopulation.addSpecies(bestSpecies);
				else {
					newPopulation.addSpecies(this.copyStubSpecies(species));
				}
			}
			return newPopulation;
		},

		/**
		 * Creates a species from the one given with a randomly chosen
		 * individual(not copied)
		 **/
		copyStubSpecies: function(species) {
			var individuals = species.individuals,
				index = CPPN.Utils.randomIndexIn(0, individuals.length);
			return this.createSpecies(individuals[index]);
		},

		/**
		 * @param newSpecies {avgFitness, array({fitnes, CPPN.Network})}
		 **/
		addSpecies: function(newSpecies) {
			if (!newSpecies)
				return;
			this.species.push(newSpecies);
		},
		
		/**
		 * Adds the individual to an existing species in the population if close
		 * enough to one. otherwise, creates a new species to add it to.
		 **/
		addIndividual: function(individual) {
			var len = this.species.length,
				added = false,
				i, individuals,
				representativeNetwork,
				distance;

			// Check each species to see if close enough
			for (i=0; i < len && !added; ++i) {
				individuals = this.species[i].individuals;
				representativeNetwork = individuals[0];
				distance = this.networkDistance(individual, representativeNetwork);
				//log('distance: '+distance + ' : '+this.dT);
				if (distance <= this.dT)
				{
					individuals.push(individual);
					added = true;
				}
			}

			// if Not, then create a new species
			if (!added)
				this.addSpecies(this.createSpecies(individual));
		},

		/**
		 * Creates an {avgFitness, individuals:array({fitness, CPPN.Network})}
		 * @param network An initial individual
		 **/
		createSpecies: function(individual) {
			return {
				avgFitness: false,
				individuals: [individual]
			};
		},

		/**
		 * Calculates how similar two networks are
		 * @param n1 The first {fitnes, CPPN.Network}
		 * @param n2 The second {fitnes, CPPN.Network}
		 **/
		networkDistance: function(n1, n2) {
			var numInPopulation = this.getTotalPopulation(),
				connectionParams = this.getconnectionParams(n1, n2),
				numDiffActFtns = this.getNumDiffActivationFtns(n1, n2);

			return this.c1*connectionParams.numberOfExcess/numInPopulation
				+ this.c2*connectionParams.numberOfDisjoint/numInPopulation
				+ this.c3*connectionParams.weightDifference
				+ this.c4*numDiffActFtns;
		},

		/**
		 * @return The total population of all the species
		 **/
		getTotalPopulation: function() {
			var pop = 0,
				i = this.species.length;
			while (i--)
				pop+=this.species[i].individuals.length;
			return pop;
		},

		/**
		 * Gets the sum of all the avgFitness from the different species
		 * in the population.
		 **/
		getTotalAvgFitness: function() {
			var fitness = 0,
				i = this.species.length;
			while (i--)
				fitness+=this.species[i].avgFitness;

			return fitness;
		},

		getNumberOfSpecies: function() {
			return this.species.length;
		},

		/**
		 * Gets the network among all the species with the higest fitness
		 **/
		getBestNetwork: function() {

			var i=this.species.length,
				j, bestFitness = false, bestNetwork = false,
				individuals, fitness, network;
			while (i--) {
				individuals = this.species[i].individuals;
				j = individuals.length;
				while (j--) {
					network = individuals[j].network;
					fitness = this.fitness(network);
					if (!bestNetwork || fitness > bestFitness) {
						bestNetwork = network;
						bestFitness = fitness;
					}
				}
			}

			return {
				network: bestNetwork,
				fitness: bestFitness
			}
		},

		/**
		 * @param n1 The first {fitnes, CPPN.Network}
		 * @param n2 The second {fitnes, CPPN.Network}
		 **/
		getconnectionParams: function(n1, n2) {
			var n1Connections = n1.network.connections,
				n2Connections = n2.network.connections,
				n1len = n1Connections.length,
				n2len = n2Connections.length,
				itr1=0, itr2=0,
				n1conn, n2conn,
				n1Inn, n2Inn,
				numberOfExcess = 0,
				numberOfDisjoint = 0,
				weightDifference = 0,
				numMatchingGenes = 0;

			while ( itr1 < n1len && itr2 < n2len ) {
				n1conn = n1Connections[itr1];
				n2conn = n2Connections[itr2];
				n1Inn = n1conn.innovationNumber;
				n2Inn = n2conn.innovationNumber;

				if (n1Inn === n2Inn) {
					++numMatchingGenes;
					weightDifference+= Math.abs(n1conn.weight - n2conn.weight);
					++itr1;
					++itr2;
				}
				else if (n1Inn > n2Inn) {
					++numberOfDisjoint;
					++itr2;
				}
				else {
					++numberOfDisjoint;
					++itr1;
				}
			}

			// divide if the number of matching genes is not 0
			if (numMatchingGenes)
				weightDifference/=numMatchingGenes;

			// count number of excess
			while (itr1++ < n1len)
				++numberOfExcess;
			while (itr2++ < n2len)
				++numberOfExcess;

			return {
				numberOfExcess: numberOfExcess,
				numberOfDisjoint: numberOfDisjoint,
				weightDifference: weightDifference
			};
		},

		/**
		 * @param n1 The first {fitnes, CPPN.Network}
		 * @param n2 The second {fitnes, CPPN.Network}
		 **/
		getNumDiffActivationFtns: function(n1, n2) {

			// Count activation function differences
			var n1Nodes = n1.network.nodes,
				n2Nodes = n2.network.nodes,
				n1ActivationUsesList = [],
				n2ActivationUsesList = [],
				numActivationFunctions = n1Nodes[0].activationFunctions.length,
				i = numActivationFunctions,
				activationIndex,
				numDiffActivFtns = 0;
			while (i--) {
				n1ActivationUsesList[i]=false;
				n2ActivationUsesList[i]=false;
			}

			// Build up each list
			i = n1Nodes.length;
			while (i--) {
				activationIndex = n1Nodes[i].activationFunctionIndex;
				n1ActivationUsesList[activationIndex] = true;
			}
			i = n2Nodes.length;
			while (i--) {
				activationIndex = n2Nodes[i].activationFunctionIndex;
				n2ActivationUsesList[activationIndex] = true;
			}

			// Calculate the number of differences
			i=n1ActivationUsesList.length;
			while (i--) if (n1ActivationUsesList[i] !== n2ActivationUsesList[i])
				++numDiffActivFtns;

			return numDiffActivFtns;
		},

		/**
		 * Calculates the fitness of all the individuals the population
		 * and each species average fitness
		 **/
		run: function() {
			var species = this.species,
				sIndex = species.length,
				aSpecies, aSpeciesLen, aSpeciesAvgFit,
				iIndex, individual;
			while (sIndex--) {
				aSpecies = species[sIndex];
				aSpeciesLen = aSpecies.individuals.length;

				// Calculate the avg fitness of the species at the same time
				// as the individual fitness
				aSpecies.avgFitness = 0;

				iIndex = aSpeciesLen;
				while (iIndex--) {
					individual = aSpecies.individuals[iIndex];
					individual.fitness = this.adjustedFitness(individual.network,
															  aSpeciesLen);
					aSpecies.avgFitness+=individual.fitness;
				} // eo while iIndex--

				aSpecies.avgFitness/=aSpeciesLen;
			} // eo while sIndex--
		},

		/**
		 * Fitness adjusted based on the species a network is in
		 **/
		adjustedFitness: function(network, speciesSize) {
			// Uses f'_i = f_i / sum(j=1 to n, sh(d(i,j)))
			// which simplifies to f_i / sizeOfSpecies
			return this.fitness(network) / speciesSize;
		},

		/**
		 * Gets the best species that has a population of at least 5
		 * @note Runs the population if it hasn't been run yet
		 **/
		getBestSpecies: function() {
			// Check if the population exists or has been run yet
			if (!this.species.length)
				return false;
			if (!this.species[0].individuals[0].fitness)
				this.run();

			var i = this.species.length,
				species, bestSpecies=false;
			while (i--) {
				species = this.species[i];
				if (!bestSpecies
					|| (species.avgFitness > bestSpecies.avgFitness
						&& species.individuals.length > 5))
				{
					bestSpecies = species;
				}
			}
			return bestSpecies;
		},

		/**
		 * Calculates the standard deviation of the fitness for all the population
		 **/
		getDiversity: function() {
			var fitnesses = [],
				speciesLen = this.species.length,
				individuals, individualsLen, i, j;
			for (i=0; i<speciesLen; ++i) {
				individuals = this.species[i].individuals;
				individualsLen = individuals.length;
				for (j=0; j<individualsLen; ++j) {
					fitnesses.push(individuals[j].fitness);
				}
			}

			return CPPN.Math.stdDev(fitnesses, CPPN.Math.getX);
		},

		/**
		 * Sorts each species based on their fitness
		 * @note Runs the population if it hasn't been run yet
		 **/
		sort: function() {
			if (!this.species.length)
				return false;
			if (!this.species[0].individuals[0].fitness)
				this.run();

			var i = this.species.length,
				handler = CPPN.Population.individualSortHandler;
			while (i--)
				this.species[i].individuals.sort(handler)
		},

		toString: function() {

			var numSpecies = this.species.length,
				aSpecies, numIndividuals, individual,
				i, j,
				str = 'Population: \n';

			for (i=0; i<numSpecies; ++i) {
				str+='\n  Species:\n';
				aSpecies = this.species[i];
				numIndividuals = aSpecies.individuals.length;
				for(j=0; j<numIndividuals; ++j) {
					individual = aSpecies.individuals[j];
					str+='    -('+individual.fitness+')'
					   + individual.network+'\n'
				}
			}
			return str;
		}

	}; //eo Population

	Population.individualSortHandler = function(a, b) {
		return a.fitness - b.fitness;
	};

	CPPN['Population'] = Population;

})();