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

const loadCrud = (crudsDirectory, { crud, ...options } = {}) => {
	const cruds = {};

	fs.readdirSync(crudsDirectory).forEach((crudName) => {
		if (!(crudName in crud))
			return;

		const crudDirectory = path.join(crudsDirectory, crudName);

		if (!fs.statSync(crudDirectory).isDirectory())
			return;

		cruds[crudName] = {
			collections: loadCollections(crudDirectory, options),
			settigns: {
				...crud[crudName],
				...options[crud[crudName].type],
			},
		};
	});

	return cruds;
};


module.exports = (collectionsDirectory, options) => loadCrud(collectionsDirectory, options);
