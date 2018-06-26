'use strict';

const { promisify } = require('util');
const path = require('path');

const builder = require('cqrs-swissknife/saga/builder');
const cqrsSaga = require('cqrs-saga');

const storeOptions = require('../shared/storeOptions');

const { OblakTransfrom } = require('../shared/streams');

const flattenSagas = sagas => Object.values(sagas).reduce((arr, sagasArray) => [...arr, ...sagasArray], []);

module.exports = class SagaStream extends OblakTransfrom {
	constructor(app, wire) {
		super(app);
		this.Event = app.Event;
		this.wire = wire;
	}

	init(oblak) {
		const sagaStore = storeOptions(this.app.config.sagas, this.app);

		const sagaApiBuilder = ({ metadata }, saga) => this.wire.wireApi.get(metadata, saga);

		this.processManager = cqrsSaga({
			sagaStore,
			sagaPath: path.join(oblak.paths.sagas),
			structureLoader: ({ definitions }) => flattenSagas(builder({ [this.wire.sagaName]: oblak.sagas[this.wire.sagaName] }, definitions, sagaApiBuilder)),
		}).defineEvent(this.app.Event.definition()).defineCommand(this.app.Command.definition());

		this.processManager.on('disconnect', e => this.emit('disconnect', e));

		this.processManager.onCommand((cmd, next) => this.wire.addCommandToSend(cmd).then(next));

		const init = promisify(this.processManager.init.bind(this.processManager));
		return init();
	}

	_transform(evt, _, done) {
		const serializedEvent = evt.serialize();
		this.processManager.handle(serializedEvent, () => evt.ack());
		done(null);
	}
};
