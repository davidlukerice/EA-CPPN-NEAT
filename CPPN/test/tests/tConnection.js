/**
 * Connection Tests
 **/

module('Connection');

test('copy', function() {
	var inNode = new CPPN.Node(CPPN.Node.Type.Input);
	var outNode = new CPPN.Node(CPPN.Node.Type.Hidden);
	var conn = new CPPN.Connection(inNode, outNode, 0.5);
	var connCopy = conn.copy();


	ok(inNode !== connCopy.inNode
		&& outNode !== connCopy.outNode, 'coppied in/out nodes');
	ok(conn.innovationNumber === connCopy.innovationNumber,
		'same innovationNumber');
});