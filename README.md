# KAI Plugin Registry

A signed catalog of installable KAI Core plugins. The registry is hosted as a small JSON asset on GitHub Releases; it is not a server and does not need to be installed as a plugin.

**Catalog endpoint:** <https://github.com/therexdev/kai-plugin-registry/releases/latest/download/registry.json>

KAI Core 0.3.0 adds a **Refresh catalog** control in Plugins. Core downloads this catalog only when requested, verifies the pinned KAI registry signature, and shows compatible entries. Installing a plugin downloads its signed package from its publisher's own repository and asks for native permission approval. Refreshing the registry does not install, update, enable, or run a plugin.

The first release lists Assistant, Brain, Connections, Workflows, Agent Network, Documents, Model Compare, Code, Tools, Koinos Node, and Remote Access. The two new plugins require Core 0.3.0; the earlier nine require Core 0.2.0. Individual plugin READMEs describe each initial release's supported features and limits.

## Publish your own plugin

1. Create your own source repository. Choose an ID such as `yourname.yourplugin`; `kai.*` is reserved for official plugins.
2. Build a sandboxed HTML/JS/CSS plugin using the [public Core API](https://github.com/therexdev/kai-core/blob/main/docs/core/PLUGIN_API.md). Public grants are `models.read`, `inference.local`, `storage.read`, and `storage.write`. A registry listing cannot grant private Brain, wallet, account, node, or remote APIs.
3. Generate and privately back up your own Ed25519 publisher key. Use the Core `plugin:pack` command to sign your `.kaiplugin` file, then publish that immutable asset in a GitHub release tagged `v<version>` in your repository. Keep the same key for future versions of the same ID.
4. Clone this registry and create metadata from the published package:

   ```sh
   node scripts/create-entry.js /path/to/yourplugin-1.0.0.kaiplugin yourname/yourplugin 0.3.0 > submissions/yourname.yourplugin.json
   ```

5. Open a pull request containing only that submission file. Include source/release links, license, and the reason for each permission. No registry signing key is needed for submissions.

Maintainers review the source, permissions, publisher identity, and released package as data. Accepted entries are copied into a new signed catalog release. Submission does not automatically publish a listing. Plugin code, package install hooks, and dependencies are never executed by the registry verifier.

Users can also install a signed package directly through Core using its URL or local file without waiting for a registry listing. They still review the publisher and permissions. Existing plugin data remains bound to the original publisher even after uninstalling a plugin.

## Catalog and trust

`catalog.json` is the readable source; `dist/registry.json` is the signed envelope. Schemas live in `schema/`. Each entry pins the plugin ID, version, API version, minimum Core version, repository, immutable release URL, public key, publisher fingerprint, content digest, and requested permissions.

The `sha256` field is the SHA-256 of UTF-8 canonical JSON for the complete signed `.kaiplugin` object. Canonicalization recursively sorts object keys and preserves array order. It is intentionally independent of indentation and key order in the downloaded JSON file. Core also verifies the plugin's own signature, so registry approval cannot substitute for publisher verification.

The registry envelope's Ed25519 signature covers canonical JSON of `catalog`. Its key is pinned in Core. A catalog has a monotonic `sequence`, semantic `version`, and `generatedAt`/`expiresAt` validity interval of at most 366 days. Core verifies its cached signature on every read, rejects older sequences/versions and changes to an existing sequence, and preserves the last good cache after failed refreshes. An expired or invalid cache blocks catalog installation until repaired/refreshed; it does not silently return withdrawn entries from the bundled fallback. A fresh Core profile can use the bundled official list before its first registry refresh.

Removing an entry from a newer catalog stops listing it. It does not remotely disable an installed plugin, and the registry does not provide immediate security revocation. Updates are user initiated and require a new version and permission review. Keep the registry key private; no private key or signing secret belongs in this repository or Actions.

## Maintainer release

This project has no npm dependencies. Use Node 22 or newer.

```sh
npm test
npm run verify
npm run verify:online
```

For each new catalog release:

1. Review submissions, then copy approved entries into `catalog.json`. Do not change a plugin's existing publisher key or reuse an immutable release version for different contents. Keep `policy.json` aligned with reviewed Core permission contracts; community plugins use only the public grants.
2. Increase `catalog.sequence`, `catalog.version`, and `package.json` version. Set current `generatedAt`, an `expiresAt` no more than 366 days later, and update `RELEASE_NOTES.md`.
3. Remove the old local `dist/registry.json`, then sign the new catalog using the privately held registry key:

   ```sh
   node scripts/sign-catalog.js /private/path/to/publisher-key.pem
   ```

4. Run the checks above. Online verification fetches every listed immutable release, confirms all metadata/signatures/digests, and never executes plugin code. All referenced plugin assets must already exist.
5. Commit the reviewed catalog and signed asset to `main`. Actions repeats verification and publishes `registry.json` under `v<catalog.version>`. If that release already exists, the workflow only accepts an identical asset; it refuses to overwrite it.

Core's registry verification uses DNS-pinned public HTTPS requests for the catalog and every redirect. The standalone maintainer verifier restricts package downloads to GitHub and its public release-asset hosts. No credentials are sent to package hosts.
