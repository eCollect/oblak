'use strict';

const merge = require('lodash.merge');

// const elasticReadModel = require('./elasticReadModel');
const ReadModel = require('./ReadModel');
const viewmodelOperations = require('../viewmodelOperations');

const ViewModelStream = require('./ElasticViewModelStream');

const QueryBuilder = require('../QueryBuilder');
const ElasticQueryExecutor = require('./ElasticQueryExecutor');

const readmodelInfo = (repository, [name, { path }], reproSettings) => {
	const index = `${repository.index}.${name}`;
	const { repositorySettings = {} } = reproSettings ? { repositorySettings: reproSettings } : require(path)  // eslint-disable-line
	const { oblak = {} } = repositorySettings;
	const { aggregators = {} } = oblak;
	return {
		name,
		index,
		aggregators,
		repositorySettings,
	};
};

const getDefaultIndexSettings = ({ numberOfShards, numberOfReplicas, indexAndTypeName }) => {
	const body = {
		settings: {
			number_of_shards: numberOfShards,
			number_of_replicas: numberOfReplicas,
		},
		mappings: {},
	};

	body.mappings = {
		dynamic_templates: [
			{
				non_analyzed_string: {
					match: '*',
					match_mapping_type: 'string',
					mapping: {
						type: 'text',
						fields: {
							keyword: {
								type: 'keyword',
								ignore_above: 256,
							},
						},
					},
				},
			},
		],
	};
	return body;
};

const getOblakMapping = () => ({
	properties: {
		_oblak: {
			properties: {
				event: {
					properties: {
						id: {
							type: 'keyword',
							ignore_above: 36, // uuid v4
							store: true,
						},
						position: {
							type: 'long',
							store: true,
						},
					},
				},
			},
		},
	},
});

const buildCreateIndexBody = function buildCreateIndexBody({ numberOfShards, numberOfReplicas, indexAndTypeName }, repositorySettings) {
	const body = getDefaultIndexSettings({ numberOfShards, numberOfReplicas, indexAndTypeName });

	if (!repositorySettings || !repositorySettings.index)
		return body;

	const settings = repositorySettings.index;

	if (settings.settings)
		merge(body.settings, settings.settings);

	if (settings.mappings)
		merge(body.mappings, settings.mappings, getOblakMapping());

	return body;
};

const ensureIndex = async (client, index) => {
	// if it is ensured we have no work here
	if (index.ensured)
		return;

	const { repositorySettings, index: indexAndTypeName } = index;
	const exists = await client.indices.exists({ index: indexAndTypeName });

	// if it exsists, agian we have nothing to do
	if (exists)
		return;

	const numberOfShards = repositorySettings.numberOfShards || 1;
	const numberOfReplicas = repositorySettings.numberOfReplicas || 0;

	await client.indices.create({
		index: indexAndTypeName,
		body: buildCreateIndexBody({ numberOfShards, numberOfReplicas, indexAndTypeName }, repositorySettings),
	});

	index.ensured = true;
};


class ElasticReadmodelStore {
	constructor(app, repository) {
		this.app = app;
		this.repository = repository;
		this.db = null;
		this.indexes = {};
		this.QueryExecutor = ElasticQueryExecutor;
	}

	async init(readmodels, isWithRepositorySettings = false) {
		this.db = await this.app.connections.get('elastic');

		Object.entries(readmodels).forEach((entry) => {
			const { name, ...info } = readmodelInfo(this.repository, entry, isWithRepositorySettings ? entry[1] : undefined);
			// todo optimize indexes!
			this.indexes[name] = info;
		});
		return this;
	}

	read(modelName, query = {}, authQuery = true/* , stream = false */) {
		const info = this.indexes[modelName];
		const model = new ReadModel(this, info);
		return model.read(query, authQuery);
	}

	collection(modelName) {
		if (!this.indexes[modelName])
			throw new Error(`Readmodel type.${modelName} not found.`);
		return this.indexes[modelName];
	}

	query(modelName, metadata, id) {
		if (!this.indexes[modelName])
			throw new Error(`Readmodel type.${modelName} not found.`);

		return new QueryBuilder(this.getQueryExecutor(modelName), metadata, id);
	}

	getQueryExecutor(modelName) {
		return new ElasticQueryExecutor(this.db, this.indexes[modelName].index);
	}
}

