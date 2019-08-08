'use strict';

const { Transform } = require('stream');

class ElasticViewModelStream extends Transform {
	constructor(ViewModel) {
		super({ objectMode: true });
		this.ViewModel = ViewModel;
	}

	_transform(obj, _, next) { // eslint-disable-line
		if (obj instanceof this.ViewModel)
			return next(null, obj);

		if (!obj || !('_source' in obj))
			return next(null);

		return next(null, new this.ViewModel({
			id: obj._id,
			attributes: obj._source,
			exists: true,
			seqNo: obj._seq_no,
			primaryTerm: obj._primary_term,
			version: obj._version,
		}));
	}
}

module.exports = ElasticViewModelStream;
