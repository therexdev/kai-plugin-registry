# KAI Plugin Registry 0.3.24

Publishes Workflows 0.3.7 with Core-owned **Allow for Workflow** and **Allow Always** credit access. Ongoing permissions can be revoked in **Core Settings → Access**. The catalog now requires Core 0.7.23 for this Workflows update.

Catalog sequence 29. Publisher identity and manifest permissions are unchanged. Other plugin entries and the immutable legacy catalog are unchanged.

## Previous release: 0.3.23

Publishes Workflows 0.3.6 in the in-app catalog. It adds an importable researched-article workflow, public source retrieval, automatic task-specific selection among eligible online network models, bounded reviewed continuations, and full article outputs. Publisher identity, minimum Core version and requested permissions are unchanged.

Catalog sequence 28. Other plugin entries and the immutable legacy catalog remain unchanged.

## Previous release

# 0.3.22 — Workflow JSON sharing and KAI network agents

Updates Workflows to signed version 0.3.5 with file or pasted-JSON import, visible JSON exports, and starter workflows. Agent steps, Copilot and Discover support local models and KAI network models, including network-only and mixed workflows.

Network requests use Core credits with a cost estimate and review for each request. The update adds inference.network and wallet.authorize permissions. The existing publisher identity and Core 0.7.17 minimum remain unchanged. Other catalog entries and the archived legacy catalog are unchanged.

# 0.3.21 — Master Node RPC readiness and index recovery

Updates Master KAI Koinos Node to signed version 0.1.8. The API root, `/rpc` and `/v1/status` report blockchain RPC readiness independently of producer-history indexing, with separate producer coverage and errors. Expired producer checkpoints rebuild from the current finalized window while missing current-window blocks continue to prevent producer readiness.

The existing publisher identity and Core 0.7.17 minimum remain unchanged. Other catalog entries and the archived legacy catalog are unchanged. This update does not repair missing historical database records or establish the cause of the earlier Cloudflare 502.

# 0.3.20 — Master Node Airdrops

Update Master KAI Koinos Node to signed version 0.1.7, adding reviewed KOIN/VHP airdrops with equal splits or per-wallet amounts, durable payment tracking and CSV reports. The existing publisher identity and Core 0.7.17 minimum remain unchanged. Other catalog entries and the archived legacy catalog are unchanged.

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
