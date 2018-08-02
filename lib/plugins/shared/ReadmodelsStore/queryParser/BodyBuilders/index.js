'use strict';

const BodyBuilder = require('./BodyBuilder');
const ElasticBodyBuilder = require('./ElasticBodyBuilder');
const MongoBodyBuilder = require('./MongoBodyBuilder');

const bodyMapping = [
	{
		aliases: ['mongo', 'mongodb'],
		builder: MongoBodyBuilder,
	},
	{
		aliases: ['es', 'elastic', 'elasticsearch'],
		builder: ElasticBodyBuilder,
	},
].reduce((mapping, biulderDef) => {
	biulderDef.aliases.forEach((a) => {
		mapping[a] = biulderDef.builder;
	});
	return mapping;
}, {});


const getBody = (body) => {
	if (!body)
		throw new Error('No bodybuilder type specified');
	if (body instanceof BodyBuilder)
		return body;
	if (typeof body === 'string' && body in bodyMapping)
		return new bodyMapping[body]();
	throw new Error('Unknown BodyBuilder type');
};

module.exports = {
	ElasticBodyBuilder,
	MongoBodyBuilder,
	getBody,
};
