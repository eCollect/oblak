'use strict';

const Domain = require('../plugins/Domain');
const Denormalizer = require('../plugins/Denormalizer');
const Rest = require('../plugins/Gateways/Rest');
const Spa = require('../plugins/Gateways/Spa');
const Saga = require('../plugins/Saga');

module.exports = (rootPath = process.cwd()) => {
	// circular dependency resolution
	const Oblak = require('../Oblak'); // eslint-disable-line

	const app = new Oblak({
		rootPath,
	});

	app.use(new Denormalizer());
	app.use(new Domain());
	app.use(new Saga());
	app.use(new Rest());
	app.use(new Spa());

	return app;
};
