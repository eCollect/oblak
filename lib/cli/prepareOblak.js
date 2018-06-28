'use strict';

const Domain = require('../plugins/Domain');
const Denormalizer = require('../plugins/Denormalizer');
const Rest = require('../plugins/Rest');
const Saga = require('../plugins/Saga');
const Spa = require('../plugins/Spa');

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
