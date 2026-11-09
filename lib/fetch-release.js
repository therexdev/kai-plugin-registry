"use strict";
const https = require("node:https"), fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { Transform } = require("node:stream"), { pipeline } = require("node:stream/promises");
const { setTimeout: delay } = require("node:timers/promises");
const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);
const transientCodes = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "EAI_AGAIN", "ERR_STREAM_PREMATURE_CLOSE"]);
// Registry-listed artifacts are GitHub release assets. Restrict redirects to
// GitHub's asset endpoints and never forward credentials or bearer tokens.
function allowed(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !["github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(url.hostname)) throw Error("Only public GitHub release asset URLs are supported");
  return url;
}
async function fetchReleaseFile(value, maxBytes, signal = AbortSignal.timeout(180000)) {
  // Retry temporary transport failures only. Every attempt uses the same
  // pinned asset, gets a new temporary file, and shares the original deadline.
  for (let attempt = 0; ; attempt++) {
    const url = allowed(value);
    // A cached gateway error can otherwise make every immediate retry fail.
    if (attempt) url.searchParams.set("kai_registry_retry", Date.now().toString(36) + "-" + attempt);
    try { return await fetchReleaseFileOnce(url.href, maxBytes, signal, attempt > 0); }
    catch (error) {
      if (signal.aborted || attempt >= 2 || !(transientStatuses.has(error.statusCode) || transientCodes.has(error.code))) throw error;
      await delay(500 * 2 ** attempt, undefined, { signal });
    }
  }
}
async function fetchReleaseFileOnce(value, maxBytes, signal, refresh) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 512 * 1024 * 1024) throw Error("Invalid release asset byte limit");
  let url = allowed(value);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kai-registry-download-")), file = path.join(root, "package.kaiplugin");
  fs.chmodSync(root, 0o700);
  const dispose = () => fs.rmSync(root, { recursive: true, force: true });
  try {
  for (let redirect = 0; redirect <= 5; redirect++) {
    signal.throwIfAborted();
    const result = await new Promise((resolve, reject) => {
      const req = https.get(url, { signal, headers: { accept: "application/octet-stream", "accept-encoding": "identity", "user-agent": "KAI-Registry-Validator", ...(refresh ? { "cache-control": "no-cache" } : {}) } }, response => {
        response.once("error", reject);
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) { response.resume(); resolve({ location: response.headers.location }); return; }
        if (response.statusCode !== 200) { response.resume(); reject(Object.assign(Error(`Release asset request failed (${response.statusCode})`), { statusCode: response.statusCode })); return; }
        const declared = Number(response.headers["content-length"]);
        if (Number.isFinite(declared) && declared > maxBytes) { response.destroy(); reject(Error("Release asset exceeds size limit")); return; }
        resolve({ response });
      });
      req.on("error", reject);
    });
    if (result.response) {
      let size = 0;
      const bounded = new Transform({ transform(chunk, encoding, callback) { size += chunk.length; callback(size > maxBytes ? Error("Release asset exceeds size limit") : null, chunk); } });
      await pipeline(result.response, bounded, fs.createWriteStream(file, { flags: "wx", mode: 0o600 }), { signal });
      return { file, bytes: size, dispose };
    }
    if (!result.location) throw Error("Release redirect has no location");
    url = allowed(new URL(result.location, url).href);
  }
  throw Error("Too many release redirects");
  } catch (error) { dispose(); throw error; }
}
module.exports = { fetchReleaseFile, allowed };
