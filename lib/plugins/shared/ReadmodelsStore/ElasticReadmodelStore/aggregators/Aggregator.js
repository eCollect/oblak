'use strict';

const bodyBuilder = require('bodybuilder');

const filterParser = require('./filterParser');

class Aggregator {
	constructor(field, defintion) {
		this.field = field;
		this.defintion = defintion;
		this.filterBody = null;
	}

	addFilter(field, value) {
		this.filterBody = this.filterBody || bodyBuilder();
		filterParser([field, value], this.filterBody);
	}

	toJSON() {
		if (!this.filterBody)
			return this.defintion;
		return {
			filter: this.filterBody ? this.filterBody.getFilter() : undefined,
			aggs: {
				__value: this.defintion,
			},
		};
	}
}

module.exports = Aggregator;
