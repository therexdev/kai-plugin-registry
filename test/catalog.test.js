"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), crypto = require("node:crypto");
const { canonical, validateEntry, validateCatalog, verifyRegistry, fingerprint, packageDigest, compareVersions } = require("../lib/catalog");
const { verifyPlugin, verifyEntryPackage } = require("../lib/plugin"), { allowed } = require("../lib/fetch-release");
const { signingPayload } = require("../lib/package-format-v3");
const keys = crypto.generateKeyPairSync("ed25519"), publicKey = keys.publicKey.export({ format: "der", type: "spki" }).toString("base64"), keyHash = fingerprint(keys.publicKey);
const now = Date.parse("2026-10-30T00:00:00.000Z");
function plugin(changes = {}) { const manifest = { schema: 2, apiVersion: 3, runtime: "sandboxed", provides: [], consumes: [], id: "example.plugin", name: "Example", description: "A community plugin", version: "1.0.0", entry: "index.html", permissions: ["models.read", "inference.local"], ...changes }, files = { "index.html": "<h1>Example</h1>", "app.js": "throw Error('Plugin must never execute during verification')" }; return { manifest, files, publicKey, signature: crypto.sign(null, Buffer.from(signingPayload(manifest, files)), keys.privateKey).toString("base64") }; }
function entry(pkg = plugin()) { const m = pkg.manifest; return { id: m.id, name: m.name, description: m.description, version: m.version, apiVersion: m.apiVersion, minCoreVersion: "0.7.0", repository: "example/plugin", url: `https://github.com/example/plugin/releases/download/v${m.version}/example-${m.version}.kaiplugin`, publicKey, fingerprint: keyHash, sha256: packageDigest(pkg), permissions: m.permissions }; }
function catalog(changes = {}) { return { schema: 1, version: "0.1.0", sequence: 1, generatedAt: new Date(now).toISOString(), expiresAt: new Date(now + 86400000).toISOString(), plugins: [entry()], ...changes }; }
function envelope(c = catalog()) { return { catalog: c, publicKey, signature: crypto.sign(null, Buffer.from(canonical(c)), keys.privateKey).toString("base64") }; }
test("signed catalog is pinned to its publisher and any metadata tampering fails", () => {
  assert.equal(verifyRegistry(envelope(), { now, trustedFingerprint: keyHash }).catalog.sequence, 1);
  assert.throws(() => verifyRegistry(envelope(), { now }), /not trusted/);
  const altered = envelope(); altered.catalog.plugins[0].name = "Other"; assert.throws(() => verifyRegistry(altered, { now, trustedFingerprint: keyHash }), /signature/);
});
test("catalog metadata enforces validity, uniqueness, compatibility and immutable package URLs", () => {
  assert.equal(compareVersions("0.10.0", "0.3.0"), 1);
  for (const change of [{ schema: 2 }, { sequence: 0 }, { version: ["0.1.0"] }, { plugins: [entry(), entry()] }, { expiresAt: new Date(now - 1).toISOString() }, { expiresAt: new Date(now + 367 * 86400000).toISOString() }]) assert.throws(() => validateCatalog(catalog(change), { now }));
  for (const change of [{ id: "../escape" }, { minCoreVersion: "01.0.0" }, { sha256: "invalid" }, { fingerprint: "a".repeat(64) }, { url: "https://github.com/example/plugin/releases/latest/download/example.kaiplugin" }, { url: "https://github.com/example/plugin/releases/download/v1.0.0/../x.kaiplugin" }, { permissions: ["models.read", "models.read"] }]) assert.throws(() => validateEntry({ ...entry(), ...change }));
});
test("package verification parses code as data and binds exact content", () => {
  const pkg = plugin(), row = entry(pkg); assert.equal(verifyPlugin(pkg).manifest.id, "example.plugin"); assert.equal(verifyEntryPackage(row, JSON.stringify(pkg, null, 2)).manifest.id, "example.plugin");
  const altered = structuredClone(pkg); altered.files["app.js"] += ";malicious()"; assert.throws(() => verifyPlugin(altered), /signature/);
  assert.throws(() => verifyEntryPackage({ ...row, sha256: "a".repeat(64) }, pkg), /match/);
  assert.throws(() => verifyEntryPackage({ ...row, permissions: ["models.read"] }, pkg), /match/);
});
test("community publishers cannot claim KAI IDs or request private Core grants", () => {
  for (const id of ["kai.brain", "kai.koinos-node", "kai.remote-access", "kai.future"]) assert.throws(() => verifyPlugin(plugin({ id })), /reserved/);
  for (const permission of ["brain.read", "wallet.sign", "remote-access.manage", "koinos-node.manage"]) assert.throws(() => verifyPlugin(plugin({ permissions: [permission] })), /permissions|Unsupported/);
});
test("package file paths and duplicate grants are rejected before execution", () => {
  for (const permissions of [["models.read", "models.read"], null, [1]]) assert.throws(() => verifyPlugin(plugin({ permissions })));
  const pkg = plugin(); pkg.files["../escape.js"] = "bad"; assert.throws(() => verifyPlugin(pkg), /file/);
  assert.throws(() => verifyPlugin(plugin({ entry: "absent.html" })), /entry/);
});
test("standalone release requests allow only GitHub asset endpoints without credentials", () => {
  for (const url of ["https://github.com/example/plugin/releases/download/v1.0.0/a.kaiplugin", "https://release-assets.githubusercontent.com/asset?signature=test", "https://objects.githubusercontent.com/asset"]) assert.equal(allowed(url).protocol, "https:");
  for (const url of ["http://github.com/a", "https://u:p@github.com/a", "https://github.com:123/a", "https://127.0.0.1/a", "https://github.com.evil.test/a", "https://evil.test/a"]) assert.throws(() => allowed(url), /GitHub/);
});
test("community native plugins use the same public Foundation grants without executing service code", () => {
  const pkg = plugin({ runtime: "native", service: "service/index.js", permissions: ["native.execute", "models.read", "inference.local", "wallet.read", "services.provide"], provides: ["example.service"] });
  pkg.files["service/index.js"] = "throw Error('Registry must never execute native service code')";
  pkg.files["service/node_modules/@example/engine/runtime.wasm"] = Buffer.from([0, 97, 115, 109]).toString("base64");
  pkg.signature = crypto.sign(null, Buffer.from(signingPayload(pkg.manifest, pkg.files)), keys.privateKey).toString("base64");
  const row = entry(pkg); assert.equal(verifyEntryPackage(row, pkg).manifest.runtime, "native");
  assert.throws(() => validateEntry({ ...row, minCoreVersion: "0.6.3" }), /0.7.0/);
  const noTrust = structuredClone(pkg); noTrust.manifest.permissions = noTrust.manifest.permissions.filter(value => value !== "native.execute");
  assert.throws(() => verifyPlugin(noTrust), /native.execute/);
  const badBinary = structuredClone(pkg); badBinary.files["service/node_modules/@example/engine/runtime.wasm"] = "not-base64";
  assert.throws(() => verifyPlugin(badBinary), /base64/);
});
test("archived packages remain auditable but are rejected as new submissions", () => {
  const manifest = { schema: 1, apiVersion: 2, id: "example.plugin", name: "Example", description: "Archived", version: "1.0.0", entry: "index.html", permissions: ["models.read"] }, files = { "index.html": "<h1>Archive</h1>" };
  const pkg = { manifest, files, publicKey, signature: crypto.sign(null, Buffer.from(canonical({ manifest, files })), keys.privateKey).toString("base64") };
  assert.equal(verifyEntryPackage(entry(pkg), pkg).manifest.apiVersion, 2);
  assert.throws(() => verifyPlugin(pkg), /Foundation/);
});
test("vendored Foundation format matches its recorded provenance", () => {
  const fs = require("node:fs"), path = require("node:path"), provenance = require("../lib/package-format-v3.provenance.json");
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(__dirname, "../lib/package-format-v3.js"))).digest("hex"), provenance.sha256);
  assert.deepEqual(require("../policy.json").publicPermissions, require("../lib/package-format-v3").PERMISSIONS);
});
