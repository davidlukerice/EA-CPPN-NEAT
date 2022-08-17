
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/

// global for debugging access
var neat;
var POPULATION_SIZE = 250,
	NUM_GENERATIONS = 300,
	RENDER_ON_STEP = 10;

;(function($) {

	var log = CPPN.Utils.log,
		container = $('.container'),
		handler;

	var totalAvgFitnessData = [['Generation', 'totalAvgFitness']];	
	var speciesData = [['Generation', 'Number of Species']];
	var bestNetworkData = [['Generation', 'BestFitness']];
	var bestSpeciesData = [['Generation', 'BestSpeciesAvgFitness']];

	// Graph the results
	google.load("visualization", "1", {packages:["corechart"]});
	google.setOnLoadCallback(function() {
		collectData();
	});
	
	function collectData() {

		handler = function(canvas) {
			CPPN.Utils.showCanvas(container, canvas);
		};

		neat = new CPPN.NEAT( {
			populationSize: POPULATION_SIZE,
			numInputs: 2,
			numOutputs: 1,
			speciation_deltaT: 0.4,
			fitness: function(network) {
				return network.connections.length + network.nodes.length;
			}
		});

		container.append('<br />');
		container.append('Total Avg Fit (0): '
						 +neat.population.getTotalAvgFitness());
		container.append('<br />');

		var generation = 1, bestNetwork;
		var generationHandler = function() {
			neat.nextGeneration();
			
			bestNetwork = neat.population.getBestNetwork();

			var totalAvgFitness = neat.population.getTotalAvgFitness();
			var numSpecies = neat.population.getNumberOfSpecies();

			if (!(generation%RENDER_ON_STEP)) {
				container.prepend('generation('+generation+') Total Avg Fit: '+totalAvgFitness);
				container.prepend('<br />');
			}
			
			totalAvgFitnessData.push([generation,totalAvgFitness/numSpecies]);
			speciesData.push([generation, numSpecies]);
			bestNetworkData.push([generation, bestNetwork.fitness]);
			bestSpeciesData.push([generation, neat.population.getBestSpecies().avgFitness]);

			if (++generation <= NUM_GENERATIONS)
				setTimeout(generationHandler, 0);
			else
				showData();	
		}
		setTimeout(generationHandler, 0);
	}

	function showData() {
		var graphs = $('.graphs'),
			graphWidth = 600,
			graphHeight = 400;

		graphs.append('<div id="totalAvgFitnessChart" class="graph" style="width: '+graphWidth+'px; height: '+graphHeight+'px;"></div>');
		var tableData = google.visualization.arrayToDataTable(totalAvgFitnessData);
		var options = { title: 'totalAvgFitness/numSpecies vs Generation' };
		var chart = new google.visualization.LineChart(document.getElementById('totalAvgFitnessChart'));
		chart.draw(tableData, options);


		graphs.append('<div id="speciesChart" class="graph" style="width: '+graphWidth+'px; height: '+graphHeight+'px;"></div>');
		tableData = google.visualization.arrayToDataTable(speciesData);
		options = { title: 'Number of Species vs Generation' };
		chart = new google.visualization.LineChart(document.getElementById('speciesChart'));
		chart.draw(tableData, options);


		graphs.append('<div id="bestNetworkChart" class="graph" style="width: '+graphWidth+'px; height: '+graphHeight+'px;"></div>');
		tableData = google.visualization.arrayToDataTable(bestNetworkData);
		options = { title: 'Best Network Fitness vs Generation' };
		chart = new google.visualization.LineChart(document.getElementById('bestNetworkChart'));
		chart.draw(tableData, options);

		graphs.append('<div id="bestSpeciesChart" class="graph" style="width: '+graphWidth+'px; height: '+graphHeight+'px;"></div>');
		tableData = google.visualization.arrayToDataTable(bestSpeciesData);
		options = { title: 'Best Species Avg Fitness vs Generation' };
		chart = new google.visualization.LineChart(document.getElementById('bestSpeciesChart'));
		chart.draw(tableData, options);
	}

}) (jQuery);
