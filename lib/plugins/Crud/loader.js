'use strict';

const fs = require('fs');
const path = require('path');

const loadCollections = (collectionsDirectory) => {
	const collections = {};

	fs.readdirSync(collectionsDirectory).forEach((collectionName) => {
		const collectionFile = path.join(collectionsDirectory, collectionName);


		if (!fs.statSync(collectionFile).isFile() || path.extname(collectionFile) !== '.js')
			return;


		collections[path.basename(collectionName, '.js')] = {
			path: collectionFile,
		};
	});

	return collections;
};

const loadCrud = (CRUDsDirectory, { crud, ...options } = {}) => {
	const CRUDs = {};

	fs.readdirSync(CRUDsDirectory).forEach((crudName) => {
		if (!(crudName in crud))
			return;

		const crudDirectory = path.join(CRUDsDirectory, crudName);

		if (!fs.statSync(crudDirectory).isDirectory())
			return;

		CRUDs[crudName] = {
			collections: loadCollections(crudDirectory, options),
			settings: {
				...crud[crudName],
				...options[crud[crudName].type],
			},
		};
	});

	return CRUDs;
};


module.exports = (collectionsDirectory, options) => loadCrud(collectionsDirectory, options);
