"use strict";
const fs = require("node:fs"), { verifyPlugin } = require("../lib/plugin"), { validateEntry, packageDigest } = require("../lib/catalog");
const [file, repository, minCoreVersion] = process.argv.slice(2);
if (!file || !repository || !minCoreVersion) throw Error("Usage: node scripts/create-entry.js <signed.kaiplugin> <owner/repository> <minimum-Core-version>");
const verified = verifyPlugin(fs.readFileSync(file, "utf8")), m = verified.manifest;
const row = validateEntry({ id: m.id, name: m.name, description: m.description || "", version: m.version, apiVersion: m.apiVersion, minCoreVersion, repository, url: `https://github.com/${repository}/releases/download/v${m.version}/${require('node:path').basename(file)}`, publicKey: verified.package.publicKey, fingerprint: verified.fingerprint, sha256: packageDigest(verified.package), permissions: m.permissions });
console.log(JSON.stringify(row, null, 2));
