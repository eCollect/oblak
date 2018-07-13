'use strict';

/*
		from = 0,
		size = 100,
		aggs = [],
		q = null,
		sort = '',
		...filter
*/

const ElasticReadStream = require('./ElasticReadStream');
const queryParser = require('./queryParserBB');
const reduceAndFilter = (arr = [], predicate) => {
	const len = arr.length;
	let found = 0;
	if (!len)
		return undefined;

	const result = {};
	for (let i = 0; i < len; i++) {
		const it = predicate(arr[i]);
		if (it) {
			result[arr[i]] = it;
			found += 1;
		}
	}

	return found ? result : undefined;
};

const MapHitstream = require('./MapHitStream');

module.exports = class ElasticReadModel {
	constructor(
		client,
		{
			index,
			aggregators,
		},
	) {
		this.client = client;
		this.index = index;
		this.aggregators = aggregators;
	}

	read(esQuery, stream = true) {
		const aggs = reduceAndFilter(esQuery.aggs, agg => this.aggregators[agg]);
		const body = queryParser(esQuery);
		body.aggs = aggs;

		if (!stream)
			return this.client.search({
				index: this.index,
				type: this.index,
				body,
			});
		return new ElasticReadStream(this.client, this.index, body).pipe(new MapHitstream());
	}
};
