| Change | Provider | Expected by the rules | Told by the tool | Tests that broke (measured) | Needed a change (judged) | Check refused | Verdict |
|---|---|---|---|---|---|---|---|
| X01-optional-param-callback: formatAmount takes an optional number of digits after the point | money | billing | billing | billing | billing | billing (1) | held |
| X02-opaque-id-digits: Booking ids become plain numbers written as text, easier to read out over the phone | bookings | none | none | none | none | none | held |
| X03-port-bound-changed: The clock bookings is handed now gives today's date, YYYY-MM-DD, and bookings keeps only the day | bookings | front, reports | front, reports | front | front | none | held; 1 told for nothing |
| X04-includes-on-literal-list: rooms gains isRoomKind, and add uses it | rooms | reports | reports | none | none | none | held; 1 told for nothing |
| X05-stale-write: store's put can be handed the record as it was read, and refuses the write if it has changed since | store | reports | reports | none | none | none | held; 1 told for nothing |
| X06-bound-reworded: Amount's bound line is reworded; it means the same | money | billing, bookings, front, meter, reports | billing, bookings, front, meter, reports | none | none | none | held; 5 told for nothing |
| X07-list-gains-name-lookup-table: A new kind of room: garden (a user keeps a price for each kind) | rooms | billing, bookings, front, reports | billing, bookings, front, reports | none | bookings | bookings (1) | held; 3 told for nothing |
| X08-new-op-name-clash: rooms answers bookstatus: whether a room can be booked, and its seats | rooms | billing, reports | billing, reports | billing | billing | billing (1), front (1) | held; 1 told for nothing |
| X09-message-channel: The meter writes refusals to its standard error, as errors; readings and done stay on standard output | meter | none | billing **(differs)** | billing | billing | meter (2) | held |
| X10-node-timer: The meter stops on its own when its input goes quiet for 30 seconds | meter | none | none | none | none | none | held |
