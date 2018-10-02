'use strict';

const builder = require('./toolkit/builder');
const Collection = require('./Collection');

const EventSequencer = require('./EventSequencer');

const ListModelStore = require('../../../shared/ReadmodelsStore');

module.exports = class ListDenormalizer {
	constructor(
		app,
		{
			type,
			repository,
			denormalizerPath,
			customApiBuilder,
		},
	) {
		this._onNotification = () => {};
		this._collections = builder(denormalizerPath, { Collection }, customApiBuilder);
		this._listModelStore = ListModelStore.getTypedStore(app, repository, true);
		this._eventSequencer = new EventSequencer();
		this._type = type;
		this._handlers = null;
	}

	onNotification(clb = () => {}) {
		this._onNotification = clb;
		return this;
	}

	async init() {
		this._handlers = Object.values(this._collections).map(c => c.setStoreData({ eventSequencer: this._eventSequencer, type: this._type }).generateHandleFunction(this._listModelStore, this._onNotification));
		await this._listModelStore.init(this._collections);
		return this;
	}

	async clear() {
		return this._listModelStore.clear();
	}

	async handle(evt) {
		return Promise.all(this._handlers.map(h => h(evt)));
	}
};
