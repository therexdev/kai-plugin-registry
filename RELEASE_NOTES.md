# KAI Foundation plugin catalog 0.3.7

Adds **Master KAI Koinos Node 0.1.0**, a separate developer node plugin with the complete Master dashboard, wallet, funding, block production, community Distribution and Node API workspaces. The standard Koinos Node plugin stays available separately.

Distribution includes reward and reburn tracking, recipient and pool splits, daily settlement, pause and Reset Stats. Node API provides an explicitly enabled local endpoint for supported blockchain requests and producer statistics, with optional history and metadata services. Both features start disabled.

The plugin also offers an explicit chain-data migration from Master Koinos AI Node. Wallets, production keys, KOIN and VHP are not migrated. Its wallet and saved settings belong to this plugin.

Catalog sequence 12 adds the new reviewed package and retains the existing eleven plugin entries unchanged. Core 0.7.3 or later is required for the new plugin. The archived legacy registry.json remains byte-for-byte unchanged. Refreshing the catalog does not install a plugin, enable its API or distribution, or migrate data. Native plugins require full computer/application trust; their renderer UI remains sandboxed.
