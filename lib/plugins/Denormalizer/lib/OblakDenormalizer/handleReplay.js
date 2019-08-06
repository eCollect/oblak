'use strict';

module.exports = async (
	collection,
	context,
	{
		eventSequencer,
		modelStore,
		apiBuilder,
	},
	readModelStore = modelStore,
) => {
	try {
		await collection.handle(readModelStore, apiBuilder, context);

		if (context.hasPersistance)
			eventSequencer.updatePosition(context.type, collection.name, context.currentEventData);

		return context;
	} catch (e) {
		context.error(e);
		return context;
	}
};
