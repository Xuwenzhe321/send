const fs = require('fs');
const path = require('path');

function kv(f) {
  return `require('./tests/${f}')`;
}

module.exports = function() {
  const files = fs
    .readdirSync(path.join(__dirname, 'tests'))
    .filter(p => /\.js$/.test(p));
  const code = "require('fast-text-encoding');\n" + files.map(kv).join(';\n');
  return {
    code,
    dependencies: files.map(f => require.resolve('./tests/' + f)),
    cacheable: true
  };
};
