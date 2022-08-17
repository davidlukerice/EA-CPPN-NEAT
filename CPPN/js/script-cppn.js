
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/

// global for debugging access
var network;
var WORLD_WIDTH = 256,
	WORLD_HEIGHT = 256,
	NUM_GENERATIONS = 40,
	RENDER_ON_STEP = 2;

;(function($) {
	$(function() {
		var log = CPPN.Utils.log,
			container = $('.container'),
			handler;

		handler = function(canvas) {
			CPPN.Utils.showCanvas(container, canvas);
		};
		renderHandler = function(network, width, height) {
			return CPPN.renderBWNetwork(network, width, height);
		};

		network = CPPN.generator(2,1,
								 WORLD_WIDTH,
								 WORLD_HEIGHT,
								 NUM_GENERATIONS,
								 renderHandler,
								 RENDER_ON_STEP,
								 handler);
	});
}) (jQuery);
