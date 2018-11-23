'use strict';

const PayloadBuilder = require('./PayloadBuilder');
// const ElasticBodyBuilder = require('./ElasticBodyBuilder');
const MongoPayloadBuilder = require('./MongoPayloadBuilder');

const bodyMapping = [
	{
		aliases: ['mongo', 'mongodb'],
		builder: MongoPayloadBuilder,
	},
	/*
	{
		aliases: ['es', 'elastic', 'elasticsearch'],
		builder: ElasticBodyBuilder,
	},*/
].reduce((mapping, biulderDef) => {
	biulderDef.aliases.forEach((a) => {
		mapping[a] = biulderDef.builder;
	});
	return mapping;
}, {});


const methodsMapping = Object.getOwnPropertyNames(PayloadBuilder.prototype).reduce((r, method) => {
	if (method === 'constructor' || method === 'build')
		return r;
	r[`$${method}`] = method;
	r._default = 'set';
	return r;
}, {});

const getBody = (body) => {
	if (!body)
		throw new Error('No bodybuilder type specified');
	if (body instanceof PayloadBuilder)
		return body;
	if (typeof body === 'string' && body in bodyMapping)
		return new bodyMapping[body]();
	throw new Error('Unknown BodyBuilder type');
};

const getBodyClass = (body) => {
		return bodyMapping[body];
	throw new Error('Unknown BodyBuilder type');
};

module.exports = {
	MongoPayloadBuilder,
	getBody,
	methodsMapping,
};
