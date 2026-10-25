// Vercel serverless entry: every /api/* request is handled by the same zero-dependency
// server used locally (server/server.js). Static files are served by Vercel itself.
const { handle } = require('../server/server.js');
module.exports = (req, res) => {
  // Vercel gives the catch-all segment in req.query.path ("speech/say"); rebuild the real
  // /api/... url from it whatever form req.url arrives in (encoded "[...path]", rewritten, etc.).
  const seg = req.query && req.query.path;
  const original = req.url;
  if (seg) {
    const p = Array.isArray(seg) ? seg.join('/') : String(seg);
    const qs = new URLSearchParams(req.query); qs.delete('path');
    const q = qs.toString();
    req.url = '/api/' + p + (q ? '?' + q : '');
  } else if (/\[\.\.\.path\]|%5B\.\.\.path%5D/.test(original)) {
    req.url = '/api/';
  }
  if (req.url !== original) console.log(`[vercel] ${req.method} ${original} -> ${req.url}`);
  return handle(req, res);
};
