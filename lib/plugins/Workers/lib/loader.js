'use strict';

const fs = require('fs');
const path = require('path');

const { firstFilenamePart } = require('../../../utils/fs');

// const denormalizerBuilder = require('./denormalizerBuilder');

const loadWrokers = (collectionsDirectory, options) => {
	const workers = {};

	fs.readdirSync(collectionsDirectory).forEach((collectionName) => {
		const workerFile = path.join(collectionsDirectory, collectionName);

		if (!fs.statSync(workerFile).isFile() || path.extname(workerFile) !== '.js')
			return;

		const basename = firstFilenamePart(workerFile);

		const workerConfig = options[basename];

		if (!workerConfig || workerConfig.enabled === false)
			return;

		if (workers[basename])
			throw new Error(`Duplicate worker: [${basename}] in: ${workerFile} and ${workers[basename].path}.`);

		workers[basename] = {
			path: workerFile,
			config: workerConfig,
		};
	});

	return workers;
};

module.exports = (workersDirectory, options) => loadWrokers(workersDirectory, options);
