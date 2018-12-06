'use strict';

// const dotty = require('dotty');
const { Writable } = require('stream');

const ViewModel = require('./ViewModel');
const ConcurrencyError = require('./errors/ConcurrencyError');

const deepClone = require('../../../../utils/deepClone');
const dotter = require('../../../../utils/dotter');

const HANDLE_BUFFER_SIZE = 16;

const createNotification = (operation, collection, id, payload = {}) => ({
	operation,
	collection,
	id,
	payload,
});

const buildQuery = (query) => {
	if (typeof query === 'string')
		return { __id: query };
	return query;
};

const handleVidemodel = async (context, listModelStore, name, actions, api, lastEventData, vm) => {
	for (const action of actions)
		await action(context.domainEvent, vm, api);
	// console.log('>>> '+chunk);
	dotter.set(vm.attributes, '_oblak.event', lastEventData);

	const { value, lastErrorObject } = await listModelStore.saveViewmodel(name, vm);

	if (lastErrorObject.n !== 1)
		throw ConcurrencyError.fromContext(context, this);

	createNotification(vm.operation, name, vm.id, value);
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

	_write(model, _, next) {
		const vm = new ViewModel({ id: model._id, attributes: model, exists: true });
		this._resultsCount += 1;
		this._viewmodelHandle(vm, next);
	}

	_final(next) {
		if (this._resultsCount || !this.createNewId)
			return next();
		const vm = new ViewModel({ id: this.createNewId, attributes: deepClone(this.initialState), exists: false });
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

	addReaction(eventFullName, actions, query, settings) {
		this._reactions[eventFullName] = {
			query,
			actions,
			settings,
		};
	}

	handle(listModelStore, apiBuilder, context) {
		return new Promise((resolve, reject) => {
			if (!(context.domainEvent.fullname in this._reactions))
				return resolve();

			// get settings from viewBuilder
			const { query, actions, settings } = this._reactions[context.domainEvent.fullname];
			// retrive existing model
			// const id = identifier(context.domainEvent);

			const baseQuery = query(context.domainEvent);
			const modelStream = listModelStore.find(this.name, buildQuery(baseQuery));

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
			return null;
		});
	}
};
