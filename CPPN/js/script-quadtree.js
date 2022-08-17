
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/

// global for debugging access
var network;
var VARIANCE_THRESHHOLD = 600,
	PRUNING_THRESHOLD = 30;

;(function($) {
	$(function() {
		var log = CPPN.Utils.log,
			container = $('.container'),
			handler;

		var image = new Image();
		image.onload = function() {
			run();
		}
		image.src = 'img/colorDeck.png';
		//image.src = 'img/1chainMail_Evolved.png';

		function run() {
			var canvas = CPPN.Utils.imageToCanvas(image),
				redCanvas = CPPN.Utils.getChannelFrom(canvas, 0),
				greenCanvas = CPPN.Utils.getChannelFrom(canvas, 1),
				blueCanvas = CPPN.Utils.getChannelFrom(canvas, 2),
				startTime = new Date().getTime() / 1000;
			
			CPPN.Utils.showCanvas(container, canvas, true);
			container.append('<br />');

			CPPN.Utils.showCanvas(container, redCanvas, true);
			var multiSelection = CPPN.quadtreeMultiSelection(redCanvas, VARIANCE_THRESHHOLD,
									PRUNING_THRESHOLD, CPPN.Utils.getRed, showHandler);
			var singleSelection = CPPN.quadtreeSingleSelection(redCanvas, VARIANCE_THRESHHOLD,
									PRUNING_THRESHOLD, CPPN.Utils.getRed);
			container.append('<br />');
			log(JSON.stringify(multiSelection));
			log(singleSelection);
			
			CPPN.Utils.showCanvas(container, greenCanvas, true);
			CPPN.quadtreeMultiSelection(greenCanvas, VARIANCE_THRESHHOLD,
									PRUNING_THRESHOLD, CPPN.Utils.getGreen, showHandler);
			container.append('<br />');

			CPPN.Utils.showCanvas(container, blueCanvas, true);
			CPPN.quadtreeMultiSelection(blueCanvas, VARIANCE_THRESHHOLD,
									PRUNING_THRESHOLD, CPPN.Utils.getBlue, showHandler);
			container.append('<br />');

			log('RunTime: '+ ((new Date().getTime() / 1000) - startTime))
		}

		function showHandler(tree) {
			CPPN.Utils.showCanvas(container, tree.render(), true);
		}
	});
}) (jQuery);
