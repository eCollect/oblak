'use strict';

const bodyBuilder = require('bodybuilder');

const BodyBuilder = require('./BodyBuilder');

module.exports = class ElasticBodyBuilder extends BodyBuilder {
	constructor() {
		super();
		this._body = bodyBuilder();
	}

	size(size = 100) {
		this._body.size(size);
	}

	from(from = 0) {
		this._body.from(from);
	}

	sort(sort = []) {
		if (sort.length)
			this._body.sort(sort);
	}

	// filter
	eq(field, value) {
		this._body.filter('term', field, value);
	}

	in(field, value) {
		if (value && value.length)
			this._body.filter('terms', field, value);
	}

	range(field, value) {
		this._body.filter('range', field, value);
	}

	// string query
	query(query) {
		if (query)
			this._body.query('query_string', { query });
	}

	build() {
		return this._body.build();
	}
};
