'use strict';

const buildServices = services => Object.entries(services).reduce(
	(repository, [collectionName, collection]) => {
		const collectionFile = collection.path;
		repository[collectionName] = require(collectionFile); // eslint-disable-line
		return repository;
	},
	{},
);

module.exports = ({ services }) => buildServices(services);
