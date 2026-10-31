# KAI Foundation plugin catalog 0.3.4

Updates Koinos Node to 0.3.4. The other ten plugins retain their existing 0.3.0 packages and publisher pins. KAI Core 0.7.0 or later is required.

Koinos Node fixes Windows startup failing with `EPERM` when replacing generated configuration copied from read-only plugin templates. Generated public configuration is now writable, and existing read-only copies are repaired. Installed plugin files remain read-only.

Update Koinos Node in Plugins, then start the node again. A completed migration does not need to be repeated. Chain data, the plugin wallet, producer keys, funding records and migration journals are preserved. This update does not move funds or enable block production.

Catalog sequence 9 pins the exact signed Node package. Every other plugin entry is unchanged, and the legacy `registry.json` remains byte-for-byte identical for older Core installations. Refreshing the catalog does not install updates or migrate data.

Native plugins require explicit trust for full computer and application access. Their renderer UI is sandboxed; native code is not isolated by its manifest.
