'use strict';

const { promisify } = require('util');
const path = require('path');

const builder = require('cqrs-swissknife/denormalizer/builder');
const denormalizer = require('cqrs-eventdenormalizer');

const { OblakTransfrom } = require('../shared/streams');

const repositoryOptions = require('./repositoryOptions');

module.exports = class DenormalizerStream extends OblakTransfrom {
	constructor(app, oblak, type) {
		super(app);
		this.Notification = app.Notification;
		this.Event = app.Event;
		this.type = type;
	}

	init(oblak) {
		const repository = repositoryOptions(this.app.config.denormalizers[this.type], this.app);

		this.denormalizer = denormalizer({
			repository,
			denormalizerPath: path.join(oblak.paths.readmodels, this.type),
			structureLoader: ({ denormalizerPath, definitions }) => ({
				collections: Object.values(builder(denormalizerPath, definitions)),
			}),
		}).defineEvent(this.app.Event.definition()).defineNotification(this.app.Event.definition());

		this.denormalizer.on('disconnect', e => this.emit('disconnect', e));

		const init = promisify(this.denormalizer.init.bind(this.denormalizer));
		return init();
	}

	_transform(evt, _, done) {
		const serializedEvent = evt.serialize();
		this.denormalizer.handle(serializedEvent, (error, event, notifications = []) => {
			evt.ack();
			notifications.map(n => this.push(new this.Event({ type: this.Event.EVENT_TYPES.DENORMALIZER, ...n })));
		});
		done(null);
	}
};
