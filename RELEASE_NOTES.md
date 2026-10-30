# KAI Foundation plugin catalog 0.3.1

Updates Koinos Node to version 0.3.1. The other ten Foundation plugins retain their existing version 0.3.0 package and publisher pins. These packages require KAI Core 0.7.0 or later and use the same documented public APIs for every publisher.

Koinos Node now offers an explicit reviewed migration from another KAI profile. It stops the verified old node, transfers its chain databases with progress and resumable recovery, and removes each old file only after its destination is verified. The old application must be closed before migrating. Wallets, private producer keys, KOIN and VHP remain separate; block production stays off. If you created a new Node wallet, transfer funds manually.

Native plugins require explicit trust for full computer and application access. Their signed renderer UI remains sandboxed; native code is not isolated by its manifest. Dependencies are bundled before publication, with no npm installation or hooks on the user’s computer.

Catalog sequence 6 pins the exact signed Node package digest and retains every other entry unchanged. Large packages are downloaded and verified with bounded memory without executing plugin code. The previously published `registry.json` is included byte-for-byte for older Core installations.

Refreshing the catalog does not install updates or migrate data. Migration runs only after the user explicitly starts and reviews it in the installed plugin. Core 0.7.2 separately provides wallet-credit restoration and optional model cleanup. Agent Network currently supports free private services; paid rentals are not enabled.
