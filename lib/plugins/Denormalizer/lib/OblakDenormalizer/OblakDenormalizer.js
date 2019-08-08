'use strict';

const builder = require('./toolkit/builder');
const Collection = require('./Collection');

const EventSequencer = require('./EventSequencer');
const ReplayStream = require('./ReplayStream');
const HandleContext = require('./HandleContext');

const ListModelStore = require('../../../shared/ReadmodelsStore');

const handleEvent = require('./handleEvent');
const handleReplay = require('./handleReplay');

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
		this._collections = Object.values(builder(denormalizerPath, { Collection }, customApiBuilder));

		this.callbacks = {
			notification: () => {},
		};

		this.operations = {
			getReplay: () => {},
			getReplayStream: collections => new ReplayStream(this, collections),
		};

		this.type = type;
		this.modelStore = ListModelStore.getTypedStore(app, repository, true);
		this.eventSequencer = new EventSequencer();
		this.apiBuilder = customApiBuilder;
	}

	onNotification(clb = () => {}) {
		this.callbacks.notification = clb;
		return this;
	}

	getReplay(op = () => {}) {
		this.operations.getReplay = op;
		return this;
	}

	async init() {
		await this.modelStore.init(this._collections);
		await Promise.all(this._collections.map(async (collection) => {
			// prepare sequencer
			this.eventSequencer.registerModel(this.type, collection.name, { position: 0, id: null });
			const lastEventData = await this.modelStore.getLastEventData(collection.name);
			if (!lastEventData || !lastEventData._oblak || !lastEventData._oblak.event)
				return;

			this.eventSequencer.updatePosition(this.type, collection.name, lastEventData._oblak.event);
		}));
		return this;
	}

	async clear() {
		await this.modelStore.clear();
		this._collections.map(collection => this.eventSequencer.registerModel(this.type, collection.name, { position: 0, id: null }, true));
	}

	async handle(event) {
		const context = new HandleContext(event, this, { isReplay: false });
		await Promise.all(this._collections.map(collection => handleEvent(collection, context, this)));

		return {
			event,
			notifications: context.notifications,
			error: context.getError(),
		};
	}

	async replay(event, collections = this._collections, modelStore) {
		const context = new HandleContext(event, this, { isReplay: true });
		await Promise.all(collections.map(collection => handleReplay(collection, context, this, modelStore)));

		return {
			event,
			notifications: context.notifications,
			error: context.getError(),
		};
	}

	getReplayStream({ collections, emitter }) {
		return new ReplayStream(this, collections, { emitter });
	}
};
