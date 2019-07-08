'use strict';

const cqrsDomain = require('cqrs-domain');
const builder = require('cqrs-swissknife/domain/builder');

const { promisify } = require('util');

const commandExtender = require('./commandExtender');
const { OblakTransform } = require('../shared/streams');
const storeOptions = require('../shared/storeOptions');
const buildApi = require('./api/buildApi');
const seriliazeError = require('../../utils/serializeError');


module.exports = class DomainStream extends OblakTransform {
	init({ domain, validationService }, wire) {
		const eventStore = storeOptions(this.app.config.eventStore, this.app);

		const domainApi = buildApi(this, wire, { domain });

		this.commandExtender = commandExtender.build({ domain }, domainApi);

		this.cqrsDomain = cqrsDomain({
			eventStore,
			domainPath: domain,
			structureLoader: ({ domainPath, definitions }, callback) => builder(domainPath, {
				...definitions,
				validatorFunctionBuilder: async (schema) => {
					const fn = await validationService.getValidatorFunction(schema);
					return ({ payload }) => fn(payload);
				},
			}, domainApi).then(t => callback(null, t), callback),
		})
			.defineCommand(this.app.Command.definition())
			.defineEvent(this.app.Event.definition());

		this.cqrsDomain.on('disconnect', e => this.emit('disconnect', e));
		const init = promisify(this.cqrsDomain.init.bind(this.cqrsDomain));
		return init();
	}

	publishEvent(evt) {
		const event = new this.app.Event({ type: this.app.Event.EVENT_TYPES.DOMAIN, ...evt });
		this.push(event);
	}

	async _transform(command, _, done) {
		this.push(this.app.events.commandReceived(command));

		// extendCommand
		await this.commandExtender.extend(command);

		// serialize Command
		const serializedCommand = command.serialize();

		this.cqrsDomain.handle(serializedCommand, (error, events) => {
			if (error) {
				this.app.services.getLogger().error(error, `Command [${command.fullname}(${command.aggregate.id ? command.aggregate.id : 'NEW'}) ] Error`);
				this.push(this.app.events.commandRejected(command, seriliazeError(error.more || error)));
				command.reject(error.more || error);
				return; // Handle error
			}
			command.ack();
			events.sort((a, b) => a.aggregate.revision - b.aggregate.revision).map(e => this.publishEvent(e));
		});
		done(null);
	}

	// use with care
	clear() {
		return promisify(this.cqrsDomain.eventStore.store.clear.bind(this.cqrsDomain.eventStore.store))();
	}
};
