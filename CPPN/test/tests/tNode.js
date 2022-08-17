/**
 * Node Tests
 **/

module('Node');

test('copy', function() {
	var node = new CPPN.Node(CPPN.Node.Type.Hidden);
	var copy = node.copy();

	ok(node !== copy, 'Copy not the same object as original');
	ok(node.id === copy.id, 'Same id');
	ok(node.type === copy.type, 'Same type');
	ok(node.activationFunctionIndex === copy.activationFunctionIndex,
		'Same activationFunctionIndex');
});
