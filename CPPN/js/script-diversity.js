
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/

// global for debugging access
var neat;
var POPULATION_SIZE = 30,
	NUM_GENERATIONS = 40,
	RENDER_ON_STEP = 5,

	WORLD_WIDTH = 256,
	WORLD_HEIGHT = 256,
	VARIANCE_THRESHHOLD = 800,
	PRUNING_THRESHOLD = 40;

	var totalAvgFitnessData = [['Generation', 'totalAvgFitness']];
	var speciesData = [['Generation', 'Number of Species']];
	var bestNetworkData = [['Generation', 'BestFitness']];
	var bestSpeciesData = [['Generation', 'BestSpeciesAvgFitness']];
	var poulationDiversityData = [['Generation', 'Population Diversity']];

;(function($) {

	var log = CPPN.Utils.log,
		container = $('.container'),
		handler;

	// Graph the results
	google.load("visualization", "1", {packages:["corechart"]});
	google.setOnLoadCallback(function() {
		collectData();
	});
	
	function collectData() {

		handler = function(canvas) {
			//CPPN.Utils.showCanvas(container, canvas);
		};

		neat = new CPPN.NEAT( {
			populationSize: POPULATION_SIZE,
			numInputs: 2,
			numOutputs: 1,
			speciation_deltaT: 0.4,
			fitness: CPPN.NEAT.diversityFitness
		});

		container.append('<br />');
		container.append('Total Avg Fit/numSpecies (0): '
						 +(neat.population.getTotalAvgFitness()/neat.population.getNumberOfSpecies()));
		container.append('<br />');

		var generation = 1, bestNetwork;
		var generationHandler = function() {
			//debugger;
			neat.nextGeneration();
			
			bestNetwork = neat.population.getBestNetwork();
			
			var totalAvgFitness = neat.population.getTotalAvgFitness();
			var numSpecies = neat.population.getNumberOfSpecies();

			if (!(generation%RENDER_ON_STEP)) {
				showBestNetwork(bestNetwork.network);
				container.prepend('generation('+generation+') Total Avg Fit/numSpecies: '+totalAvgFitness/numSpecies);
				container.prepend('<br />');
			}
			
			totalAvgFitnessData.push([generation,totalAvgFitness/numSpecies]);
			speciesData.push([generation, numSpecies]);
			bestNetworkData.push([generation, bestNetwork.fitness]);
			bestSpeciesData.push([generation, neat.population.getBestSpecies().avgFitness]);
			poulationDiversityData.push([generation, neat.population.getDiversity()]);
			//log(""+neat.population);	

			if (++generation <= NUM_GENERATIONS)
				setTimeout(generationHandler, 0);
			else
				showData();	
		}
		setTimeout(generationHandler, 0);
	}

	function showBestNetwork(network) {
		var canvases = CPPN.renderBWNetwork(network,WORLD_WIDTH,WORLD_HEIGHT),
			startTime = new Date().getTime() / 1000;
		
		container.prepend('<br />');
		
		var len = canvases.length, i, canvas;
		for (i=0; i<len; ++i) {
			canvas = canvases[i];
			CPPN.quadtreeMultiSelection(canvas, VARIANCE_THRESHHOLD,
							 			PRUNING_THRESHOLD, CPPN.Utils.getRed,
				function(tree) {
					CPPN.Utils.showCanvas(container, tree.render(), false);
				}
			);
			container.prepend('<br />');
		}
		container.prepend('Quadtree Selection <br />');
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
		printArray(totalAvgFitnessData);

		graphs.append('<div id="speciesChart" class="graph" style="width: '+graphWidth+'px; height: '+graphHeight+'px;"></div>');
		tableData = google.visualization.arrayToDataTable(speciesData);
		options = { title: 'Number of Species vs Generation' };
		chart = new google.visualization.LineChart(document.getElementById('speciesChart'));
		chart.draw(tableData, options);
		printArray(speciesData);

		graphs.append('<div id="bestNetworkChart" class="graph" style="width: '+graphWidth+'px; height: '+graphHeight+'px;"></div>');
		tableData = google.visualization.arrayToDataTable(bestNetworkData);
		options = { title: 'Best Network Fitness vs Generation' };
		chart = new google.visualization.LineChart(document.getElementById('bestNetworkChart'));
		chart.draw(tableData, options);
		printArray(bestNetworkData);

		graphs.append('<div id="bestSpeciesChart" class="graph" style="width: '+graphWidth+'px; height: '+graphHeight+'px;"></div>');
		tableData = google.visualization.arrayToDataTable(bestSpeciesData);
		options = { title: 'Best Species Avg Fitness vs Generation' };
		chart = new google.visualization.LineChart(document.getElementById('bestSpeciesChart'));
		chart.draw(tableData, options);
		printArray(bestSpeciesData);

		graphs.append('<div id="PopDivChart" class="graph" style="width: '+graphWidth+'px; height: '+graphHeight+'px;"></div>');
		tableData = google.visualization.arrayToDataTable(poulationDiversityData);
		options = { title: 'Population Diversity vs Generation' };
		chart = new google.visualization.LineChart(document.getElementById('PopDivChart'));
		chart.draw(tableData, options);
		printArray(poulationDiversityData);
	}

	function printArray(arr) {
		var dataContainer = $('.data');
		var len = arr.length, i;
		for (i=0; i<len;++i) {
			dataContainer.append(arr[i][1]+'<br />');
		}
	}

}) (jQuery);
