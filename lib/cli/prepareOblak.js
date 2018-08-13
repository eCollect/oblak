'use strict';

const moduleAlias = require('module-alias');
const path = require('path');

const Domain = require('../plugins/Domain');
const Denormalizer = require('../plugins/Denormalizer');
const Rest = require('../plugins/Gateways/Rest');
const Spa = require('../plugins/Gateways/Spa');
const Saga = require('../plugins/Saga');

module.exports = (Oblak, rootPath = process.cwd()) => {
	moduleAlias.addAlias('lib', path.join(rootPath, 'lib'));
	moduleAlias.addAlias('oblak-data', path.join(rootPath, 'oblak-data'));

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
