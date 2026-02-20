RUNNING NOTES OF TODO:

Send delta events, not full snapshots each tick.
Batch outbound updates every 20–50ms if traffic spikes.

Use a small queue between WS handler and engine; drop/slow abusive clients.
Monitor: message rate, p95 engine latency, broadcast queue depth.

we have to make sure you can't match with yourself
persistant client DB on relaod

verify Order Ownership by a client