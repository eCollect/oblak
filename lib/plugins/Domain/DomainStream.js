'use strict';

const cqrsDomain = require('cqrs-domain');
const builder = require('node-cqrs-toolkit/domain/builder');

const { promisify } = require('util');

const { OblakTransfrom } = require('../shared/streams');
const storeOptions = require('../shared/storeOptions');


module.exports = class DomainStream extends OblakTransfrom {
	init({ domain }) {
		const eventStore = storeOptions(this.app.config.eventStore, this.app);

		this.cqrsDomain = cqrsDomain({
			eventStore,
			domainPath: domain,
			structureLoader: ({ domainPath, definitions }, callback) => builder(domainPath, definitions).then(t => callback(null, t), callback),
		}).defineCommand(this.app.Command.definition()).defineEvent(this.app.Event.definition());

		this.cqrsDomain.on('disconnect', e => this.emit('disconnect', e));
		const init = promisify(this.cqrsDomain.init.bind(this.cqrsDomain));
		return init();
	}

	_transform(command, _, done) {
		this.push(this.app.events.commandRecived(command));
		const serializedCommand = command.serialize();
		this.cqrsDomain.handle(serializedCommand, (error, events) => {
			if (error) {
				command.nack();
				return; // Handle error
			}
			command.ack();
			events.map(e => this.push(new this.app.Event({ type: this.app.Event.EVENT_TYPES.DOMAIN, ...e })));
		});
		done(null);
	}
};
