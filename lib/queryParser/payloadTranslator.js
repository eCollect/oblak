'use strict';

const { getBody, methodsMapping, MongoPayloadBuilder } = require('./PayloadBuilders');

const translate = (payload, body) => {
	body = getBody(body);

	Object.entries(payload).forEach(([fieldName, fieldValue]) => {
		if (fieldName.startsWith('$'))
			throw new Error('Keys must not begin with a $ sign.');

		// ugly
		if (typeof fieldValue === 'object') {
			const fieldValueKeys = Object.keys(fieldValue);
			if (fieldValueKeys.length === 1) {
				const firstFieldValueKey = fieldValueKeys[0];
				const method = methodsMapping[firstFieldValueKey] || methodsMapping._default;
				if (method)
					return body[method](fieldName, fieldValue[firstFieldValueKey]);
			}
		}

		return body[methodsMapping._default](fieldName, fieldValue);
	});

	return body.build();
};

translate.MongoPayloadBuilder = MongoPayloadBuilder;

module.exports = translate;
