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

		const customApiBuilder = (options = {}) => wire.wireApi.get({}, options);

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

	pushDenomralization(event) {
		this.push(event.toNew(false, {
			type: this.Event.EVENT_TYPES.DENORMALIZED_DOMAIN,
			readmodel: {
				type: this.type,
			},
		}));
	}

	replay(konzola) {
		return this._replayEvents(konzola);
	}

	async clear() {
		return this.denormalizer.clear();
	}

	// perfect example for what callback hell looks like.
	async _replayEvents(konzola) {
		return new Promise(async (resolve, reject) => {
			let progress;

			if (konzola)
				progress = konzola.progress({ total: await this.eventstore.getReplay({}).count(), text: `Rebuilding ${this.type}` });


			await this.denormalizer.clear();
			const eventsStream = this.eventstore.getReplay({});
			const replayStream = this.denormalizer.getReplayStream({ progress });

			return pipeline(eventsStream, replayStream, (err) => {
				if (progress) {
					const stats = replayStream.getStats();
					progress.done(`${this.type} rebuild ${stats.all.count} events in ${stats.all.took}ms.`);
					Object.entries(stats).filter(([key]) => key !== 'all').sort(([, time1], [, time2]) => time2.avg - time1.avg).slice(0, 10)
						.forEach(([fullname, s]) => konzola.info(`[${fullname}]: ${s.count} events, avg: ${Number.parseFloat(s.avg).toFixed(2)}ms, max: ${s.max}ms.`));
				}

				if (err)
					return reject(err);
				return resolve();
			});
		});
	}


	// perfect example for what callback hell looks like.
	async getReplayStream(emitter) {
		// const progress = konzola.progress({ total: 1000, text: `Rebuilding ${this.type}` });
		const stream = this.denormalizer.getReplayStream({ emitter });
		return {
			stream,
			done: () => {
				emitter.done();
			},
		};
	}

	async _getReplayStream() {
		await this.denormalizer.clear();
		return this.denormalizer.getReplayStream();
		/*
		return new Promise(async (resolve, reject) => {
			let progress;

			if (konzola)
				progress = konzola.progress({ total: await this.eventstore.getReplay({}).count(), text: `Rebuilding ${this.type}` });


			await this.denormalizer.clear();
			const eventsStream = this.eventstore.getReplay({});
			const replayStream = this.denormalizer.getReplayStream({ progress });

			return pipeline(eventsStream, replayStream, (err) => {
				if (progress) {
					const stats = replayStream.getStats();
					progress.done(`${this.type} rebuild ${stats.all.count} events in ${stats.all.took}ms.`);
					Object.entries(stats).filter(([key]) => key !== 'all').sort(([, time1], [, time2]) => time2.avg - time1.avg).slice(0, 10)
						.forEach(([fullname, s]) => konzola.info(`[${fullname}]: ${s.count} events, avg: ${Number.parseFloat(s.avg).toFixed(2)}ms, max: ${s.max}ms.`));
				}

				if (err)
					return reject(err);
				return resolve();
			});
		});
		*/
	}

	async _transform(evt, _, done) {
		if (evt.name === 'commandRejected') {
			evt.ack();
			done(null);
			return;
		}

		const { event, error } = await this.denormalizer.handle(evt);
		evt.ack();
		done(null);
		this.pushDenomralization(event);
		if (error)
			this.app.services.getLogger().error(error, `Denormalizer ${this.type} Error`);
	}
};
