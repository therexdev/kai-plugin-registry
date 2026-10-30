"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), crypto = require("node:crypto"), https = require("node:https");
const { Readable } = require("node:stream"), { EventEmitter } = require("node:events");
const { signingPayload, packageDigest } = require("../lib/package-format-v3");
const { verifyPluginFile, verifyEntryPackageFile } = require("../lib/plugin");
const { fetchReleaseFile } = require("../lib/fetch-release");

function fixture() {
  const key = crypto.generateKeyPairSync("ed25519"), publicKey = key.publicKey.export({ format: "der", type: "spki" }).toString("base64"), fingerprint = crypto.createHash("sha256").update(Buffer.from(publicKey, "base64")).digest("hex");
  const manifest = { schema: 2, apiVersion: 3, runtime: "native", id: "example.streaming", name: "Streaming", description: "A data-only verification test", version: "1.0.0", entry: "index.html", service: "service.js", permissions: ["native.execute"] };
  const files = { "index.html": "<h1>Test</h1>", "service.js": "throw Error('Never execute package files')", "data.bin": crypto.randomBytes(1024 * 1024).toString("base64") };
  const pkg = { manifest, files, publicKey, signature: crypto.sign(null, Buffer.from(signingPayload(manifest, files)), key.privateKey).toString("base64") };
  const entry = { id: manifest.id, name: manifest.name, description: manifest.description, version: manifest.version, apiVersion: 3, minCoreVersion: "0.7.0", repository: "example/plugin", url: "https://github.com/example/plugin/releases/download/v1.0.0/example-1.0.0.kaiplugin", publicKey, fingerprint, sha256: packageDigest(pkg), permissions: manifest.permissions };
  return { pkg, entry };
}
test("streaming registry verification authenticates exact packages without loading assets", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kai-registry-test-")); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const { pkg, entry } = fixture(), file = path.join(dir, "package.kaiplugin"); fs.writeFileSync(file, JSON.stringify(pkg));
  const verified = verifyEntryPackageFile(entry, file);
  try {
    assert.equal(verified.digest, entry.sha256); assert.equal(require("../lib/catalog").packageDigest(verified.package), entry.sha256);
    assert.equal(fs.readdirSync(verified.root).length, 0); assert.throws(() => verified.package.files["service.js"], /not extracted/);
  } finally { verified.dispose(); }
  assert.equal(fs.existsSync(verified.root), false);
  assert.throws(() => verifyEntryPackageFile({ ...entry, sha256: "a".repeat(64) }, file), /match/);
  pkg.files["service.js"] += ";tampered"; fs.writeFileSync(file, JSON.stringify(pkg)); assert.throws(() => verifyPluginFile(file), /signature/);
  delete pkg.signature; fs.writeFileSync(file, JSON.stringify(pkg)); assert.throws(() => verifyPluginFile(file), /fields/);
});

function mockRequests(t, responses) {
  const original = https.get, calls = [];
  https.get = (url, options, callback) => {
    const spec = responses.shift(); assert.ok(spec, "Unexpected HTTP request"); calls.push({ url: url.href, headers: options.headers });
    const request = new EventEmitter(), response = Readable.from(spec.chunks || []); response.statusCode = spec.status || 200; response.headers = spec.headers || {};
    process.nextTick(() => callback(response)); return request;
  };
  t.after(() => { https.get = original; }); return calls;
}
test("release download streams through approved redirects and cleans its temporary file", async t => {
  const bytes = crypto.randomBytes(1024 * 1024), calls = mockRequests(t, [{ status: 302, headers: { location: "https://release-assets.githubusercontent.com/signed-asset" } }, { chunks: [bytes.subarray(0, 70000), bytes.subarray(70000)] }]);
  const result = await fetchReleaseFile("https://github.com/example/plugin/releases/download/v1.0.0/a.kaiplugin", 2 * 1024 * 1024);
  assert.equal(result.bytes, bytes.length); assert.deepEqual(fs.readFileSync(result.file), bytes);
  assert.equal(calls.length, 2); assert.ok(calls.every(call => !Object.hasOwn(call.headers, "authorization")));
  result.dispose(); result.dispose(); assert.equal(fs.existsSync(result.file), false);
});
test("release downloader denies oversized responses and unapproved redirects", async t => {
  mockRequests(t, [{ chunks: [Buffer.alloc(6), Buffer.alloc(6)] }, { headers: { "content-length": "999" } }, { status: 302, headers: { location: "https://outside.example/asset" } }, { status: 404 }]);
  const url = "https://github.com/example/plugin/releases/download/v1.0.0/a.kaiplugin";
  await assert.rejects(fetchReleaseFile(url, 10), /size limit/);
  await assert.rejects(fetchReleaseFile(url, 10), /size limit/);
  await assert.rejects(fetchReleaseFile(url, 10), /Only public GitHub/);
  await assert.rejects(fetchReleaseFile(url, 10), /404/);
  await assert.rejects(fetchReleaseFile(url, 0), /byte limit/);
});
test("vendored streaming reader and verifier match their recorded provenance", () => {
  for (const name of ["package-file", "package-file-verifier"]) {
    const provenance = require(`../lib/${name}.provenance.json`), bytes = fs.readFileSync(path.join(__dirname, `../lib/${name}.js`));
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), provenance.vendoredSha256);
    assert.equal(crypto.createHash("sha256").update(bytes.toString("utf8").replaceAll('require("./package-format-v3")', 'require("./package")')).digest("hex"), provenance.sourceSha256);
  }
});
