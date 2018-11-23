'use strict';

const viewModelBuilder = require('./reactionBuilder');

const addViewModelToCollection = (collection, { eventFullName, action }) => {
	collection.addReaction(eventFullName, action);
	return collection;
};

module.exports = (
	collectionName,
	{
		reactions = {}, repositorySettings = {}, identity = {}, initialState = {},
	},
	{
		Collection,
		...definitions
	},
	customApiBuilder,
) => Object.entries(reactions).reduce(
	(collection, [eventFullName, reaction]) => addViewModelToCollection(collection, viewModelBuilder({ eventFullName, reaction, identifier: identity[eventFullName] }, definitions, customApiBuilder)),
	new Collection({
		name: collectionName,
		repositorySettings,
	}, initialState),
);
