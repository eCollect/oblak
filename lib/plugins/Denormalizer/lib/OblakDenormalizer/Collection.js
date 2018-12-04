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

	addReaction(eventFullName, actions, identifier, settings) {
		this._reactions[eventFullName] = {
			identifier,
			actions,
			settings,
		};
	}

	async handle(listModelStore, apiBuilder, context) {
		if (!(context.domainEvent.fullname in this._reactions))
			return;

		// get settings from viewBuilder
		const { identifier, actions } = this._reactions[context.domainEvent.fullname];
		// retrive existing model
		const id = identifier(context.domainEvent);
		const model = await listModelStore.findOne(this.name, id);
		// prepare view model
		const vm = new ViewModel({ id, attributes: model || this.initialState, exists: !!model });
		// build api
		const api = apiBuilder();

		// execute actions async in order
		for (const action of actions)
			await action(context.domainEvent, vm, api);

		const lastEventData = {
			id: context.domainEvent.id,
			position: context.domainEvent.metadata.position,
		};

		// set _oblakSettings
		dotty.put(vm.attributes, '_oblak.event', lastEventData);

		// save the viewmodel and get the new payload
		const { value, lastErrorObject } = await listModelStore.saveViewmodel(this.name, vm);

		if (lastErrorObject.n !== 1)
			throw ConcurrencyError.fromContext(context, this);

		createNotification(vm.operation, this.name, id, value);
	}
};
