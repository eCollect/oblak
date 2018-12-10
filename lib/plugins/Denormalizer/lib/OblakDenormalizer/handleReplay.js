'use strict';

module.exports = async (
	collection,
	context,
	{
		eventSequencer,
		modelStore,
		apiBuilder,
	},
) => {
	try {
		await collection.handle(modelStore, apiBuilder, context);

		if (context.hasPersistance)
			eventSequencer.updatePosition(context.type, collection.name, context.currentEventData);

		return context;
	} catch (e) {
		context.error(e);
		return context;
	}
};
