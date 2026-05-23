<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Contact: contact@perform.digital
-->

# spiderbrain MCP adapter

An on-demand companion adapter that exposes the spiderbrain brain as MCP tools and resources over the Model Context Protocol (JSON-RPC 2.0 / stdio). This is **not a parity replacement for the always-on hooks** — see "Degraded vs full-parity" below. It unlocks opencode, Claude Desktop, Cursor, Continue, Zed, and every other MCP-capable client with a single server binary.

---

## What you get

| Surface | What it does |
|---|---|
| `spiderbrain_query` | Ranked context for a file, symbol, or search term (webscore × recency) |
| `spiderbrain_cascade` | Blast-radius analysis for files you plan to edit |
| `spiderbrain_molt` | Current drift audit (orphans, dangling edges, hash mismatches) |
| `spiderbrain_brief` | Per-prompt targeted context — inline brief matching filenames and cluster names in the prompt |
| `brain://SPIDERBRAIN.md` | The brain's master overview document |
| `brain://spideyorder.md` | Curated file-importance ranking |
| `brain://webmap/{cluster}` | Webmap for any named cluster |
| `cascade_before_edit` | Prompt: run blast-radius before editing a given file |

All tool results are sanitised (control-char strip, whitespace collapse, length cap) and wrapped in a `<spiderbrain-untrusted-content>` fence with a trusted instruction header outside, so the model treats project-sourced content as DATA, not as instructions.

---

## Prerequisites

1. Node.js >= 18.
2. A built brain directory (`node core/scripts/build-brain.mjs ...`). The brain must contain `synganglion.json`.
3. The `--brain` path must be a real directory, not a symlink.

---

## Wire it in opencode

Add to `opencode.json` in your project root (or `~/.config/opencode/opencode.json` for global):

```json
{
  "mcp": {
    "spiderbrain": {
      "type": "local",
      "command": [
        "node",
        "/absolute/path/to/spiderbrain-v3/platforms/mcp/server.mjs",
        "--brain",
        "/absolute/path/to/your-brain-folder"
      ]
    }
  }
}
```

opencode uses `"type": "local"` (not `"stdio"`) and merges the executable and its arguments into a single `"command"` array. Replace both absolute paths with the real values on your machine. Restart opencode.

---

## Wire it in Claude Desktop

Add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "spiderbrain": {
      "command": "node",
      "args": [
        "/absolute/path/to/spiderbrain-v3/platforms/mcp/server.mjs",
        "--brain",
        "/absolute/path/to/your-brain-folder"
      ]
    }
  }
}
```

Restart Claude Desktop after saving the config.

---

## Wire it in Cursor

Add to `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "spiderbrain": {
      "command": "node",
      "args": [
        "/absolute/path/to/spiderbrain-v3/platforms/mcp/server.mjs",
        "--brain",
        "/absolute/path/to/your-brain-folder"
      ]
    }
  }
}
```

---

## Wire it in Continue

Add to `.continuerc.json` in your project root:

```json
{
  "mcpServers": [
    {
      "name": "spiderbrain",
      "command": "node",
      "args": [
        "/absolute/path/to/spiderbrain-v3/platforms/mcp/server.mjs",
        "--brain",
        "/absolute/path/to/your-brain-folder"
      ]
    }
  ]
}
```

---

## Debug mode

Set the environment variable `SPIDERBRAIN_MCP_DEBUG=1` to have the server write trace messages to stderr. Useful when wiring new clients.

```json
{
  "env": { "SPIDERBRAIN_MCP_DEBUG": "1" }
}
```

---

## Degraded vs full-parity

The MCP adapter gives you the **on-demand query surface** only. It does not replicate the always-on hook surface that ships with the Claude Code adapter.

| Capability | Claude Code (always-on hooks) | MCP adapter (this file) |
|---|---|---|
| Boot brief (SessionStart) | Automatic — fires once per session, injects prey + hot list + top webscores | **Not available** — you can read `brain://SPIDERBRAIN.md` manually |
| Per-prompt whisper | Automatic — fires on every prompt, silent when nothing matches | `spiderbrain_brief` tool — must be called explicitly |
| Edit journal (PostToolUse) | Automatic — every Edit/Write appends a JSONL line | **Not available** — no equivalent hook in MCP v1 |
| Query / cascade / molt | Available as tools | Available as tools (`spiderbrain_query`, `spiderbrain_cascade`, `spiderbrain_molt`) |

In practice: with MCP only, the model sees the brain when it calls the tools or when you call `spiderbrain_brief` before a prompt. Without the always-on hooks, the boot brief and the per-prompt whisper do not fire automatically, and edits are not journalled. This is useful for non-Claude clients; it is not a drop-in replacement for the Claude Code hooks.

For full parity on Claude Code, use the three hooks in `platforms/claude/hooks/` and treat this adapter as an optional supplement that adds the tool surface to Claude Desktop or other clients.

---

## BUSL fence notice

Running this server as a shared service for two or more developers in any organisation — including internal-only deployments — constitutes hosted commercial use and requires a commercial licence from Perform Digital Pvt Ltd. Single-user local use is free.

Contact: contact@perform.digital

---

## Licence

This adapter is distributed under the Apache License, Version 2.0. See the file header in `server.mjs` for the full licence text, or visit https://www.apache.org/licenses/LICENSE-2.0.

The spiderbrain core engine (`core/`) is licensed separately under BUSL-1.1; see the root `LICENSE.md`.
