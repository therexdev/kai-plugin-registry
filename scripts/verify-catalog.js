"use strict";
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const { verifyRegistry, validateCatalog } = require("../lib/catalog"), { verifyEntryPackage, MAX_PACKAGE_BYTES } = require("../lib/plugin"), { fetchRelease } = require("../lib/fetch-release");
const root = path.join(__dirname, "..");
async function main() {
  const catalog = validateCatalog(JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8")));
  const envelope = verifyRegistry(fs.readFileSync(path.join(root, "dist", "registry.json"), "utf8"));
  assert.deepEqual(envelope.catalog, catalog, "Signed release differs from checked-in catalog");
  assert.equal(catalog.version, require("../package.json").version); assert.equal(envelope.publicKey, require("../publisher.json").publicKey);
  const policy = require("../policy.json");
  for (const entry of catalog.plugins) {
    const official = policy.official.find(row => row.id === entry.id);
    if (entry.id.startsWith("kai.")) assert.equal(entry.fingerprint, official?.fingerprint, "Official identity is not pinned");
    for (const permission of entry.permissions) if (!policy.publicPermissions.includes(permission)) assert.ok(official && official.fingerprint === entry.fingerprint && official.permissions.includes(permission), "Private scope is not approved for this official package");
    if (process.argv.includes("--online")) verifyEntryPackage(entry, await fetchRelease(entry.url, MAX_PACKAGE_BYTES));
  }
  const submissionsDir = path.join(root, "submissions");
  for (const name of fs.readdirSync(submissionsDir)) {
    if (!name.endsWith(".json")) continue;
    const entry = require("../lib/catalog").validateEntry(JSON.parse(fs.readFileSync(path.join(submissionsDir, name), "utf8")));
    assert.equal(name, `${entry.id}.json`, "Submission filename must match plugin ID");
    assert.ok(!entry.id.startsWith("kai."), "Community submissions cannot use the reserved KAI prefix");
    assert.ok(entry.permissions.every(p => policy.publicPermissions.includes(p)), "Community plugins may use only the public API");
    if (process.argv.includes("--online")) verifyEntryPackage(entry, await fetchRelease(entry.url, MAX_PACKAGE_BYTES));
  }
  console.log(`Verified signed registry ${catalog.version}, sequence ${catalog.sequence}, ${catalog.plugins.length} listed plugins${process.argv.includes("--online") ? " and their published packages" : ""}.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
