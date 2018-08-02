'use strict';

const BodyBuilder = require('./BodyBuilder');

const sortMapping = {
	asc: 1,
	ascending: 1,
	desc: -1,
	descending: -1,
};

const rangeMapping = {
	gt: '$gt',
	gte: '$gte',
	lt: '$lt',
	lte: '$lte',
};

module.exports = class MongoBodyBuilder extends BodyBuilder {
	constructor() {
		super();
		this._find = {};
		this._sort = {};
		this._from = 0;
		this._size = 100;
	}

	size(size) {
		this._size = size;
	}

	from(from) {
		this._from = from;
	}

	sort(sort = []) {
		if (!sort || !sort.length)
			return;
		sort.forEach((f) => {
			const field = Object.keys(f)[0];
			const mapped = sortMapping[f[field]];
			if (!mapped)
				return;
			this._sort[field] = mapped;
		});
	}

	eq(field, value) {
		this._find[field] = { $eq: value };
	}

	in(field, value) {
		this._find[field] = { $in: value };
	}

	query($search) {
		if (!$search)
			return;
		this._find.$text = { $search };
	}

	range(field, value) {
		Object.entries(value).forEach(([key, rangeValue]) => {
			const operator = rangeMapping[key];
			if (!operator)
				return;
			this._find[field] = this._find[field] || {};
			this._find[field][operator] = rangeValue;
		});
	}

	build() {
		return {
			sort: this._sort,
			size: this._size,
			from: this._from,
			find: this._find,
		};
	}
};