class ElasticReadmodelStoreWritable extends ElasticReadmodelStore {
	async init(readmodels) {
		await super.init(readmodels.reduce((acc, c) => {
			acc[c.name] = c.repositorySettings.elasticsearch6 || c.repositorySettings.elasticsearch || {};
			return acc;
		}, {}), true);

		this.ViewModelStream = ViewModelStream;

		await this.createIndexes();
		return this;
	}

	async createIndexes() {
		for (const index of Object.values(this.indexes))
			await ensureIndex(this.db, index);
	}

	raw(modelName, body) {
		const info = this.indexes[modelName];
		return new ReadModel(this, info).raw(body);
	}

	async getLastEventData(model) {
		const { hits } = await this.raw(model,
			{
				query: {
					match_all: {},
				},
				sort: [
					{ '_oblak.event.position': 'desc' },
				],
				size: 1,
			});

		if (!hits.total.value)
			return null;

		const [{ _source } = {}] = hits.hits;
		return _source;
	}

	readmodel(modelName) {
		const info = this.indexes[modelName];
		return new ReadModel(this, info);
	}

	findViewmodel(modelName, { query, id }) {
		const readmodel = this.readmodel(modelName);
		return {
			stream: () => (id ? readmodel.get(id) : readmodel.find(query)).stream(),
		};
	}

	async saveViewmodel(modelName, vm) {
		const info = this.indexes[modelName];

		vm.attributes.id = vm.id;
		delete vm.attributes._id;

		try {
			const res = await this.db.index(
				{
					index: info.index,
					// type: info.index,
					opType: (vm.exists) ? 'index' : 'create',
					// version: vm.version,
					if_seq_no: vm.seqNo,
					if_primary_term: vm.primaryTerm,
					id: vm.id,
					refresh: true,
					waitForActiveShards: 1,
					body: viewmodelOperations.toJSON(vm),
				},
			);

			viewmodelOperations.setVersion(vm, res._version);
			viewmodelOperations.setExists(vm);

			return { value: vm, concurrencyError: null };
		} catch (e) {
			if (e.status === 409)
				return { value: vm, concurrencyError: true };
			throw e;
		}
	}

	async batchSaveViewModels(modelName, vmsMap, { batchSize = 0 } = {}) {
		const info = this.indexes[modelName];

		const batches = [];
		let currentBatchIndex = 0;

		for (const vm of vmsMap.values()) {
			batches[currentBatchIndex] = batches[currentBatchIndex] || [];
			vm.attributes.id = vm.id;

			delete vm.attributes._id;
			batches[currentBatchIndex].push({
				index: {
					_index: info.index,
					// _type: info.index,
					op_type: (vm.exists) ? 'index' : 'create',
					if_seq_no: vm.seqNo,
					if_primary_term: vm.primaryTerm,
					// version: vm.version,
					_id: vm.id,
				}
			}, viewmodelOperations.toJSON(vm));

			if (batchSize && batches[currentBatchIndex].length >= batchSize)
				currentBatchIndex += 1;
		}

		for (const operations of batches) {
			if (!operations.length)
				return false;

			const res = await this.db.bulk({
				refresh: true,
				waitForActiveShards: 1,
				body: operations,
			});

			for (const operationResult of res.items) {
				const operation = operationResult.index || operationResult.create || operationResult.update;
				if (!operation) {
					console.log(operationResult);
					continue;
				}

				if (operation.status > 299) {
					console.log(operation);
					throw new Error('Concurrency Error!');
				}

				if (operation.status === 409)
					throw new Error('Concurrency Error!');

				const vm = vmsMap.get(operation._id);
				viewmodelOperations.setSeqNoAndPrimaryTerm(vm, operation);
				viewmodelOperations.setVersion(vm, operation._version);
				viewmodelOperations.setExists(vm);
			}
		}
		return true;
	}

	async clear() {
		await Promise.all(Object.values(this.indexes).map(({ index }) => this._clearIndex(index).catch(() => {})));
		await this.createIndexes();
	}

	async _ensureIndex(index) {
		ensureIndex(this.db, index);
	}

	async _clearIndex(index) {
		const exists = await this.db.indices.exists({ index });
		if (!exists)
			return;

		await this.db.indices.delete({ index });
		index.ensured = false;
	}
}

ElasticReadmodelStore.Writable = ElasticReadmodelStoreWritable;
ElasticReadmodelStoreWritable.ViewModelStream = ViewModelStream;

module.exports = ElasticReadmodelStore;
