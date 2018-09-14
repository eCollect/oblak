'use strict';

const merge = require('lodash.merge');

const { analyzer, aggregators: aggregatorsAnalyzer } = require('./aggregators');

const ElasticReadStream = require('./ElasticReadStream');
const MapHitstream = require('./MapHitStream');

const queryParser = require('../../../../queryParser');

module.exports = class ElasticReadModel {
	constructor(
		store,
		{
			index,
			aggregators,
		},
	) {
		this.client = store.db;
		this.index = index;
		this.aggregators = aggregators;
		this.analyzedAggregators = analyzer(aggregators);
	}

	read(esQuery, authQuery, stream = true) {
		const { aggs, postFilter } = aggregatorsAnalyzer(this.analyzedAggregators, esQuery);

		if (typeof authQuery === 'object')
			esQuery = merge(esQuery, authQuery);

		const body = queryParser.translate.elastic(esQuery);
		body.aggs = aggs;
		body.post_filter = postFilter;

		const a = JSON.parse(JSON.stringify(body));

		if (!stream)
			return this.client.search({
				index: this.index,
				type: this.index,
				body,
			});
		return new ElasticReadStream(this.client, this.index, body).safePipe(new MapHitstream());
	}
};
