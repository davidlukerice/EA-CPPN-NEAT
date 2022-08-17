
/**
 * Final Project
 * CE 5970 - ANNE 
 * David Rice
 **/
var CPPN = CPPN || {};

(function() {

	var log = CPPN.Utils.log;

	/**
	 * Runs the quadtree selection algorithm on a canvas in order 
	 * to determine positions to describe the most information.
	 * @param canvas
	 * @param varianceThreshold A threshold for how variant the child quads should be
	 *				to divide again (lower === more initial quads)
	 * @param pruningThreshold (lower === less quads pruned)
	 * @param getPixelValue
	 * @return A list of CPPN.Box on [(0,0), (1,1)]
	 **/
	CPPN.quadtreeMultiSelection = function(canvas, varianceThreshold, pruningThreshold, getPixelValue, showHandler) {
		var centers = CPPN.quadtreeSelection(canvas, varianceThreshold, pruningThreshold, getPixelValue, showHandler);
		CPPN.Utils.normalizeBoxes(centers, canvas.width, canvas.height);
		return centers;
	};

	/**
	 * Runs the quadtree selection algorithm on a canvas in order 
	 * to determine locations and selects one of the quads by proporitional selection.
	 * @return a CPPN.Box on [(0,0),(1,1)]
	 **/
	CPPN.quadtreeSingleSelection = function(canvas, varianceThreshold, pruningThreshold, getPixelValue, showHandler) {
		var centers = CPPN.quadtreeSelection(canvas, varianceThreshold, pruningThreshold, getPixelValue, showHandler);
		var selectedBox = CPPN.Utils.proportionalSelection(centers);
		selectedBox.scaleTo(canvas.width, canvas.height, 1,1);
		return selectedBox;
	};

	/**
	 * Runs the quadtree selection algorithm on a canvas in order 
	 * to determine locations.
	 * @param canvas A DOM canvas element
	 * @return An array of CPPN.Box on [(0,0), (width,height)], if none exist,
	 *			then a random center is chosen.
	 * @note Inspiration taken from Risi [2012] ES-HyperNEAT Algorithm 1,2
	 **/
	CPPN.quadtreeSelection = function(canvas, varianceThreshold, pruningThreshold, getPixelValue, showHandler) {
		
		var container = $('.container'),
			context = canvas.getContext('2d'),
			width = canvas.width,
			height = canvas.height,
			centerX = Math.floor(width/2),
			centerY = Math.floor(height/2),
			tree = new CPPN.Quadtree(canvas),
			centers;

		// 1. Division and Initialization phase
		// 1a. Break into quads until resolution r is given (height 3?)
		tree.divideToResolution(width/5);
		if (typeof showHandler === 'function')
			showHandler(tree);

		// 1b. Continue dividing until a variance threshold is reached
		tree.divideToVariance(varianceThreshold, width/80, getPixelValue);
		if (typeof showHandler === 'function')
			showHandler(tree);

		// 2. Pruning and Extraction Phase
		tree.bandPrune(pruningThreshold, getPixelValue);
		if (typeof showHandler === 'function')
			showHandler(tree);

		//return list of enabled quadtree leafs
		centers = tree.getEnabledQuadCenters();
		if (!centers.length) {
			centers.push(new CPPN.Box(CPPN.Utils.randomIn(0, width),
									  CPPN.Utils.randomIn(0, height),
									  width,
									  height) );
		}

		return centers;
	};


	/**
	 * A quadtree that uses a canvas for its base information store
	 **/
	CPPN.Quadtree = function(canvas, parent, position) {
		
		this.canvas = canvas || CPPN.Utils.createCanvas(16,16);
		this.parent = parent || null;
		this.position = position || CPPN.Quadtree.Position.ROOT;
		
		this.width = canvas.width;
		this.height = canvas.height;
		this.centerX = Math.floor(this.width/2);
		this.centerY = Math.floor(this.height/2);
		this.absoluteCenterX;
		this.absoluteCenterY;
		this.determineAbsoluteCenter();

		// The center pixel
		this.centerPixel = CPPN.Utils.pixelAtPoint(canvas,
												   this.centerX,
												   this.centerY);
		// Children quadts
		this.NE = null;
		this.SE = null;
		this.SW = null;
		this.NW = null;

		// Used to tell if it should be used in finding locations
		this.enabled = true;
	}
	CPPN.Quadtree.prototype = {
		
		determineAbsoluteCenter: function() {
			var parent = this.parent,
				halfParentWidth = this.centerX,
				halfParentHeight = this.centerY;
			if (this.isRoot()) {
				this.absoluteCenterX = halfParentWidth;
				this.absoluteCenterY = halfParentHeight;
			}
			else if (this.isNorthEast()) {
				this.absoluteCenterX = parent.absoluteCenterX + halfParentWidth;
				this.absoluteCenterY = parent.absoluteCenterY - halfParentHeight;
			}
			else if (this.isSouthEast()) {
				this.absoluteCenterX = parent.absoluteCenterX + halfParentWidth;
				this.absoluteCenterY = parent.absoluteCenterY + halfParentHeight;
			}
			else if (this.isSouthWest()) {
				this.absoluteCenterX = parent.absoluteCenterX - halfParentWidth;
				this.absoluteCenterY = parent.absoluteCenterY + halfParentHeight;
			}
			else if (this.isNorthWest()) {
				this.absoluteCenterX = parent.absoluteCenterX - halfParentWidth;
				this.absoluteCenterY = parent.absoluteCenterY - halfParentHeight;
			}
			else {
				CPPN.Utils.error('Not correct position');
			}
		},

		hasAllChildren: function() {
			return this.NE !== null
				&& this.SE !== null
				&& this.SW !== null
				&& this.NW !== null;
		},

		hasAnyChildren: function() {
			return this.NE !== null
				|| this.SE !== null
				|| this.SW !== null
				|| this.NW !== null;
		},

		isGrandparent: function() {
			return this.NE !== null
					&& this.NE.NE !== null;
		},

		atResolution: function(res) {
			return Math.max(this.canvas.width,
							this.canvas.height) <= res;
		},

		isRoot: function() { return CPPN.Quadtree.isRoot(this); },
		isNorthEast: function() { return CPPN.Quadtree.isNorthEast(this); },
		isSouthEast: function() { return CPPN.Quadtree.isSouthEast(this); },
		isSouthWest: function() { return CPPN.Quadtree.isSouthWest(this); },
		isNorthWest: function() { return CPPN.Quadtree.isNorthWest(this); },

		isNorth: function() { return CPPN.Quadtree.isNorth(this); },
		isSouth: function() { return CPPN.Quadtree.isSouth(this); },
		isEast: function() { return CPPN.Quadtree.isEast(this); },
		isWest: function() { return CPPN.Quadtree.isWest(this); },

		divideToResolution: function(res) {
			var stack = [this],
				quad;
			while(stack.length) {
				quad = stack.pop();
				if (quad.atResolution(res))
					continue;
				
				if (!quad.hasAllChildren())
					quad.divide();
				stack.push(quad.NE);
				stack.push(quad.SE);
				stack.push(quad.SW);
				stack.push(quad.NW);
			}
		},

		divideToVariance: function(varianceThreshold, maxRes, getPixelValue) {

			var stack = [this],
				quad, centers, variance,
				isGrandparent, withinVariance, atMaxRes;

			while(stack.length) {
				quad = stack.pop();
				
				// If it doesn't divide, then at the maximum resolution
				// and should just continue
				if (!quad.hasAllChildren())
					quad.divide();
				if (!quad.hasAllChildren())
					continue;

				centers = quad.getChildrenCenters();
				variance = CPPN.Math.variance(centers, getPixelValue);

				//log('var: '+variance);

				isGrandparent = quad.isGrandparent();
				withinVariance = variance > varianceThreshold;
				atMaxRes = quad.atResolution(maxRes);
				if (isGrandparent || (withinVariance && !atMaxRes))
				{
					stack.push(quad.NE);
					stack.push(quad.SE);
					stack.push(quad.SW);
					stack.push(quad.NW);
				}
			}
		},

		divide: function() {
			// Check if the quad can be divided any further
			if (this.centerX === 0)
				return;

			var positions = CPPN.Quadtree.Position;
			
			// Only divide quads if they don't exist yet
			if (!this.NE)
				this.NE = this.divideChild(positions.NE);
			if (!this.SE)
				this.SE = this.divideChild(positions.SE);
			if (!this.SW)
				this.SW = this.divideChild(positions.SW);
			if (!this.NW)
				this.NW = this.divideChild(positions.NW);
		},

		divideChild: function(position) {
			var positions = CPPN.Quadtree.Position,
				quadWidth = this.centerX,
				quadHeight = this.centerY,
				canvas = CPPN.Utils.createCanvas(quadWidth, quadHeight),
				context = canvas.getContext('2d'),
				startX, startY;
			
			if (position === positions.NE) {
				startX = quadWidth;
				startY = 0;
			} 
			else if (position === positions.SE) {
				startX = quadWidth;
				startY = quadHeight;
			} 
			else if (position === positions.SW) {
				startX = 0;
				startY = quadHeight;
			} 
			else if (position === positions.NW) {
				startX = 0;
				startY = 0;
			} 

			context.drawImage(	this.canvas,	// Source
								startX,			// SourceX (from left)
								startY,			// SourceY (from top)
								quadWidth,		// Source Width
								quadHeight,		// Source Height
								0,0,quadWidth,quadHeight); // Target
			return new CPPN.Quadtree(canvas, this, position);
		},

		getChildrenCenters: function() {
			return [this.NE.centerPixel,
					this.SE.centerPixel,
					this.SW.centerPixel,
					this.NW.centerPixel];
		},

		bandPrune: function(threshold, getPixelValue) {
			var directions = CPPN.Quadtree.Direction,
				stack = [this],
				quad;
			while(stack.length) {
				quad = stack.pop();
				// DFS down to the bottom quads
				if (quad.hasAnyChildren()) {
					if (quad.NE) stack.push(quad.NE);
					if (quad.SE) stack.push(quad.SE);
					if (quad.SW) stack.push(quad.SW);
					if (quad.NW) stack.push(quad.NW);
				}
				else {
					//2. Remove the quads with b bellow some threshold
					var thisVal = getPixelValue(quad.centerPixel);
					
					var northQuad = quad.getBorderQuad(directions.N),
						southQuad = quad.getBorderQuad(directions.S),
						eastQuad = quad.getBorderQuad(directions.E),
						westQuad = quad.getBorderQuad(directions.W),
						northVal, southVal, eastVal, westVal,
						d_top=0, d_bottom=0, d_left=0, d_right=0, b;

					if (northQuad) {
						northVal = getPixelValue(northQuad.centerPixel),
						d_top = Math.abs(thisVal - northVal);
					}
					if (southQuad) {
						southVal = getPixelValue(southQuad.centerPixel),
						d_bottom = Math.abs(thisVal - southVal);
					}
					if (eastQuad) {
						eastVal = getPixelValue(eastQuad.centerPixel),
						d_right = Math.abs(thisVal - eastVal);
					}
					if (westQuad) {
						westVal = getPixelValue(westQuad.centerPixel),
						d_left = Math.abs(thisVal - westVal);
					}

					// If not enough difference with neighbors disable the
					// quad
					b = Math.max(Math.min(d_top, d_bottom),
								 Math.min(d_left, d_right));
					if (b < threshold)
						quad.enabled = false;
				}
			}
		},

		/**
		 * Gets the quad to the south in the tree.
		 * @return Quadtree if found, false if not.
		 **/
		getBorderQuad: function(direction) {
			var f = this.getBorderQuadFtns(direction);

			if (f.isCCW135(this))
				return f.getCCW45(this.parent);
			if (f.isCW135(this))
				return f.getCW45(this.parent);

			var stack = [this],
				goingUp = true,
				downQuad,
				quad;
			while (stack.length) {
				quad = stack[stack.length-1];
				// Traversing up
				if(goingUp) {
					if (f.isOppositeDirection(quad)) {
						goingUp = false;
						downQuad = quad.parent;
					}	
					else if (f.isDirection(quad))
						stack.push(quad.parent);
					// If there's no parent to push, then
					// it's at the root and North doesn't exist.
					else
						return false;
				}
				// Traversing Down
				else {
					stack.pop();
					//if (stack.length === 0)
					//	return downQuad;

					if (f.isCW135(quad) && f.getCW45(downQuad))
						downQuad = f.getCW45(downQuad);
					else if (f.isCCW135(quad) && f.getCCW45(downQuad))
						downQuad = f.getCCW45(downQuad);
					else if (f.isCW45(quad) && f.getCW135(downQuad))
						downQuad = f.getCW135(downQuad);
					else if (f.isCCW45(quad) && f.getCCW135(downQuad))
						downQuad = f.getCCW135(downQuad);
					else
						return downQuad;
				}
			} // eo while
			return downQuad;
		}, // eo getBorderQuad

		getBorderQuadFtns: function(direction) {
			var Quadtree = CPPN.Quadtree,
				directions = Quadtree.Direction,
				f = {};

			if (direction === directions.N) {
				f.isDirection = Quadtree.isNorth;
				f.isOppositeDirection = Quadtree.isSouth;
				f.isCCW135 = Quadtree.isSouthWest;
				f.isCCW45 = Quadtree.isNorthWest;
				f.isCW45 = Quadtree.isNorthEast;
				f.isCW135 = Quadtree.isSouthEast;
				f.getCCW135 = Quadtree.getSW;
				f.getCCW45 = Quadtree.getNW;
				f.getCW45 = Quadtree.getNE;
				f.getCW135 = Quadtree.getSE;
			}
			else if (direction === directions.S) {
				f.isDirection = Quadtree.isSouth;
				f.isOppositeDirection = Quadtree.isNorth;
				f.isCCW135 = Quadtree.isNorthWest;
				f.isCCW45 = Quadtree.isSouthWest;
				f.isCW45 = Quadtree.isSouthEast;
				f.isCW135 = Quadtree.isNorthEast;
				f.getCCW135 = Quadtree.getNW;
				f.getCCW45 = Quadtree.getSW;
				f.getCW45 = Quadtree.getSE;
				f.getCW135 = Quadtree.getNE;
			}
			else if (direction === directions.E) {
				f.isDirection = Quadtree.isEast;
				f.isOppositeDirection = Quadtree.isWest;
				f.isCCW135 = Quadtree.isNorthWest;
				f.isCCW45 = Quadtree.isNorthEast;
				f.isCW45 = Quadtree.isSouthEast;
				f.isCW135 = Quadtree.isSouthWest;
				f.getCCW135 = Quadtree.getNW;
				f.getCCW45 = Quadtree.getNE;
				f.getCW45 = Quadtree.getSE;
				f.getCW135 = Quadtree.getSW;
			}
			else if (direction === directions.W) {
				f.isDirection = Quadtree.isWest;
				f.isOppositeDirection = Quadtree.isEast;
				f.isCCW135 = Quadtree.isNorthEast;
				f.isCCW45 = Quadtree.isNorthWest;
				f.isCW45 = Quadtree.isSouthWest;
				f.isCW135 = Quadtree.isSouthEast;
				f.getCCW135 = Quadtree.getNE;
				f.getCCW45 = Quadtree.getNW;
				f.getCW45 = Quadtree.getSW;
				f.getCW135 = Quadtree.getSE;
			}

			return f;
		},

		getEnabledQuadCenters: function() {

			var box = CPPN.Box,
				points = [],
				stack = [this],
				quad, NE, SE, SW, NW;
			while(stack.length) {
				quad = stack.pop();
				NE = quad.NE; SE = quad.SE; SW = quad.SW; NW = quad.NW;

				if (!quad.hasAnyChildren() && quad.enabled)
					points.push(new box(quad.absoluteCenterX,
								 		quad.absoluteCenterY,
								 		quad.width,
								 		quad.height));
				else {
					if (quad.NE)
						stack.push(quad.NE);
					if (quad.SE)
						stack.push(quad.SE);
					if (quad.SW)
						stack.push(quad.SW);
					if (quad.NW)
						stack.push(quad.NW);
				}
			}
			return points;
		},

		/**
		 * @return canvas with visible quad boundaries
		 **/
		render: function() {
			if (!this.hasAnyChildren())
				return this.canvas;

			var width = this.canvas.width,
				height = this.canvas.height,
				quadWidth = this.centerX,
				quadHeight = this.centerY,
				renderedCanvas = CPPN.Utils.createCanvas(width, height),
				context = renderedCanvas.getContext('2d'),
				NECanvas, SECanvas, SWCanvas, NWCanvas;

			NECanvas = this.NE.render();
			SECanvas = this.SE.render();
			SWCanvas = this.SW.render();
			NWCanvas = this.NW.render();

			context.drawImage(NECanvas, quadWidth, 0);
			context.drawImage(SECanvas, quadWidth, quadHeight);
			context.drawImage(SWCanvas, 0, quadHeight);
			context.drawImage(NWCanvas, 0, 0);

			// Draw quad lines for enabled quads a child is a leaf
			context.strokeStyle="#FF0000";
			context.lineWidth   = 2;
			context.beginPath();
			
			if (this.NE.enabled && !this.NE.hasAnyChildren())
				context.rect(quadWidth, 0, quadWidth, quadHeight);
			if (this.SE.enabled && !this.SE.hasAnyChildren())
				context.rect(quadWidth, quadHeight, quadWidth, quadHeight);
			if (this.SW.enabled && !this.SW.hasAnyChildren())
				context.rect(0, quadHeight, quadWidth, quadHeight);
			if (this.NW.enabled && !this.NW.hasAnyChildren())
				context.rect(0, 0, quadWidth, quadHeight);

			context.stroke();
			
			return renderedCanvas;
		},

		toString: function() {
			if (this.parent === null)
				return "[ "+this.position;
			return this.parent.toString() + " : " + this.position;
		}
	};

	CPPN.Quadtree.Position = {
		'ROOT':'ROOT',
		'NE':'NE',
		'SE':'SE',
		'SW':'SW',
		'NW':'NW'
	};

	CPPN.Quadtree.Direction = {
		'N': 'N',
		'S': 'S',
		'E': 'E',
		'W': 'W'
	};

	CPPN.Quadtree.isRoot = function(quad) { return quad.position === CPPN.Quadtree.Position.ROOT; };
	CPPN.Quadtree.isNorthEast = function(quad) { return quad.position === CPPN.Quadtree.Position.NE; };
	CPPN.Quadtree.isSouthEast = function(quad) { return quad.position === CPPN.Quadtree.Position.SE; };
	CPPN.Quadtree.isSouthWest = function(quad) { return quad.position === CPPN.Quadtree.Position.SW; };
	CPPN.Quadtree.isNorthWest = function(quad) { return quad.position === CPPN.Quadtree.Position.NW; };
	CPPN.Quadtree.isNorth = function(quad) { return CPPN.Quadtree.isNorthWest(quad) || CPPN.Quadtree.isNorthEast(quad); };
	CPPN.Quadtree.isSouth = function(quad) { return CPPN.Quadtree.isSouthWest(quad) || CPPN.Quadtree.isSouthEast(quad); };
	CPPN.Quadtree.isEast = function(quad) { return CPPN.Quadtree.isNorthEast(quad) || CPPN.Quadtree.isSouthEast(quad); };
	CPPN.Quadtree.isWest = function(quad) { return CPPN.Quadtree.isNorthWest(quad) || CPPN.Quadtree.isSouthWest(quad); };

	CPPN.Quadtree.getNE = function(quad) {return quad.NE;};
	CPPN.Quadtree.getSE = function(quad) {return quad.SE;};
	CPPN.Quadtree.getSW = function(quad) {return quad.SW;};
	CPPN.Quadtree.getNW = function(quad) {return quad.NW;};

})();