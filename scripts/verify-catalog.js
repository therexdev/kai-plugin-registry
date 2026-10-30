"use strict";
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const { verifyRegistry, validateCatalog } = require("../lib/catalog"), { verifyEntryPackageFile, MAX_PACKAGE_BYTES } = require("../lib/plugin"), { fetchReleaseFile } = require("../lib/fetch-release");
const root = path.join(__dirname, "..");
async function main() {
  async function verifyPublished(entry) {
    const download = await fetchReleaseFile(entry.url, entry.apiVersion === 3 ? MAX_PACKAGE_BYTES : 24 * 1024 * 1024);
    let verified;
    try { verified = verifyEntryPackageFile(entry, download.file); } finally { verified?.dispose?.(); download.dispose(); }
  }
  const catalog = validateCatalog(JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8")));
  const foundation = catalog.plugins.length > 0 && catalog.plugins.every(entry => entry.apiVersion === 3);
  const asset = foundation ? "registry-foundation.json" : "registry.json";
  const envelope = verifyRegistry(fs.readFileSync(path.join(root, "dist", asset), "utf8"));
  const archived = fs.readFileSync(path.join(root, "dist", "registry.json"));
  assert.equal(require("node:crypto").createHash("sha256").update(archived).digest("hex"), fs.readFileSync(path.join(root, "archive/registry-0.2.1.sha256"), "utf8").trim(), "Published legacy catalog asset was changed");
  assert.deepEqual(verifyRegistry(archived.toString("utf8"), { allowExpired: true }).catalog, JSON.parse(fs.readFileSync(path.join(root, "archive/catalog-0.2.1.json"), "utf8")), "Legacy catalog differs from its archive");
  assert.deepEqual(envelope.catalog, catalog, "Signed release differs from checked-in catalog");
  assert.equal(catalog.version, require("../package.json").version); assert.equal(envelope.publicKey, require("../publisher.json").publicKey);
  const policy = require("../policy.json");
  for (const entry of catalog.plugins) {
    const entryPolicy = entry.apiVersion === 3 ? policy : require("../lib/legacy-policy.json");
    const official = entryPolicy.official.find(row => row.id === entry.id);
    if (entry.id.startsWith("kai.")) assert.equal(entry.fingerprint, official?.fingerprint, "Official identity is not pinned");
    for (const permission of entry.permissions) if (!entryPolicy.publicPermissions.includes(permission)) assert.ok(official && official.fingerprint === entry.fingerprint && official.permissions.includes(permission), "Private scope is not approved for this official package");
    if (process.argv.includes("--online")) await verifyPublished(entry);
  }
  const submissionsDir = path.join(root, "submissions");
  for (const name of fs.readdirSync(submissionsDir)) {
    if (!name.endsWith(".json")) continue;
    const entry = require("../lib/catalog").validateEntry(JSON.parse(fs.readFileSync(path.join(submissionsDir, name), "utf8")));
    assert.equal(name, `${entry.id}.json`, "Submission filename must match plugin ID");
    assert.equal(entry.apiVersion, 3, "New submissions require Foundation API 3");
    assert.ok(!entry.id.startsWith("kai."), "Community submissions cannot use the reserved KAI prefix");
    assert.ok(entry.permissions.every(p => policy.publicPermissions.includes(p)), "Community plugins may use only the public API");
    if (process.argv.includes("--online")) await verifyPublished(entry);
  }
  console.log(`Verified signed registry ${catalog.version}, sequence ${catalog.sequence}, ${catalog.plugins.length} listed plugins${process.argv.includes("--online") ? " and their published packages" : ""}.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
