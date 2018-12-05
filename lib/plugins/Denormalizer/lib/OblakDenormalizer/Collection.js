'use strict';

const dotty = require('dotty');
const { Writable } = require('stream');

const ViewModel = require('./ViewModel');
const ConcurrencyError = require('./errors/ConcurrencyError');

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
	dotty.put(vm.attributes, '_oblak.event', lastEventData);

	const { value, lastErrorObject } = await listModelStore.saveViewmodel(name, vm);

	if (lastErrorObject.n !== 1)
		throw ConcurrencyError.fromContext(context, this);

	createNotification(vm.operation, name, vm.id, value);
};

class HandleStream extends Writable {
	constructor({ name, initialState }, context, listModelStore, actions, api, createNewId) {
		super();

		const lastEventData = {
			id: context.domainEvent.id,
			position: context.domainEvent.metadata.position,
		};

		this._viewmodelHandle = (vm, next) => handleVidemodel(context, listModelStore, name, actions, api, lastEventData, vm).then(() => next(), next);

		this.initialState = initialState;
		this.createNewId = createNewId;

		this._resultsCount = 0;
	}

	_write(model, _, next) {
		const vm = new ViewModel({ id: model.id, attributes: model || this.initialState, exists: !!model });
		this._resultsCount += 1;
		this._viewmodelHandle(vm, next);
	}

	_final(next) {
		if (!this.createNewId)
			return next();
		const vm = new ViewModel({ id: this.baseQuery, attributes: this.initialState, exists: false });
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
			const { query, actions } = this._reactions[context.domainEvent.fullname];
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
				typeof baseQuery === 'string' ? baseQuery : null,
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
