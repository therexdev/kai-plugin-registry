# KAI Plugin Registry

This repository publishes a signed catalog of installable KAI Foundation plugins. It is catalog infrastructure, not executable plugin code or a plugin that users install.

**Foundation catalog endpoint:** [registry-foundation.json](https://github.com/therexdev/kai-plugin-registry/releases/latest/download/registry-foundation.json)

Foundation plugins use package schema 2/API 3 and require Core 0.7.0 or later. Every publisher uses the same documented Core API. Plugins own their feature code, data, assets and bundled dependencies. The catalog may list sandboxed UI plugins or explicitly trusted native plugins; native code has full computer/application access and is not isolated by its folder or publisher signature.

Refreshing a catalog does not install, update, enable or run a plugin. Installation still verifies the package and presents its publisher and trust requirements. Official `kai.*` names are reserved in this curated catalog for brand identity; they do not unlock special runtime APIs.

## Submit a plugin

1. Create your own repository and choose an ID such as `yourname.yourplugin`.
2. Build with the [Foundation author guide](https://github.com/therexdev/kai-core/blob/main/docs/foundation/PLUGIN_AUTHOR_GUIDE.md). Use a schema 2/API 3 manifest and declare only needed public capabilities and service dependencies. A native service must declare `native.execute` and be accurately described as full-trust code.
3. Pin and bundle runtime dependencies before signing. No client-side npm install, postinstall, source checkout or compilation is allowed. Keep your Ed25519 private publisher key outside all repositories and packages.
4. Use Core's packer to create the signed `.kaiplugin`, then publish it as an immutable GitHub Release asset under `v<version>` in your repository. Keep the same publisher key for future versions of that ID.
5. Generate an entry from the released package:

   ```sh
   node scripts/create-entry.js /path/to/yourplugin-1.0.0.kaiplugin yourname/yourplugin 0.7.0 > submissions/yourname.yourplugin.json
   ```

6. Open a pull request containing your submission file. Include source/release links, license, supported platforms, native-access explanation if applicable, and the purpose of each requested capability.

Maintainers review and verify package bytes as data. The registry verifier never imports plugin code, executes native services, runs build/install hooks or downloads runtime dependencies. A submission does not automatically publish a listing. Users may also install a package directly using Core's third-party installation controls without a catalog listing.

## Catalog integrity

`catalog.json` is the next readable catalog and `dist/registry-foundation.json` is its signed Foundation envelope. The previously published `dist/registry.json` is retained byte-for-byte for the old application channel, with its catalog and checksum under `archive/`. New releases publish both asset names so old Core versions do not receive the new incompatible catalog. Each entry pins ID, name, description, version, package API version, minimum Core version, repository, immutable asset URL, publisher public key/fingerprint, package digest and requested permissions. Entries for API 3 require Core >=0.7.0 and the same public permission vocabulary for all publishers.

For API 3 packages, the signature covers the manifest and a sorted table of each file's path, encoding, decoded byte count and SHA-256. The verifier recomputes this table from the package bytes. The catalog package digest binds that payload, publisher key and signature with the `kai-plugin-package-digest-v3` domain; it does not hash the full base64 JSON representation again. Archived schema 1 package digests retain their original canonical-JSON definition.

Package signatures and digest definitions follow the exact vendored Foundation verifier in `lib/package-format-v3.js`; its source provenance hash is recorded beside it. `policy.json` contains public grants and official catalog identity pins. There is no first-party private capability table for Foundation packages.

The catalog's Ed25519 signature covers canonical JSON of the catalog itself. The registry key is pinned in Core. Catalog versions and sequence numbers increase, timestamps use UTC, and validity intervals are at most 366 days. Package assets are immutable. Changing or removing a catalog listing does not remotely stop an installed plugin.

`lib/plugin-v2-archive.js` and `lib/legacy-policy.json` exist solely to audit previously published immutable catalogs/packages. New submissions and `create-entry.js` reject those old package formats. Updating tooling does not regenerate, rewrite or re-sign the existing catalog; a new catalog is a separate reviewed release.

## Maintainer verification and release

The tooling has no npm dependencies and uses Node 24 in CI.

```sh
npm test
npm run verify
npm run verify:online
```

The first two commands validate metadata, policy, signatures and exact catalog/source equality, plus the unchanged legacy asset checksum. Online verification also fetches each listed immutable asset and checks the publisher signature and all pinned metadata. It sends no credentials and permits only GitHub release-asset hosts and their supported redirects. Foundation downloads stream into temporary files, and verification computes decoded file hashes with a bounded-memory JSON reader; even large native packages are neither loaded as one JSON object nor executed. Temporary downloads and review directories are removed after verification. The adapted Core reader/verifier snapshots have their own provenance hashes beside the source files.

For a new Foundation catalog:

1. Wait until every listed signed plugin asset exists. Review its exact publisher/version/digest, public capabilities, supported platforms and native trust requirements. Never alter an existing plugin's pinned publisher to work around a signature mismatch.
2. Add the reviewed API 3 entries with minimum Core 0.7.0. Increase `catalog.version`, `catalog.sequence` and `package.json` version; set fresh `generatedAt`/`expiresAt` and release notes. Keep older GitHub release assets immutable.
3. Sign the new catalog with the offline maintainer key into a new output file. The signer refuses to overwrite an output and refuses legacy entries in a new release:

   ```sh
   node scripts/sign-catalog.js /private/path/to/registry-key.pem /tmp/registry-new.json
   ```

4. Set the local working `dist/registry-foundation.json` with that newly reviewed envelope, then run all three verification commands. This changes the next working release, not an old published asset.
5. Commit the verified catalog and pre-signed envelope to `main`. Actions publishes only from `main`, only when all entries use Foundation API 3, and only after signature and online package verification. An existing release must match byte-for-byte; it is never overwritten. The old `registry.json` asset is carried forward unchanged; only `registry-foundation.json` receives Foundation entries.

The `foundation-v1` branch and pull requests validate source/tooling without publishing. No signing secrets are stored in Actions. Native device/integration testing belongs to the plugin release process; a successful catalog check does not certify that a native plugin is safe or functional on a user's computer.
