// Wraps every API route so an unexpected error (a missing database
// connection, a bad query, anything) becomes a clean JSON 500 response
// instead of an unhandled crash — the difference between the client
// seeing {"error":"Something went wrong..."} and a raw
// FUNCTION_INVOCATION_FAILED with no explanation. The real error is
// still logged server-side (visible in `vercel logs` / the dev console).
export function withHandler(fn) {
  return async function wrapped(req, res) {
    try {
      await fn(req, res);
    } catch (err) {
      console.error('[api error]', req.method, req.url, '-', err && err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Something went wrong. Please try again in a moment.' });
      }
    }
  };
}
