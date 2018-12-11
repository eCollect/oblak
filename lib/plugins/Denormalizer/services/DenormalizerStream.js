'use strict';

const path = require('path');

const { pipeline } = require('stream');

const ListDenormalizer = require('../lib/OblakDenormalizer');

const { OblakTransform } = require('../../shared/streams');
const repositoryOptions = require('../../shared/storeOptions');

module.exports = class DenormalizerStream extends OblakTransform {
	constructor(app, oblak, type) {
		super(app);
		this.Notification = app.Notification;
		this.Event = app.Event;
		this.type = type;
	}

	async init(oblak, wire) {
		this.eventstore = wire.eventstore;

		const repository = repositoryOptions(this.app.config.denormalizers[this.type], this.app);

		const customApiBuilder = () => wire.wireApi.get();

		this.denormalizer = new ListDenormalizer(
			this.app,
			{
				type: this.type,
				repository,
				denormalizerPath: path.join(oblak.paths.readmodels, this.type),
				customApiBuilder,
			},
		);

		await this.denormalizer.onNotification(n => this.pushNotification(n)).init();
	}

	pushNotification(notification) {
		notification.readmodel.type = this.type;
		notification.readmodel.id = notification.payload.id;
		notification.type = this.Event.EVENT_TYPES.DENORMALIZER;
		return this.push(new this.Event(notification));
	}

	replay() {
		return this._replayEvents();
	}

	async clear() {
		return this.denormalizer.clear();
	}

	// perfect example for what callback hell looks like.
	async _replayEvents() {
		return new Promise(async (resolve, reject) => {
			await this.denormalizer.clear();
			const eventsStream = this.eventstore.getReplay({});
			const replayStream = this.denormalizer.getReplayStream();

			return pipeline(eventsStream, replayStream, (err) => {
				if (err)
					return reject(err);
				return resolve();
			});
		});
	}

	async _transform(evt, _, done) {
		if (evt.name === 'commandRejected') {
			evt.ack();
			done(null);
			return;
		}

		const { error } = await this.denormalizer.handle(evt);
		evt.ack();
		done(null);
		if (error)
			this.app.services.getLogger().error(error, `Denormalizer ${this.type} Error`);
	}
};
