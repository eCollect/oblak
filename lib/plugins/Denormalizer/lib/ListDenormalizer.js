'use strict';

const builder = require('./toolkit/builder');
const Collection = require('./Collection');

const ListModelStore = require('../../../shared/ReadmodelsStore');

module.exports = class ListDenormalizer {
	constructor(
		app,
		{
			repository,
			denormalizerPath,
			customApiBuilder,
		},
	) {
		this._onNotification = () => {};
		this._collections = builder(denormalizerPath, { Collection }, customApiBuilder);
		this._listModelStore = ListModelStore.getTypedStore(app, repository, true);
		this._handlers = null;
	}

	onNotification(clb = () => {}) {
		this._onNotification = clb;
		return this;
	}

	async init() {
		this._handlers = Object.values(this._collections).map(c => c.generateHandleFunction(this._listModelStore, this._onNotification));
		await this._listModelStore.init(this._collections);
		return this;
	}

	async handle(evt) {
		return Promise.all(this._handlers.map(h => h(evt)));
	}
};
