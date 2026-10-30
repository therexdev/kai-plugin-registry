Add one `<publisher.plugin>.json` file to request a Foundation catalog listing. New submissions require package schema 2/API 3 and Core 0.7.0 or later:

```sh
node scripts/create-entry.js path/to/published.kaiplugin owner/repository 0.7.0 > submissions/publisher.plugin.json
```

Submit a pull request changing only that entry. Include source/release links, supported platforms, license, capability explanations and an accurate native-code trust description when applicable. Do not include private keys, credentials, executable review scripts, package binaries or dependencies in the submission itself.

Every publisher uses the same public Foundation API. `kai.*` is reserved for official catalog branding, not privileged access. Native plugins require `native.execute` and explicit full-computer trust during installation; signatures are not safety endorsements.

Maintainers verify the published package as data and explicitly include accepted entries in a new signed catalog. Submitting a pull request does not list or execute your plugin automatically.
