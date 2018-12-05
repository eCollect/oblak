'use strict';

const viewModelBuilder = require('./reactionBuilder');

const addViewModelToCollection = (collection, {
	eventFullName, actions, query, settings,
}) => {
	collection.addReaction(eventFullName, actions, query, settings);
	return collection;
};

module.exports = (
	filename,
	collectionName,
	{
		reactions = {}, repositorySettings = {}, identity = {}, query = {}, initialState = {},
	},

	{
		Collection,
		...definitions
	},
	customApiBuilder,
) => Object.entries(reactions).reduce(
	(collection, [eventFullName, reaction]) => addViewModelToCollection(collection, viewModelBuilder(filename, {
		eventFullName, reaction, identifier: identity[eventFullName], query: query[eventFullName],
	}, definitions, customApiBuilder)),
	new Collection({
		name: collectionName,
		repositorySettings,
	}, initialState),
);
