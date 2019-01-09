'use strict';

const viewModelBuilder = require('./reactionBuilder');

const addViewModelToCollection = (collection,
	group,
	{
	eventFullName, actions, query, settings,
}) => {
	collection.addReaction(eventFullName, actions, query, settings, group);
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
	(collection, [eventFullNameAndGroup, reaction]) => {
		const [eventFullName, group = '__default__'] = eventFullNameAndGroup.split(':');

		return addViewModelToCollection(collection, group, viewModelBuilder(filename, {
			eventFullName, reaction, identifier: identity[eventFullNameAndGroup], query: query[eventFullNameAndGroup],
		}, definitions, customApiBuilder));
	},
	new Collection({
		name: collectionName,
		repositorySettings,
	}, initialState),
);
