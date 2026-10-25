// Vercel serverless entry. vercel.json rewrites every /api/* request here; req.url keeps the
// original path, so the same zero-dependency router used locally (server/server.js) handles it.
// Static files are served by Vercel itself.
const { handle } = require('../server/server.js');
module.exports = (req, res) => handle(req, res);
