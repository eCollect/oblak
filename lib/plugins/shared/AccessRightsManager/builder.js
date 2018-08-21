module.exports = (path) => {
	if (!path)
		return {};
	const { access } = require(path); // eslint-disable-line
	return access || {};
}
