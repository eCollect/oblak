'use strict';

/*
		from = 0,
		size = 100,
		aggs = [],
		q = null,
		sort = '',
		...filter
*/
const { analyzer, aggregators } = require('./aggregators');


const ElasticReadStream = require('./ElasticReadStream');
const queryParser = require('./queryParser');

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
		this.analyzedAggregators = analyzer(aggregators);
	}

	read(esQuery, stream = true) {
		const { aggs, postFilter } = aggregators(this.analyzedAggregators, esQuery);
		const body = queryParser(esQuery);
		body.aggs = aggs;
		body.post_filter = postFilter;

		if (!stream)
			return this.client.search({
				index: this.index,
				type: this.index,
				body,
			});
		return new ElasticReadStream(this.client, this.index, body).safePipe(new MapHitstream());
	}
};
