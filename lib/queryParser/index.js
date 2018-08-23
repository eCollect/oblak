'use strict';

const stringParser = require('./queryStringParser');
const translator = require('./queryTranslator');

const payloadTranslator = require('./payloadTranslator');

const translate = {
	mongo: qo => translator(qo, new translator.MongoBodyBuilder()),
	elastic: qo => translator(qo, new translator.ElasticBodyBuilder()),
};

const parse = {
	raw: qs => stringParser(qs),
	mongo: qs => translate.mongo(stringParser(qs)),
	elastic: qs => translate.elastic(stringParser(qs)),
};

const middleware = {
	mongo: (req, res, next) => {
		req.dbQuery = parse.mongo(req.query);
		next();
	},
	elastic: (req, res, next) => {
		req.dbQuery = parse.elastic(req.query);
		next();
	},
};

module.exports = {
	parse,
	translate,
	middleware,
	payload : {
		translate : {
			mongo: (payload) => payloadTranslator(payload, new payloadTranslator.MongoPayloadBuilder()),
		},
	},
};
