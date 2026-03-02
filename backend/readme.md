RUNNING NOTES OF TODO:

Send delta events, not full snapshots each tick.
Batch outbound updates every 20–50ms if traffic spikes.

Use a small queue between WS handler and engine; drop/slow abusive clients.
Monitor: message rate, p95 engine latency, broadcast queue depth.

we have to make sure you can't match with yourself
persistant client DB on relaod

verify Order Ownership by a client

run file:
node --loader ts-node/esm src/server.ts


Missing a “push updates even when maker isn’t connected” story

Right now, maker updates assume:
	•	maker has state already (clientOrderStates.get(makerClientId))
	•	maker’s order exists in that map

If maker disconnects mid-game:
	•	fills happen
	•	you can’t update their state
	•	when they reconnect, you have no record unless you persisted events

Reconnect flow: on connection → load state → send snapshot → subscribe to events


DB WORKFLOW:
The minimal “correct” plan for your game
Client sends client_order_id + seq
DB enforces UNIQUE(client_id, client_order_id)
All money-moving operations happen in one DB transaction (RPC or pg)
WS is just transport: server broadcasts committed results
If you tell me whether you want to do atomicity via Supabase RPC or via Node pg, I’ll outline the exact function signatures and the sequencing/idempotency fields to add.