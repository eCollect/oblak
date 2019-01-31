'use strict';

const { promisify } = require('util');

const pipeline = promisify(require('stream').pipeline);

const AlreadyDenormalizedError = require('./errors/AlreadyDenormalizedError');


module.exports = async (
	collection,
	context,
	denomralizer,
) => {
	const {
		eventSequencer,
		modelStore,
		apiBuilder,
	} = denomralizer;

	try {
		const lastEventData = eventSequencer.getModel(context.type, collection.name);
		const positionDelta = context.positionDelta(lastEventData);

		if (positionDelta < 1)
			return context.error(AlreadyDenormalizedError.fromContext(context, collection));

		// replay missing
		if (positionDelta > 1)
			await pipeline(
				denomralizer.getReplay({ fromPositon: context.lastEventData + 1, toPosition: lastEventData - 1 }),
				denomralizer.getReplayStream({ collections: [collection] }),
			);

		await collection.handle(modelStore, apiBuilder, context);

		if (context.hasPersistance)
			eventSequencer.updatePosition(context.type, collection.name, context.currentEventData);

		return context;
	} catch (e) {
		context.error(e);
		return context;
	}
};
