# KAI Foundation plugin catalog 0.3.6

Updates Assistant and Connections to 0.3.2. Both retain their Core 0.7.3 minimum; the other nine plugin entries remain unchanged.

Assistant fixes Windows launch failures reporting “Plugin code contains an unverified file” after voice or turn detection had run. Native engines find existing runtime libraries without copying DLLs into the signed package, and local speech-model reads no longer create filesystem caches there. Updating installs a freshly verified code snapshot and keeps Assistant data in its existing folder. Unknown files in earlier snapshots are not deleted or trusted.

Connections checks managed-service availability before account sign-in. Signed-out users see the sign-in action, failed availability checks offer a retry, and connecting apps still uses Core’s authenticated broker. Saved connections are preserved.

Catalog sequence 11 pins the exact reviewed packages. The archived legacy registry.json remains byte-for-byte unchanged. Refreshing the catalog does not install updates or migrate data. Native plugins require full computer/application trust; their renderer UI remains sandboxed.
