"use strict";
const https = require("node:https"), fs = require("node:fs"), os = require("node:os"), path = require("node:path");
const { Transform } = require("node:stream"), { pipeline } = require("node:stream/promises");
// Registry-listed artifacts are GitHub release assets. Restrict redirects to
// GitHub's asset endpoints and never forward credentials or bearer tokens.
function allowed(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !["github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(url.hostname)) throw Error("Only public GitHub release asset URLs are supported");
  return url;
}
async function fetchReleaseFile(value, maxBytes, signal = AbortSignal.timeout(180000)) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 512 * 1024 * 1024) throw Error("Invalid release asset byte limit");
  let url = allowed(value);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kai-registry-download-")), file = path.join(root, "package.kaiplugin");
  fs.chmodSync(root, 0o700);
  const dispose = () => fs.rmSync(root, { recursive: true, force: true });
  try {
  for (let redirect = 0; redirect <= 5; redirect++) {
    signal.throwIfAborted();
    const result = await new Promise((resolve, reject) => {
      const req = https.get(url, { signal, headers: { accept: "application/octet-stream", "accept-encoding": "identity", "user-agent": "KAI-Registry-Validator" } }, response => {
        response.once("error", reject);
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) { response.resume(); resolve({ location: response.headers.location }); return; }
        if (response.statusCode !== 200) { response.resume(); reject(Error(`Release asset request failed (${response.statusCode})`)); return; }
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
