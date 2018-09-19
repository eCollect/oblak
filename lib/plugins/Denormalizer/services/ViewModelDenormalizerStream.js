'use strict';

const { promisify } = require('util');
const path = require('path');

const builder = require('cqrs-swissknife/denormalizer/builder');
const denormalizer = require('cqrs-eventdenormalizer');
const eventstore = require('eventstore');

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
		const eventStoreOptions = repositoryOptions(this.app.config.eventStore, this.app);
		this.eventstore = eventstore(eventStoreOptions);

		const repository = repositoryOptions(this.app.config.denormalizers[this.type], this.app);

		const denormalizerApi = () => wire.wireApi.get();

		this.denormalizer = denormalizer({
			repository,
			denormalizerPath: path.join(oblak.paths.readmodels, this.type),
			structureLoader: ({ denormalizerPath, definitions }) => ({
				collections: Object.values(builder(denormalizerPath, definitions, denormalizerApi)),
			}),
		}).defineEvent(this.app.Event.definition()).defineNotification(this.app.Event.definition());

		this.denormalizer.on('disconnect', e => this.emit('disconnect', e));
		// await this._replayEvents();
		const init = promisify(this.denormalizer.init.bind(this.denormalizer));
		await init();
		// return init();
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

	replay() {
		return this._replayEvents();
	}

	// use with care
	clear() {
		return promisify(this.denormalizer.clear.bind(this.denormalizer))();
	}

	// perfect example for what callback hell looks like.
	async _replayEvents() {
		return new Promise((resolve, reject) => {
			this.eventstore.store.connect((error) => {
				if (error)
					return reject(error);
				return this.denormalizer.clear((erro) => {
					if (erro)
						return reject(erro);
					return this.denormalizer.replayStreamed((replay, done) => {
						const s = this.eventstore.streamEvents({});
						s.on('error', e => reject(e)); // error
						s.on('data', e => replay(e.payload)); // event
						s.on('end', () => done((err) => {
							if (err)
								return reject(err);
							return this.eventstore.store.disconnect(() => resolve());
						}));
					});
				});
			});
		});
	}


	_transform(evt, _, done) {
		const serializedEvent = evt.serialize();
		this.denormalizer.handle(serializedEvent, (error, event, notifications = []) => {
			evt.ack();
			if (error)
				return this.app.services.getLogger().error(error, `Denormalizer ${this.type} Error`);

			this.pushDenomralization(evt);
			return notifications.map(n => this.pushNotification(n));
		});
		done(null);
	}
};
