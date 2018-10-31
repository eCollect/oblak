'use strict';

const { promisify } = require('util');
const path = require('path');

const builder = require('cqrs-swissknife/saga/builder');
const cqrsSaga = require('cqrs-saga');

const storeOptions = require('../shared/storeOptions');

const { OblakTransform } = require('../shared/streams');

const flattenSagas = sagas => Object.values(sagas).reduce((arr, sagasArray) => [...arr, ...sagasArray], []);

module.exports = class SagaStream extends OblakTransform {
	constructor(app, wire) {
		super(app);
		this.Event = app.Event;
		this.wire = wire;
	}

	async init(oblak) {
		const sagaStore = storeOptions(this.app.config.sagas[this.wire.type], this.app);

		const sagaApiBuilder = ({ metadata }, saga) => this.wire.wireApi.get(metadata, saga);

		this.processManager = cqrsSaga({
			sagaStore,
			sagaPath: path.join(oblak.paths.sagas, this.wire.type),
			structureLoader: ({ definitions }) => flattenSagas(builder({ [`${[this.wire.type]}:${this.wire.sagaName}`]: oblak.sagas[this.wire.type].sagas[this.wire.sagaName] }, definitions, sagaApiBuilder)),
		}).defineEvent(this.app.Event.definition()).defineCommand(this.app.Command.definition());

		this.processManager.on('disconnect', e => this.emit('disconnect', e));

		this.processManager.onCommand((cmd, next) => this.wire.addCommandToSend(cmd).await().exec(next));

		const init = promisify(this.processManager.init.bind(this.processManager));


		await init();
		// const info = this.processManager.getInfo();
		this.logger = this.app.services.getLogger();
	}

	// use with extreme care
	async clear() {
		return promisify(this.processManager.sagaStore.clear.bind(this.processManager.sagaStore))();
	}

	_transform(evt, _, done) {
		const serializedEvent = evt.serialize();
		this.processManager.handle(serializedEvent, (errs) => {
			if (errs && errs[0].name !== 'AlreadyHandledError') {
				this.app.services.getLogger().error(errs, `Saga Handle Error ${this.wire.name}`);
				return evt.reject();
			}
			return evt.ack();
		});
		done(null);
	}
};
