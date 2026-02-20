import { spawn } from "node:child_process";
import readline from "node:readline";

import { fileURLToPath } from "node:url";
import path from "node:path";

import type { EngineRequest, EngineResponse, EngineTrade } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const enginePath = path.resolve(__dirname, "../OrderBook/build/OrderBook");

export class EngineBridge {
        private child = spawn(enginePath, [], {
        stdio: ["pipe", "pipe", "pipe"],
        });

    private pending = new Map<string, { resolve: (v: EngineResponse) => void; reject: (e: Error) => void }>();
    private nextId = 1;

    constructor() {
        const rl = readline.createInterface({ input: this.child.stdout });
        rl.on("line", (line) => {
            let msg: EngineResponse;
            try { msg = JSON.parse(line); } catch { return; }
            const p = this.pending.get(msg.reqId);
            if (!p) return;
            this.pending.delete(msg.reqId);
            p.resolve(msg);
        });

        this.child.stderr.on("data", (buf) => {
            // log engine errors
            console.error("[engine log]", buf.toString());
        });

        this.child.on("exit", (code) => {
            for (const [, p] of this.pending) p.reject(new Error(`Engine exited: ${code}`));
            this.pending.clear();
        });
    }

    request(
        payload: Omit<EngineRequest, "reqId">,
        timeoutMs = 2000): 
    Promise<EngineResponse> {

        console.log("Requesting engine: ", payload);

        const reqId = String(this.nextId++);
        const req: EngineRequest = { reqId, op: payload.op as "place" | "cancel" | "modify", ...payload };

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(reqId);
                reject(new Error(`Engine timeout for reqId=${reqId}`));
            }, timeoutMs);

            this.pending.set(reqId, {
                resolve: (v) => { clearTimeout(timer); resolve(v); },
                reject: (e) => { clearTimeout(timer); reject(e); },
            });

            this.child.stdin.write(JSON.stringify(req) + "\n");
        });
    }
}