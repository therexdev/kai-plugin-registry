"use strict";
const { verifyPluginFile } = require("../lib/plugin"), { validateEntry } = require("../lib/catalog");
const [file, repository, minCoreVersion = "0.7.0"] = process.argv.slice(2);
if (!file || !repository || !minCoreVersion) throw Error("Usage: node scripts/create-entry.js <signed.kaiplugin> <owner/repository> <minimum-Core-version>");
const verified = verifyPluginFile(file), m = verified.manifest;
try {
  const row = validateEntry({ id: m.id, name: m.name, description: m.description || "", version: m.version, apiVersion: m.apiVersion, minCoreVersion, repository, url: `https://github.com/${repository}/releases/download/v${m.version}/${require('node:path').basename(file)}`, publicKey: verified.package.publicKey, fingerprint: verified.fingerprint, sha256: verified.digest, permissions: m.permissions });
  console.log(JSON.stringify(row, null, 2));
} finally { verified.dispose(); }
