'use strict';

const dotty = require('dotty');

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

// ie writable part
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

	async handle(listModelStore, apiBuilder, context) {
		if (!(context.domainEvent.fullname in this._reactions))
			return;

		// get settings from viewBuilder
		const { query, actions } = this._reactions[context.domainEvent.fullname];
		// retrive existing model
		// const id = identifier(context.domainEvent);

		const baseQuery = query(context.domainEvent);
		const modelStream = listModelStore.find(this.name, buildQuery(baseQuery)).stream();
		const createNew = typeof baseQuery === 'string';

		// build api
		const api = apiBuilder();

		const lastEventData = {
			id: context.domainEvent.id,
			position: context.domainEvent.metadata.position,
		};


		let handled = 0;

		for await (const model of modelStream) {
			const id = model._id;
			const vm = new ViewModel({ id, attributes: model || this.initialState, exists: !!model });
			handled += 1;
			handleVidemodel(context, listModelStore, this.name, actions, api, lastEventData, vm);
		}

		if (!handled && createNew)
			handleVidemodel(context, listModelStore, this.name, actions, api, lastEventData, new ViewModel({ baseQuery, attributes: this.initialState, exists: false }));

		// handleVidemodel(baseQuery, new ViewModel({ baseQuery, attributes: this.initialState, exists: false }));

		// prepare view model
		// const vm = new ViewModel({ id, attributes: model || this.initialState, exists: !!model });

		// execute actions async in order

		// set _oblakSettings

		// save the viewmodel and get the new payload

	}
};
