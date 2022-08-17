
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/
var CPPN = CPPN || {};

(function() {

	/**
	 * CPPN.Utils
	 * A set of utility functions in the project
	 **/
	CPPN.Utils = {

		IS_DEBUG: false,

		log: function(msg) {
			if (CPPN.Utils.IS_DEBUG)
				console.log(msg)
		},

		error: function(msg) {
			throw msg;
		},

		/**
		 * @param container
		 * @param canvas A DOM canvas or an array of DOM canvases
		 **/
		showCanvas: function(container, canvas, shouldAppend) {
			var image;

			if ($.isArray(canvas)) {
				var len = canvas.length, i;
				for (i=0; i<len; ++i) {
					image = CPPN.Utils.canvasToImage(canvas[i]);
					if (shouldAppend)
						$(container).append(image);
					else
						$(container).prepend(image);
				}
			}
			else {
				image = CPPN.Utils.canvasToImage(canvas);
				if (shouldAppend)
						$(container).append(image);
					else
						$(container).prepend(image);
			}
		},

		createCanvas: function(width, height) {
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			return canvas;
		},

		copyCanvas: function(canvas) {
			var width = canvas.width,
				height = canvas.height,
				canvasCopy = CPPN.createCanvas(width, height),
				context = canvasCopy.getContext('2d');
			context.drawImage(canvas, 0, 0);
			return canvasCopy;
		},

		/**
		 * Converts the provided image to a DOM canvas element
		 * @param image An Image
		 * @return a canvas with the same image data
		 **/
		imageToCanvas: function(image) {
			var canvas = CPPN.Utils.createCanvas(image.width, image.height),
				context = canvas.getContext('2d');
			context.drawImage(image, 0, 0);
			return canvas;
		},

		/**
		 * Converts the given canvas to an Image
		 * @param canvas
		 * @param callback (optional) function(image) when the
		 *			image is loaded.
		 * @return The Image (may not be loaded yet)
		 **/
		canvasToImage: function(canvas, callback) {
			var image = new Image();
			image.onload = function(){
				if (typeof callback === 'function')
					callback(image);
			}
			image.src = canvas.toDataURL("image/png");
			return image;
		},

		/**
		 * Gets the pixel at a given point in the canvas
		 * @param canvas
		 * @param x
		 * @param y
		 * @return An array [r,g,b,a]
		 **/
		pixelAtPoint: function(canvas, x, y) {
			var context = canvas.getContext('2d');
			return context.getImageData(x,y,1,1).data;
		},

		getRed: function(pixel) {
			return pixel[0];
		},
		getGreen: function(pixel) {
			return pixel[1];
		},
		getBlue: function(pixel) {
			return pixel[2];
		},
		getAlpha: function(pixel) {
			return pixel[3];
		},

		/**
		 * @param canvas
		 * @param offset 0-red, 1-green, 2-blue, 3-alpha
		 **/
		getChannelFrom: function(canvas, channel) {

			var context = canvas.getContext('2d'),
				newCanvas = document.createElement('canvas'),
				newContext = newCanvas.getContext('2d'),
				width = canvas.width,
				height = canvas.height;
			newCanvas.width = width;
			newCanvas.height = height;

			var imageData = context.getImageData(0,0, width, height),
				pixels = imageData.data,
				x, y, i, val;

			for( x=0; x<width; ++x) 
			for( y=0; y<height; ++y)
			{
				i = (y*width+x)*4;
				val = pixels[i+channel];
				pixels[i+0] = (channel === 0 ? val : 0); //red
				pixels[i+1] = (channel === 1 ? val : 0); //green
				pixels[i+2] = (channel === 2 ? val : 0); //blue
				pixels[i+3] = 255; //alpha
			}
			newContext.putImageData(imageData, 0,0);
			return newCanvas;
		},

		randomIn: function(min,max) {
			return Math.random()*max + min;
		},

		randomIndexIn: function(min, max) {
			return Math.floor(CPPN.Utils.randomIn(min, max));
		},

		randomChance: function() {
			return Math.random();
		},

		randomBool: function() {
			return !!Math.round(Math.random());
		},

		/**
		 * Clamps the given number to the min or max
		 * @param x 
		 * @param min
		 * @param max
		 * @return A number in [min, max]
		 **/
		clamp: function(x, min, max) {
			if (x > max)
				return max;
			if (x < min)
				return min;
			return x;
		},

		//+ Jonas Raoni Soares Silva
		//@ http://jsfromhell.com/array/shuffle [rev. #1]
		shuffle: function(v) {
			for(var j, x, i = v.length; 
				i;
				j = parseInt(Math.random() * i),
					x = v[--i],
					v[i] = v[j],
					v[j] = x);
			return v;
		},

		/** 
		 * [-1,1] --> [0,255]
		 * Scales with -1 being dark
		 **/
		scaleArray: function(a) {
			var i = a.length;
			while(i--) 
				a[i] = (a[i]+1)/2 * 255;
		},

		/** 
		 * [-1,1] --> [0,255]
		 * Scales with 0 being dark, -1/1 are light
		 **/
		absScaleArray: function(a) {
			var i = a.length;
			while(i--) 
				a[i] = Math.abs(a[i]) * 255;
		},

		/**
		 * [(0,0),(width,height)] --> [(0,0),(1,1)]
		 **/
		mapToOne: function(a, width, height) {
			var i=a.length,
				v2 = CPPN.Vector2,
				currentRangeMin = v2.zero,
				currentRangeMax = new v2(width, height),
				mapRangeMin = currentRangeMin,
				mapRangeMax = v2.one;
			while(i--)
				a[i].mapTo(currentRangeMin, currentRangeMax,
						   mapRangeMin, mapRangeMax);
		},

		/**
		 * [(0,0),(width,height)] --> [(0,0),(1,1)]
		 **/
		normalizeBoxes: function(a, width, height) {
			var i= a.length;
			while(i--)
				a[i].scaleTo(width, height, 1, 1);
		},

		/**
		 * @param a An array of CPPN.Box
		 **/
		proportionalSelection: function(a) {
			var area = 0,
				len = a.length,
				i = len,
				val,
				currenVal = 0;
			while(i--)
				area+= a[i].width * a[i].height;
			
			val = CPPN.Utils.randomIn(0, area);

			for(i=0;i<len;++i) {
				currenVal+= a[i].width * a[i].height;
				if (currenVal>=val)
					return a[i];
			}

			CPPN.Utils.error('Nothing picked in proportionalSelection');
		}

	}; // eo CPPN.Utils

})();