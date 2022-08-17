
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/

// global for debugging access
var parent1,
	parent2,
	child;
var WORLD_WIDTH = 256,
	WORLD_HEIGHT = 256,
	NUM_GENERATIONS = 8,
	RENDER_ON_STEP = 4;

;(function($) {
	$(function() {
		var log = CPPN.Utils.log,
			container = $('.container'),
			handler;

		handler = function(canvas) {
			CPPN.Utils.showCanvas(container, canvas, true);
		};
		renderHandler = function(network, width, height) {
			return CPPN.renderBWNetwork(network, width, height);
		};

		container.append('Root:<br />');
		parent1 = CPPN.generator(2, 1,
								 WORLD_WIDTH,
								 WORLD_HEIGHT,
								 NUM_GENERATIONS,
								 renderHandler,
								 RENDER_ON_STEP,
								 handler,
		function() {
			log("root: "+parent1);
			runParent1();
		});
	

		function runParent1() {
			container.append('<br />');
			
			parent2 = parent1.copy();
			container.append('Parent1:<br />');
			CPPN.runNetwork(parent1, WORLD_WIDTH,
								 WORLD_HEIGHT,
								 NUM_GENERATIONS,
								 renderHandler,
								 RENDER_ON_STEP,
								 handler,
			function() {
				log("p1: "+parent1);
				runParent2();
			});
		}

		function runParent2() {
			container.append('<br />');
			container.append('Parent2:<br />');
			CPPN.runNetwork(parent2, WORLD_WIDTH,
								 WORLD_HEIGHT,
								 NUM_GENERATIONS,
								 renderHandler,
								 RENDER_ON_STEP,
								 handler,
			function() {
				log("p2: "+parent2);
				runChild();
			});
		}

		function runChild() {
			container.append('<br />');
			
			child = CPPN.crossover(parent1, 1.0, parent2, 1.0);
			log("c: "+child);
			if (child)
			{
				container.append('Child:<br />');
				CPPN.runNetwork(child, WORLD_WIDTH,
								 WORLD_HEIGHT,
								 NUM_GENERATIONS,
								 renderHandler,
								 RENDER_ON_STEP,
								 handler, function() { });
			}
		}

		var button = $('<button style="position:fixed;right:0;bottom:0;">Run Child</button>');
		button.click(function() {
			runChild();
			//handler(CPPN.renderNetwork(child, WORLD_WIDTH, WORLD_HEIGHT));
		});
		container.append(button);
	});
}) (jQuery);
