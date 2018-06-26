'use strict';

const { promisify } = require('util');
const path = require('path');

const builder = require('cqrs-swissknife/denormalizer/builder');
const denormalizer = require('cqrs-eventdenormalizer');

const { OblakTransform } = require('../shared/streams');

const repositoryOptions = require('../shared/storeOptions');

module.exports = class DenormalizerStream extends OblakTransform {
	constructor(app, oblak, type) {
		super(app);
		this.Notification = app.Notification;
		this.Event = app.Event;
		this.type = type;
	}

	init(oblak, wire) {
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

		const init = promisify(this.denormalizer.init.bind(this.denormalizer));
		return init();
	}

	pushNotification(notification) {
		notification.readmodel.type = this.type;
		notification.readmodel.id = notification.payload.id;
		notification.type = this.Event.EVENT_TYPES.DENORMALIZER;

		return this.push(new this.Event(notification));
	}

	_transform(evt, _, done) {
		const serializedEvent = evt.serialize();
		this.denormalizer.handle(serializedEvent, (error, event, notifications = []) => {
			evt.ack();
			notifications.map(n => this.pushNotification(n));
		});
		done(null);
	}
};
