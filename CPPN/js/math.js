/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/
var CPPN = CPPN || {};

(function() {

	/**
	 * CPPN.Math
	 * A set of math functions used in the project.
	 **/
	CPPN.Math = {

		/**
		 * Calculate the error 
		 * @param target
		 * @param output
		 * @return number
		 **/
		error: function(target, output)
		{
			return Math.pow(target-output,2)/2;
		},

		/**
		 * Default get function that just returns what was passed in
		 **/
		getX: function(x) {
			return x;
		},

		/**
		 * Averages all the numbers in xs
		 * @param xs An array of X
		 * @param getX (optional) A function to return the value in X
		 * @return The avg.
		 **/
		avg: function(xs, getX)
		{
			if (typeof getX === 'undefined')
				getX = CPPN.Math.getX;

			var avg = 0;
			for(var i in xs)
				avg+=getX(xs[i]);
			return avg/xs.length;
		},

		/**
		 * Standard Deviation of the numbers in xs
		 * @param xs An array of X
		 * @param getX (optional) A function to return the value in X
		 * @return The stdDev.
		 **/
		stdDev:function(xs, getX) {
			var v = CPPN.Math.variance(xs, getX);
			return Math.sqrt(v);
		},

		/**
		 * Variance of the numbers in xs
		 * @param xs An array of X
		 * @param getX (optional) A function to return the value in X
		 * @return The variance.
		 **/
		variance: function(xs, getX) {
			if (typeof getX === 'undefined')
				getX = CPPN.Math.getX;

			var avg = this.avg(xs, getX),
				i = xs.length,
				sum = 0;
			while (i--)
				sum+=Math.pow(getX(xs[i]) - avg,2);
			return sum/xs.length;
		},

		TwoPi: Math.PI * 2,

		// A variety of node functions 
		sin: function(x) {
			// Sin with a period of 1
			return Math.sin(x * CPPN.Math.TwoPi);
		},

		cos: function(x) {
			// Cos with a period of 1
			return Math.cos(x * CPPN.Math.TwoPi);
		},

		tan: function(x) {
			return CPPN.Utils.clamp( Math.tan(x),
									-10000,
									 10000);
		},

		tanh: function(x) {
			return -1 + 2/(1 + Math.exp(-2*x));
		},

		bipolarSigmoid: function(x) {
			return (1-Math.exp(-x))/
				   (1+Math.exp(-x));
		},

		gaussian: function(x) {
			return Math.exp(-x*x);
		},

		ramp: function(x) {
			return 1-2*(x-Math.floor(x));
		},

		step: function(x) {
			if(Math.floor(x)%2 === 0)
				return 1;
			return -1;
		},

		spike: function(x) {
			var floorX = Math.floor(x);
			if(floorX % 2 === 0)
				return 1-2*(x-floorX);
			return -1 + 2*(x-floorX);
		},

		line: function(x) {
			return x;
		},

		inverse: function(x) {
			return -x;
		}

	}; // eo CPPN.Math

	/**
	 * A tuple containing x,y
	 **/
	CPPN.Vector2 = function(x, y) {
		this.x = x;
		this.y = y;
	};
	CPPN.Vector2.prototype = {
		clone: function() {
			return new CPPN.Vector2(this.x, this.y);
		},

		mapTo: function(currentRangeMin, currentRangeMax,mapRangeMin, mapRangeMax) {
			this.x = (this.x - currentRangeMin.x)/(currentRangeMax.x-currentRangeMin.x)*
					 (mapRangeMax.x - mapRangeMin.x) + mapRangeMin.x;
			this.y = (this.y - currentRangeMin.y)/(currentRangeMax.y-currentRangeMin.y)*
					 (mapRangeMax.y - mapRangeMin.y) + mapRangeMin.y;
		}
	};
	CPPN.Vector2.zero = new CPPN.Vector2(0,0);
	CPPN.Vector2.one = new CPPN.Vector2(1,1);

	/**
	 * A vector2 with a width and height parameters as well
	 **/
	CPPN.Box = function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	};
	CPPN.Box.prototype = {
		scaleTo: function(currentWidth, currentHeight, scaledWidth, scaledHeight) {
			var widthRatio = scaledWidth/currentWidth,
				heightRatio = scaledHeight/currentHeight;
			this.x*= widthRatio;
			this.y*= heightRatio;
			this.width*= widthRatio;
			this.height*= heightRatio;
		}
	};

})();