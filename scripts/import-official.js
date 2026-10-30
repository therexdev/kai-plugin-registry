"use strict";
// Maintainer bootstrap helper: read Core's reviewed public metadata/contracts and
// local signed packages. This script never executes code from those repositories.
const fs = require("node:fs"), path = require("node:path");
const { validateCatalog, validateEntry, packageDigest } = require("../lib/catalog"), { verifyPlugin } = require("../lib/plugin");
const [corePath, pluginParent] = process.argv.slice(2);
if (!corePath || !pluginParent) throw Error("Usage: node scripts/import-official.js <Core checkout> <parent containing plugin checkouts>");
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const firstParty = json(path.join(corePath, "core/lib/plugins/first-party.json")).plugins, contracts = json(path.join(corePath, "core/lib/plugins/contracts.json"));
const policy = { schema: 1, publicPermissions: ["models.read", "inference.local", "storage.read", "storage.write"], official: firstParty.map(row => ({ id: row.id, fingerprint: row.fingerprint, permissions: [...new Set(Object.values(contracts[row.id]?.permissions || {}))] })) };
const plugins = firstParty.map(row => {
  const repo = row.repository.split("/")[1], file = path.join(pluginParent, repo, "dist", `${repo}-${row.version}.kaiplugin`), verified = verifyPlugin(fs.readFileSync(file, "utf8"), policy), m = verified.manifest;
  if (m.id !== row.id || verified.fingerprint !== row.fingerprint || verified.package.publicKey !== row.publicKey) throw Error("Official source metadata does not match package");
  return validateEntry({ id: m.id, name: m.name, description: m.description || "", version: m.version, apiVersion: m.apiVersion, minCoreVersion: ["kai.koinos-node", "kai.remote-access"].includes(m.id) ? "0.3.0" : "0.2.0", repository: row.repository, url: row.url, publicKey: verified.package.publicKey, fingerprint: verified.fingerprint, sha256: packageDigest(verified.package), permissions: m.permissions });
});
const generatedAt = new Date(), catalog = validateCatalog({ schema: 1, version: require("../package.json").version, sequence: 1, generatedAt: generatedAt.toISOString(), expiresAt: new Date(+generatedAt + 365 * 86400000).toISOString(), plugins });
const root = path.join(__dirname, "..");
if (fs.existsSync(path.join(root, "catalog.json"))) throw Error("Bootstrap refuses to overwrite an existing catalog; edit the reviewed catalog manually for later releases");
fs.writeFileSync(path.join(root, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n", { flag: "wx" });
fs.writeFileSync(path.join(root, "policy.json"), JSON.stringify(policy, null, 2) + "\n");
console.log(`Imported ${plugins.length} official plugins from reviewed Core metadata and signed packages.`);
