'use strict';

const builder = require('./toolkit/builder');
const Collection = require('./Collection');

const EventSequencer = require('./EventSequencer');
const ReplayStream = require('./ReplayStream');
const HandleContext = require('./HandleContext');

const ListModelStore = require('../../../shared/ReadmodelsStore');

const handleEvent = require('./handleEvent');

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
		this.type = type;
		this.modelStore = ListModelStore.getTypedStore(app, repository, true);
		this.eventSequencer = new EventSequencer();
		this.apiBuilder = customApiBuilder;
	}

	onNotification(clb = () => {}) {
		this.callbacks.notification = clb;
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
		this._collections.map(collection => this.eventSequencer.updatePosition(this.type, collection.name, { position: 0, id: null }));
	}

	async handle(evt, isReplay = false) {
		const context = new HandleContext(evt, this, { isReplay });
		await Promise.all(this._collections.map(collection => handleEvent(collection, context, this)));

		return {
			evt,
			notifications: context.notifications,
			error: context.getError(),
		};
	}

	getReplayStream() {
		return new ReplayStream(this);
	}
};
