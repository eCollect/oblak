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
		if (lastEventData.position >= context.currentEventData.position)
			return context.error(AlreadyDenormalizedError.fromContext(context, collection));

		const notfiticationData = await collection.handle(modelStore, apiBuilder, context);
		eventSequencer.updatePosition(type, collection.name, context.currentEventData);

		if (notfiticationData)
			context.notify(notfiticationData);

		return context;
	} catch (e) {
		context.error(e);
		return context;
	}
};
