'use strict';

const merge = require('lodash.merge');

const { analyzer, aggregators: aggregatorsAnalyzer } = require('./aggregators');

const ElasticReadStream = require('./ElasticReadStream');
const ElasticGetStream = require('./ElasticGetStream');

const MapHitstream = require('./MapHitStream');
const MapSourceStream = require('./MapSourceStream');

const queryParser = require('../../../../queryParser');

const parseRaw = ({ raw } = {}) => {
	if (!raw)
		return undefined;
	return raw;
}


class ElasticGetQuery {
	constructor(client, index, id) {
		this.client = client;
		this.index = index;
		this.id = id;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	exec() {
		return this.client.get({
			index: this.index,
			// type: this.index,
			id: this.id,
		});
	}

	stream() {
		return new ElasticGetStream(this.client, this.index, this.id);
	}
}

class ElasticRawQuery {
	constructor(client, index, body) {
		this.client = client;
		this.index = index;
		this.body = body;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	exec() {
		return this.client.search({
			index: this.index,
			// type: this.index,
			body: this.body,
		});
	}

	stream() {
		return new ElasticReadStream(this.client, this.index, this.body);
	}
}

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

	raw(body) {
		return new ElasticRawQuery(this.client, this.index, body);
	}

	find(query, { version = true, seqNoAndPrimaryTerm = true } = {}) {
		const body = queryParser.translate.elastic({ filter: query });
		if (version)
			body.version = true;
		if (seqNoAndPrimaryTerm)
			body.seq_no_primary_term = true;

		return new ElasticRawQuery(this.client, this.index, body);
	}

	get(id) {
		return new ElasticGetQuery(this.client, this.index, id);
	}

	read(esQuery, authQuery, stream = true) {
		const { aggs, postFilter } = aggregatorsAnalyzer(this.analyzedAggregators, esQuery);

		if (typeof authQuery === 'object')
			esQuery = merge(esQuery, authQuery);

		const body = queryParser.translate.elastic(esQuery);
		body.aggs = aggs;
		body.post_filter = postFilter;

		if (esQuery.raw)
			merge(body, esQuery.raw);

		if (!stream)
			return this.client.search({
				index: this.index,
				type: this.index,
				body,
			});
		return new ElasticReadStream(this.client, this.index, body).safePipe(new MapHitstream());
	}
};
