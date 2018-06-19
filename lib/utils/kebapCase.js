'use strict';

// https://gist.github.com/thevangelist/8ff91bac947018c9f3bfaad6487fa149
module.exports = string => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
