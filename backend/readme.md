RUNNING NOTES OF TODO:

Send delta events, not full snapshots each tick. - FADE
Batch outbound updates every 20–50ms if traffic spikes. - FADE

Use a small queue between WS handler and engine; drop/slow abusive clients.
Monitor: message rate, p95 engine latency, broadcast queue depth.

we have to make sure you can't match with yourself -- DONE
persistant client DB on relaod -- DONE
verify Order Ownership by a client -- DONE

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
