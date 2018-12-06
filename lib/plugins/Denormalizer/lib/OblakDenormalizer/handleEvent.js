'use strict';

const AlreadyDenormalizedError = require('./errors/AlreadyDenormalizedError');

module.exports = async (
	collection,
	context,
	{
		type,
		eventSequencer,
		modelStore,
		apiBuilder,
	},
) => {
	try {
		const lastEventData = eventSequencer.getModel(type, collection.name);

		// Alredy denormalized
		if (context.isAlreadyDenormalized(lastEventData))
			return context.error(AlreadyDenormalizedError.fromContext(context, collection));

		await collection.handle(modelStore, apiBuilder, context);

		if (context.hasPersistance)
			eventSequencer.updatePosition(type, collection.name, context.currentEventData);

		return context;
	} catch (e) {
		context.error(e);
		return context;
	}
};
