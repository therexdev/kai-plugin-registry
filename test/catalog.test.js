"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), crypto = require("node:crypto");
const { canonical, validateEntry, validateCatalog, verifyRegistry, fingerprint, packageDigest, compareVersions } = require("../lib/catalog");
const { verifyPlugin, verifyEntryPackage } = require("../lib/plugin"), { allowed } = require("../lib/fetch-release");
const keys = crypto.generateKeyPairSync("ed25519"), publicKey = keys.publicKey.export({ format: "der", type: "spki" }).toString("base64"), keyHash = fingerprint(keys.publicKey);
const now = Date.parse("2026-10-30T00:00:00.000Z");
function plugin(changes = {}) { const manifest = { schema: 1, apiVersion: 2, id: "example.plugin", name: "Example", description: "A community plugin", version: "1.0.0", entry: "index.html", permissions: ["models.read", "inference.local"], ...changes }, files = { "index.html": "<h1>Example</h1>", "app.js": "throw Error('Plugin must never execute during verification')" }; return { manifest, files, publicKey, signature: crypto.sign(null, Buffer.from(canonical({ manifest, files })), keys.privateKey).toString("base64") }; }
function entry(pkg = plugin()) { const m = pkg.manifest; return { id: m.id, name: m.name, description: m.description, version: m.version, apiVersion: m.apiVersion, minCoreVersion: "0.3.0", repository: "example/plugin", url: `https://github.com/example/plugin/releases/download/v${m.version}/example-${m.version}.kaiplugin`, publicKey, fingerprint: keyHash, sha256: packageDigest(pkg), permissions: m.permissions }; }
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
  for (const permission of ["brain.read", "wallet.sign", "remote-access.manage", "koinos-node.manage"]) assert.throws(() => verifyPlugin(plugin({ permissions: [permission] })), /Private/);
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
