'use strict';

// const dotty = require('dotty');
const { Writable } = require('stream');

const ViewModel = require('./ViewModel');

const ConcurrencyError = require('./errors/ConcurrencyError');

const deepClone = require('../../../../utils/deepClone');
const dotter = require('../../../../utils/dotter');
const stream = require('../../../../utils/stream');

const HANDLE_BUFFER_SIZE = 16;

const createNotification = (operation, collection, id, payload = {}) => ({
	operation,
	collection,
	id,
	payload,
});

const buildQuery = (query) => {
	if (typeof query === 'string')
		return { query: { _id: query }, id: query };
	return { query };
};

const handleVidemodel = async (context, listModelStore, name, actions, api, lastEventData, vm) => {
	for (const action of actions)
		await action(context.domainEvent, vm, api);
	// console.log('>>> '+chunk);

	dotter.set(vm.attributes, '_oblak.event', lastEventData);

	const { value, concurrencyError } = await listModelStore.saveViewmodel(name, vm);

	if (concurrencyError)
		throw ConcurrencyError.fromContext(context, this);

	context.notify(createNotification(vm.operation, name, vm.id, value));
};

class HandleStream extends Writable {
	constructor({ name, initialState }, context, listModelStore, actions, api, createNewId) {
		super({ objectMode: true, highWaterMark: HANDLE_BUFFER_SIZE });

		const lastEventData = {
			id: context.domainEvent.id,
			position: context.domainEvent.metadata.position,
		};

		this._viewmodelHandle = (vm, next) => handleVidemodel(context, listModelStore, name, actions, api, lastEventData, vm)
			.then(() => next(), (e) => { context.error(e); next(); });

		this.initialState = initialState;
		this.createNewId = createNewId;

		this._resultsCount = 0;
	}

	_write(vm, _, next) {
		/*
		const vm = new ViewModel({
			id: model._id,
			attributes: model,
			exists: true,
			version: model.version,
		});
		*/

		this._resultsCount += 1;
		this._viewmodelHandle(vm, next);
	}

	_final(next) {
		if (this._resultsCount || !this.createNewId)
			return next();
		const vm = new ViewModel({
			id: this.createNewId, attributes: deepClone(this.initialState), exists: false, version: null,
		});
		return this._viewmodelHandle(vm, next);
	}
}

// ie writable part
module.exports = class Collection {
	constructor({
		name,
		repositorySettings,
	}, initialState = {}) {
		this.name = name;
		this.repositorySettings = repositorySettings;
		this.initialState = initialState;
		this._reactions = {};
	}

	addReaction(eventFullName, actions, query, settings, group = '__default__') {
		this._reactions[eventFullName] = this._reactions[eventFullName] || [];
		this._reactions[eventFullName].push({
			group,
			query,
			actions,
			settings,
		});
		/*
		this._reactions[eventFullName] = {
			query,
			actions,
			settings,
		};
		*/
	}

	async handle(listModelStore, apiBuilder, context) {
		if (!(context.domainEvent.fullname in this._reactions) || !this._reactions[context.domainEvent.fullname].length)
			return;

		// get settings from viewBuilder
		for (const { query, actions, settings } of this._reactions[context.domainEvent.fullname]) {
			// retrive existing model
			// const id = identifier(context.domainEvent);
			if (typeof settings.shouldHandleEvent === 'function' && !(await settings.shouldHandleEvent(context.domainEvent)))
				continue;

			const baseQuery = query(context.domainEvent);
			const findViewModelsOperation = await listModelStore.findViewmodel(this.name, buildQuery(baseQuery));
			const modelStream = findViewModelsOperation.stream();

			await stream.pipeline(
				modelStream,
				new listModelStore.ViewModelStream(ViewModel),
				new HandleStream(
					this,
					context,
					listModelStore,
					actions,
					apiBuilder({ readmodelStores: { [context.type]: listModelStore } }),
					settings.autoCreate && typeof baseQuery === 'string' ? baseQuery : null,
				),
			);
		}
		/*
		const handleStream = new HandleStream(
			this,
			context,
			listModelStore,
			actions,
			apiBuilder(),
			settings.autoCreate && typeof baseQuery === 'string' ? baseQuery : null,
		);

		modelStream.on('error', reject);
		handleStream.on('error', (error) => {
			modelStream.destroy();
			reject(error);
		});
		handleStream.on('finish', resolve);
		modelStream.pipe(handleStream);
		return null; */
	}
};
