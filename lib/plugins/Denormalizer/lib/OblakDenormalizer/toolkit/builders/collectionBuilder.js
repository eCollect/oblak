'use strict';

const viewModelBuilder = require('./reactionBuilder');

const addViewModelToCollection = (collection, {
	eventFullName, actions, identifier, customApiBuilder, settings
}) => {
	collection.addReaction(eventFullName, actions, identifier, settings);
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
