// Vercel serverless entry: every /api/* request is handled by the same zero-dependency
// server used locally (server/server.js). Static files are served by Vercel itself.
const { handle } = require('../server/server.js');
module.exports = (req, res) => {
  // Vercel may hand the matched route as the url; rebuild the real /api path from the query.
  if (req.url.includes('[...path]')) {
    const p = [].concat((req.query && req.query.path) || []).join('/');
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    req.url = '/api/' + p + qs;
  }
  return handle(req, res);
};
