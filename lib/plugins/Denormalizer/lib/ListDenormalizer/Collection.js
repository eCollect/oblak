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
		this.name = name;
		this._repositorySettings = repositorySettings;
		this._reactions = {};
	}

	setStoreData({
		type,
		eventSequencer,
	}) {
		this.type = type;
		this._eventSequencer = eventSequencer;

		this._eventSequencer.registerModel({
			type,
			name: this.name,
			lastProcessedPosition: 0,
		});

		return this;
	}

	addReaction(reactionFullName, action) {
		this._reactions[reactionFullName] = action;
	}

	generateHandleFunction(listModelStore, onNotification) {
		return async (evt) => {
			const colelctionApi = new CollectionApi(this.name, listModelStore);

			if (evt.fullname in this._reactions)
				await this._reactions[evt.fullname](colelctionApi, evt);

			for (const op of colelctionApi._operations) {
				const operationResult = await op();
				if (operationResult.modifiedCount)
					onNotification(generateNotification(evt, this.name, operationResult));
			}

			await this._eventSequencer.updatePosition({
				type: this.type,
				name: this.name,
				position: evt.metadata.position,
			});
		};
	}
};
