"use strict";
const https = require("node:https");
// Registry-listed artifacts are GitHub release assets. Restrict redirects to
// GitHub's asset endpoints and never forward credentials or bearer tokens.
function allowed(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !["github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(url.hostname)) throw Error("Only public GitHub release asset URLs are supported");
  return url;
}
async function fetchRelease(value, maxBytes, signal = AbortSignal.timeout(30000)) {
  let url = allowed(value);
  for (let redirect = 0; redirect <= 5; redirect++) {
    signal.throwIfAborted();
    const result = await new Promise((resolve, reject) => {
      const req = https.get(url, { signal, headers: { accept: "application/octet-stream", "accept-encoding": "identity", "user-agent": "KAI-Registry-Validator" } }, response => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) { response.resume(); resolve({ location: response.headers.location }); return; }
        if (response.statusCode !== 200) { response.resume(); reject(Error(`Release asset request failed (${response.statusCode})`)); return; }
        const chunks = []; let size = 0;
        response.on("data", chunk => { size += chunk.length; if (size > maxBytes) { response.destroy(Error("Release asset exceeds size limit")); return; } chunks.push(chunk); });
        response.on("error", reject); response.on("end", () => resolve({ text: Buffer.concat(chunks).toString("utf8") }));
      });
      req.on("error", reject);
    });
    if (result.text !== undefined) return result.text;
    if (!result.location) throw Error("Release redirect has no location");
    url = allowed(new URL(result.location, url).href);
  }
  throw Error("Too many release redirects");
}
module.exports = { fetchRelease, allowed };
