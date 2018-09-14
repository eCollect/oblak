'use strict';

const bodyBuilder = require('bodybuilder');

const filterParser = require('./filterParser');

const parseDefinition = (definition, agg) => {
	if (!('script' in definition) || typeof agg === 'string' || !('params' in agg))
		return definition;

	return {
			...definition,
			script: {
				...definition.script,
				params: agg.params
			}
		};
}

const parseField = (field, agg) => {
	if (field)
		return field;

	if (agg.params)
		return agg.params.field;

	return undefined;
}

const getTypeAndDefinition = (obj)  => Object.entries(obj)[0];

class Aggregator {
	constructor(field, defintion, agg) {
		const [type, innerDefinition] = getTypeAndDefinition(defintion);
		this.type = type;
		this.field = parseField(field, agg);
		this.defintion = parseDefinition(innerDefinition, agg);
		this.filterBody = null;
	}

	setParams(params) {
		if (this.defintion.script)
			this.defintion.script.params = params;
	}

	addFilter(field, value) {
		this.filterBody = this.filterBody || bodyBuilder();
		filterParser([field, value], this.filterBody);
	}

	toJSON() {
		if (!this.filterBody)
			return { [this.type]: this.defintion };
		return {
			filter: this.filterBody ? this.filterBody.getFilter() : undefined,
			aggs: {
				__value: {
					[this.type]: this.defintion,
				},
			},
		};
	}
}

module.exports = Aggregator;
