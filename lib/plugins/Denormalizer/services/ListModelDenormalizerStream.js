'use strict';

const path = require('path');

const ListDenormalizer = require('../lib/ListDenormalizer');

// const eventstore = require('eventstore');

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
		/*
		const eventStoreOptions = repositoryOptions(this.app.config.eventStore, this.app);
		this.eventstore = eventstore(eventStoreOptions);
		*/

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


	async clear() {
		return this.denormalizer.clear();
	}

	_transform(evt, _, done) {
		this.denormalizer.handle(evt).then(() => {
			evt.ack();
		}, (e) => {
			evt.reject();
		});
		done(null);
	}
};
