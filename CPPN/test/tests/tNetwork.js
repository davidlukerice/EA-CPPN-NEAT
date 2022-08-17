/**
 * Network Tests
 **/

module('Network');

test('copy', function() {
	var network = new CPPN.Network(2,3);
	var copy = network.copy();

	ok(network !== copy, 'Copy not the same object as original');
	ok(network.nodes[0] !== copy.nodes[0]
		&& network.nodes[0].id === copy.nodes[0].id,
		'first node a copy but not the same');
	ok(network.connections[0] !== copy.connections[0]
		&& network.connections[0].innovationNumber === copy.connections[0].innovationNumber,
		'first node a copy but not the same');
});
