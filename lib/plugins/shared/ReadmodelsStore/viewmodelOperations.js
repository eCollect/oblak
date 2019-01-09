'use strict';

module.exports = ({
	toJSON(vm) {
		return JSON.parse(JSON.stringify(vm.attributes));
	},
	setVersion(vm, version)  {
		vm.version = version;
		return vm;
	}
})
