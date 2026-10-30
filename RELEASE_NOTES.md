# KAI Foundation plugin catalog 0.3.0

Lists all eleven independently installed Foundation plugins at version 0.3.0. These packages require KAI Core 0.7.0 or later and use the same documented public APIs for every publisher. Each plugin owns its feature engine, assets, dependencies and saved data.

Native plugins require explicit trust for full computer and application access. Their signed renderer UI remains sandboxed; native code is not isolated by its manifest. Dependencies are bundled before publication, with no npm installation or hooks on the user’s computer.

The new `registry-foundation.json` channel pins each publisher, exact signed package digest, version and public capabilities. Large packages are downloaded and verified with bounded memory without executing plugin code. The previously published `registry.json` is included byte-for-byte for older Core installations.

Foundation starts with a separate profile. This catalog does not migrate, overwrite or delete older documents, accounts, wallets, models or plugin data. Agent Network currently supports free private services; paid rentals are not enabled.
