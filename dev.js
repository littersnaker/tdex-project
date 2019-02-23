// require('./dev/server');
process.env.NODE_ENV = 'development';
process.env.BABEL_ENV = 'development';
process.env.VER_ENV = 'web';

require('./scripts/start');

// var test = require('./dev/assets.json');
// console.log(test);