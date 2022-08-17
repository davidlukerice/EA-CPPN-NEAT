/**
 * Quadtree Tests
 **/

module('Quadtree');

test('divide', function() {
	var quad = createTree(16);

	quad.divide();

	ok(	   quad.NE
		&& quad.SE
		&& quad.SW
		&& quad.NW, 'Divide creates all 4 children');

	quad.NE.divide();
	quad.NE.NE.divide();
	quad.NE.NE.NE.divide();

	ok(quad.NE.NE.NE.NE, 'size 16 divided 4 times');

	quad.NE.NE.NE.NE.divide();
	ok(quad.NE.NE.NE.NE.NE === null,
		'size 16 can\'t be divided 5 times');
});

test('determineAbsoluteCenter', function() {
	var quad = createTree(16);
	quad.divide();
	quad.NE.divide();

	ok(quad.absoluteCenterX === 8
		&& quad.absoluteCenterY === 8, 'size 16 Root center is 8,8');
	ok(quad.NE.absoluteCenterX === 12
		&& quad.NE.absoluteCenterY === 4, 'size 16 Root.NE center is 12,4');
	ok(quad.SE.absoluteCenterX === 12
		&& quad.SE.absoluteCenterY === 12, 'size 16 Root.SE center is 12,12');
	ok(quad.SW.absoluteCenterX === 4
		&& quad.SW.absoluteCenterY === 12, 'size 16 Root.SW center is 4,12');
	ok(quad.NW.absoluteCenterX === 4
		&& quad.NW.absoluteCenterY === 4, 'size 16 Root.NW center is 4,4');
	ok(quad.NE.NE.absoluteCenterX === 14
		&& quad.NE.NE.absoluteCenterY === 2, 'size 16 Root.NE.NE center is 14,2');
});


test('getBorderQuad', function() {
	var directions = CPPN.Quadtree.Direction,
		quad = createTree(16);
	quad.divide();
	quad.NE.divide();
	quad.SE.divide();
	quad.SW.divide();
	quad.NW.divide();

	// Test N
	ok(!quad.getBorderQuad(directions.N), 'Root has no north');
	ok(!quad.NE.getBorderQuad(directions.N), 'Root.NE has no north');
	ok(!quad.NW.getBorderQuad(directions.N), 'Root.NW has no north');
	ok(quad.SE.getBorderQuad(directions.N) === quad.NE, 'north(Root.SE) is Root.NE');
	ok(quad.SW.getBorderQuad(directions.N) === quad.NW, 'north(Root.SW) is Root.NW');
	ok(quad.SE.NE.getBorderQuad(directions.N) === quad.NE.SE,
		'north(Root.SE.NE) is Root.NE.SE');

	// Test S
	ok(!quad.getBorderQuad(directions.S), 'Root has no south');
	ok(!quad.SE.getBorderQuad(directions.S), 'Root.SE has no south');
	ok(!quad.SW.getBorderQuad(directions.S), 'Root.SW has no south');
	ok(quad.NE.getBorderQuad(directions.S) === quad.SE, 'north(Root.NE) is Root.SE');
	ok(quad.NW.getBorderQuad(directions.S) === quad.SW, 'north(Root.NW) is Root.SW');
	ok(quad.NE.SE.getBorderQuad(directions.S) === quad.SE.NE,
		'south(Root.NE.SE) is Root.SE.NE');

	// Test E
	ok(!quad.getBorderQuad(directions.E), 'Root has no east');
	ok(!quad.NE.getBorderQuad(directions.E), 'Root.NE has no East');
	ok(!quad.SE.getBorderQuad(directions.E), 'Root.SE has no East');
	ok(quad.NW.getBorderQuad(directions.E) === quad.NE, 'north(Root.NW) is Root.NE');
	ok(quad.SW.getBorderQuad(directions.E) === quad.SE, 'north(Root.SW) is Root.SE');
	ok(quad.SW.NE.getBorderQuad(directions.E) === quad.SE.NW,
		'east(Root.SW.NE) is Root.SE.NW');

	// Test W
	ok(!quad.getBorderQuad(directions.W), 'Root has no west');
	ok(!quad.NW.getBorderQuad(directions.W), 'Root.NW has no West');
	ok(!quad.SW.getBorderQuad(directions.W), 'Root.SW has no west');
	ok(quad.NE.getBorderQuad(directions.W) === quad.NW, 'north(Root.NE) is Root.NW');
	ok(quad.SE.getBorderQuad(directions.W) === quad.SW, 'north(Root.SE) is Root.SW');
	ok(quad.SE.NW.getBorderQuad(directions.W) === quad.SW.NE,
		'west(Root.SE.NW) is Root.SW.NE');
});

test('render', function() {
	var size = 16;
	ok(createTree(size).render().width === size, 'Renders same size canvas');
});

function createTree(size) {
	var canvas = CPPN.Utils.createCanvas(size, size);
	return new CPPN.Quadtree(canvas);
}
