# Approved-layout external development walk

Use a fresh development worktree at the actual final experimental integration SHA. Bind only 127.0.0.1, preferably port 8766 so the historical service on 8765 is not silently replaced. Service command remains the existing web CLI with the injected provider directory. No public hosting or credentials.

1. Open fresh home in an actual independent client/browser. Verify range 2–50, price $2.75, Quantity value 2; submit without editing and see $5.50. Start again returns to 2.
2. Enter 12 and see $33.00; enter 50 and see $137.50. Refresh preserves a harmless valid result.
3. Enter 1: see actionable 2-to-50 error, retained 1 and no total. Check 51 likewise. Enter abc, empty input and an HTML-tag payload: retained/escaped text, no executed markup or quote. Submit valid 2 afterward and see $5.50 with no stale alert.
4. Request missing/duplicate quantities through URL and unknown /missing. Verify 400s/current bounds and readable 404/home navigation respectively.

Record actual integration SHA, command, service availability, URLs/actions/outcomes and observed flaws. This is the external walk on the development deployment, separate from module tests and the internal Screens walk. Browser evidence is preferred when available; an independent standard-library HTTP client is permitted by the existing proof-app journey contract, with limits labeled. Do not invent execution evidence from this plan.

Notice/state inspections and ownership/exact-head gate checks are integration controls, not an additional product stage. ROOT management and reactive messages must use the approved non-root logical addresses; the depth0 console is not claimed reactively awakened.
