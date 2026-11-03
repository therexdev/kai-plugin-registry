# KAI Plugin Registry 0.3.19

Updates KAI Koinos Node to 0.3.10 to fix Windows `EPERM` when moving chain data to an existing empty folder selected in the folder picker. The verified copy replaces only an empty real directory; files added during copying are protected and failed switches retain the original chain and saved location.

Users can update the existing Koinos Node plugin and retry their chosen destination folder. Requires Core 0.7.17 or newer. Other plugin entries and the immutable legacy catalog are unchanged.

## Previous release

# KAI Plugin Registry 0.3.18

Updates Master KAI Koinos Node to 0.1.6. Its dashboard reads recent confirmed rewards directly from the local chain, shows the checked block range and net profit, and labels delayed indexed history. Overlapping history entries are removed without changing distribution or Reward returns accounting.

The existing Master Node plugin receives this as a normal update using the same plugin ID and publisher. The signed package passed 366 tests and native integration checks on Windows, macOS and Linux. Requires Core 0.7.17 or newer.

All other plugin entries and the immutable legacy catalog are retained.

## Previous release

# KAI Plugin Registry 0.3.17

Updates KAI Koinos Node to 0.3.9 with a reviewed Alpha node migration dialog. Users can select chain data, producer address/custody and network RPC settings, the existing block-signing key, and an optional encrypted local wallet. Original files are retained, existing destination wallets and keys are protected, and production remains off until the imported setup is verified.

External custody keeps the cold spending key on its signing device. Active signer sessions, pending transactions and custom Docker overrides are not imported. The update includes translated migration choices and recovery/identity checks.

Only the regular Koinos Node listing changes. Master KAI Koinos Node remains at 0.1.5; all other plugin listings and the immutable legacy catalog remain unchanged. Requires Core 0.7.17 or newer.

## Previous release: 0.3.16

Publishes translation fixes for Koinos Node, Assistant, Connections, Brain, Workflows, Agent Network, Tools and Remote Access. Menus, dialogs and dynamic status text now follow the language saved in Core, including live changes to open views. The Assistant desktop companion serves its offline catalogs too. User names, drafts, model output, code, keys and addresses remain literal.

The shared Node fixes also ship in Master KAI Koinos Node 0.1.5, retaining the 0.1.4 Node API startup and large-cache fixes. Core 0.7.17 or newer is required.

- KAI Koinos Node 0.3.8
- KAI Connections 0.3.5
- Brain 0.3.4
- Workflows 0.3.4
- Agent Network 0.3.3
- KAI Tools 0.3.3
- KAI Remote Access 0.3.2
- Master KAI Koinos Node 0.1.5
- KAI Assistant 0.3.5

All nine publisher signatures and exact package pins were verified. Plugin tests and Windows, macOS and Linux release checks passed, including native companion and Master Node integration tests. The catalog retains the other four entries and the immutable legacy asset.
