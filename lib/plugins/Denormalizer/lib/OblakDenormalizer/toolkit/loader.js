'use strict';

const fs = require('fs');
const path = require('path');

const { firstFilenamePart } = require('../../../../../utils/fs');

// const denormalizerBuilder = require('./denormalizerBuilder');

const loadCollections = (collectionsDirectory) => {
	const collections = {};

	fs.readdirSync(collectionsDirectory).forEach((collectionName) => {
		const collectionFile = path.join(collectionsDirectory, collectionName);


		if (!fs.statSync(collectionFile).isFile() || path.extname(collectionFile) !== '.js')
			return;

		const basename = firstFilenamePart(collectionFile);

		if (collections[basename])
			throw new Error(`Duplicate readmodel: [${basename}] in: ${collectionFile} and ${collections[basename].path}.`);

		collections[basename] = {
			path: collectionFile,
		};
	});

	return collections;
};

module.exports = (collectionsDirectory, options) => loadCollections(collectionsDirectory, options);
