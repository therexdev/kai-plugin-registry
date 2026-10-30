"use strict";
// Packages are always untrusted data here. Never require or run their files.
const { verifyPackage, safeFile, MAX_BYTES } = require("./package-format-v3");
const { canonical, validateEntry, packageDigest } = require("./catalog");
const POLICY = require("../policy.json");
function checkPolicy(verified, policy = POLICY) {
  const official = policy.official.find(entry => entry.id === verified.manifest.id);
  // Catalog branding policy, not a privileged API or runtime capability.
  if (verified.manifest.id.startsWith("kai.") && (!official || official.fingerprint !== verified.fingerprint)) throw Error("KAI catalog IDs are reserved to the verified official publisher");
  if (verified.manifest.permissions.some(permission => !policy.publicPermissions.includes(permission))) throw Error("Unsupported public Foundation permission");
  return verified;
}
function verifyPlugin(input, policy = POLICY) { return checkPolicy(verifyPackage(input), policy); }
function verifyPluginFile(file, policy = POLICY) {
  const verified = require("./package-file-verifier").verifyPackageFile(file, { extract: false });
  try { return checkPolicy(verified, policy); } catch (error) { verified.dispose(); throw error; }
}
function matchEntry(entry, verified) {
  const m = verified.manifest;
  if (m.id !== entry.id || m.name !== entry.name || (m.description || "") !== entry.description || m.version !== entry.version || m.apiVersion !== entry.apiVersion || verified.fingerprint !== entry.fingerprint || verified.package.publicKey !== entry.publicKey || (verified.digest || packageDigest(verified.package)) !== entry.sha256 || canonical([...m.permissions].sort()) !== canonical([...entry.permissions].sort())) throw Error("Package does not match registry entry");
  return verified;
}
function verifyEntryPackage(entry, input) {
  validateEntry(entry);
  // Old signed catalogs remain auditable; create-entry and new submissions use
  // only verifyPlugin above and cannot introduce another legacy-format entry.
  const verified = entry.apiVersion === 3 ? verifyPlugin(input) : require("./plugin-v2-archive").verifyPlugin(input);
  return matchEntry(entry, verified);
}
function verifyEntryPackageFile(entry, file) {
  validateEntry(entry);
  if (entry.apiVersion !== 3) {
    const fs = require("node:fs"), legacy = require("./plugin-v2-archive");
    if (fs.statSync(file).size > legacy.MAX_PACKAGE_BYTES) throw Error("Archived plugin package exceeds 24 MB");
    return verifyEntryPackage(entry, fs.readFileSync(file, "utf8"));
  }
  const verified = verifyPluginFile(file);
  try { return matchEntry(entry, verified); } catch (error) { verified.dispose(); throw error; }
}
module.exports = { MAX_PACKAGE_BYTES: MAX_BYTES, safeFile, verifyPlugin, verifyPluginFile, verifyEntryPackage, verifyEntryPackageFile };
