'use strict';

module.exports = ({
	toJSON(vm) {
		return JSON.parse(JSON.stringify(vm.attributes));
	},
	setSeqNoAndPrimaryTerm(vm, { _seq_no, _primary_term }) {
		vm.seqNo = _seq_no;
		vm.primaryTerm = _primary_term;
	},
	setVersion(vm, version)  {
		vm.version = version;
		return vm;
	},
	setExists(vm, exists = true)  {
		vm.exists = exists;
		return vm;
	},
})
