"use strict";
// Submitted packages are parsed and verified as data, never imported or executed.
const crypto = require("node:crypto");
const { canonical, safeId, VERSION, publicKey, fingerprint, packageDigest, validateEntry } = require("./catalog");
const POLICY = require("../policy.json");
const MAX_PACKAGE_BYTES = 24 * 1024 * 1024;
function safeFile(value) {
  return typeof value === "string" && value.length <= 180 && value.split("/").every(p => /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(p) && !/[. ]$/.test(p) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(p)) && /\.(html|js|css|svg|json|txt|png|jpg|jpeg|webp|gif|wav|ogg|mp3|woff|woff2)$/.test(value);
}
function verifyPlugin(input, policy = POLICY) {
  const raw = typeof input === "string" ? input : JSON.stringify(input);
  if (typeof raw !== "string" || Buffer.byteLength(raw) > MAX_PACKAGE_BYTES) throw Error("Plugin package exceeds 24 MB");
  const pkg = JSON.parse(raw), m = pkg.manifest;
  if (!pkg || Object.keys(pkg).sort().join() !== "files,manifest,publicKey,signature") throw Error("Invalid plugin package fields");
  if (!m || typeof m !== "object" || Array.isArray(m) || Object.keys(m).some(k => !["schema", "apiVersion", "id", "name", "version", "description", "entry", "permissions"].includes(k)) || m.schema !== 1 || ![1, 2].includes(m.apiVersion) || !safeId(m.id) || typeof m.name !== "string" || !m.name.trim() || m.name.length > 100 || typeof m.version !== "string" || !VERSION.test(m.version) || (m.description !== undefined && (typeof m.description !== "string" || m.description.length > 1000))) throw Error("Invalid plugin manifest");
  if (!Array.isArray(m.permissions) || new Set(m.permissions).size !== m.permissions.length || m.permissions.some(p => typeof p !== "string")) throw Error("Invalid plugin permissions");
  if (!pkg.files || Array.isArray(pkg.files) || typeof pkg.files !== "object" || Object.keys(pkg.files).length < 1 || Object.keys(pkg.files).length > 250) throw Error("Invalid plugin files");
  const names = new Set();
  for (const [name, source] of Object.entries(pkg.files)) {
    if (!safeFile(name) || names.has(name.toLowerCase()) || typeof source !== "string") throw Error("Invalid plugin file"); names.add(name.toLowerCase());
    if (/\.(png|jpg|jpeg|webp|gif|wav|ogg|mp3|woff2?)$/i.test(name) && (!source || Buffer.from(source, "base64").toString("base64") !== source)) throw Error("Binary plugin assets must use canonical base64");
  }
  if (!safeFile(m.entry) || !m.entry.endsWith(".html") || !Object.hasOwn(pkg.files, m.entry)) throw Error("Missing plugin entry");
  const key = publicKey(pkg.publicKey), owner = fingerprint(key);
  if (typeof pkg.signature !== "string" || !/^[A-Za-z0-9+/]{86}==$/.test(pkg.signature) || !crypto.verify(null, Buffer.from(canonical({ manifest: m, files: pkg.files })), key, Buffer.from(pkg.signature, "base64"))) throw Error("Invalid plugin signature");
  const official = policy.official.find(entry => entry.id === m.id);
  if (m.id.startsWith("kai.") && (!official || official.fingerprint !== owner)) throw Error("KAI IDs are reserved to the verified official publisher");
  for (const permission of m.permissions) {
    if (policy.publicPermissions.includes(permission)) continue;
    if (m.apiVersion !== 2 || !official || official.fingerprint !== owner || !official.permissions.includes(permission)) throw Error("Private capability is not permitted for this publisher and plugin");
  }
  return { package: pkg, manifest: m, fingerprint: owner };
}
function verifyEntryPackage(entry, input) {
  validateEntry(entry); const verified = verifyPlugin(input), m = verified.manifest;
  if (m.id !== entry.id || m.name !== entry.name || (m.description || "") !== entry.description || m.version !== entry.version || m.apiVersion !== entry.apiVersion || verified.fingerprint !== entry.fingerprint || verified.package.publicKey !== entry.publicKey || packageDigest(verified.package) !== entry.sha256 || canonical([...m.permissions].sort()) !== canonical([...entry.permissions].sort())) throw Error("Package does not match registry entry");
  return verified;
}
module.exports = { MAX_PACKAGE_BYTES, safeFile, verifyPlugin, verifyEntryPackage };
