'use strict';

const buildServices = services => Object.entries(services).reduce(
	(repository, [collectionName, collection]) => {
		/*
		const [ namespace, service ] = collectionName.split(/:(.+)/);
		if (service) {
			repository[namespace] = buildServices
			return repository;
		}
		*/
		const collectionFile = collection.path;
		repository[collectionName] = require(collectionFile); // eslint-disable-line
		return repository;
	},
	{},
);

module.exports = ({ services }) => buildServices(services);
