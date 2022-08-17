 
module( "Component: Dialog" );
// TODO: 

module( "PhaseManager" );
test( "nextPhase", function() {
	var manager = new PhaseManager();
	manager.nextPhase();
	ok( manager.currentPhaseIndex === 1, "increments phase" );

	manager.currentPhaseIndex = manager.phases.length-1;
	manager.nextPhase();
	ok( manager.currentPhaseIndex === manager.phases.length-1, 
		"stops on last phase" );
});
