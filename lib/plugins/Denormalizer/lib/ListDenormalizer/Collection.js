'use strict';

class CollectionApi {
	constructor(model, store) {
		this.model = model;
		this.store = store;
		this._operations = [];
	}

	add(data) {
		this._operations.push(() => this.store.handleOperationAdd(this.model, { data }));
	}

	remove(find) {
		this._operations.push(() => this.store.handleOperationRemove(this.model, { find }));
	}

	update(find, data) {
		this._operations.push(() => this.store.handleOperationUpdate(this.model, { find, data }));
	}
}

const generateNotification = (evt, collection, { operation, payload }) => ({
	...evt.serialize(),
	type: 'readmodel',
	name: operation,
	payload,
	readmodel: {
		collection,
	},
	event: {
		name: evt.name,
		id: evt.id,
	},
});

module.exports = class Collection {
	constructor({
		name,
		repositorySettings,
	}) {
		this._name = name;
		this._repositorySettings = repositorySettings;
		this._reactions = {};
	}

	addReaction(reactionFullName, action) {
		this._reactions[reactionFullName] = action;
	}

	generateHandleFunction(listModelStore, onNotification) {
		return async (evt) => {
			const colelctionApi = new CollectionApi(this._name, listModelStore);

			if (evt.fullname in this._reactions)
				await this._reactions[evt.fullname](colelctionApi, evt);

			for (const op of colelctionApi._operations) {
				const operationResult = await op();
				if (operationResult.modifiedCount)
					onNotification(generateNotification(evt, this._name, operationResult));
			}
		};
	}
};
