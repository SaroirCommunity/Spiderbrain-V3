<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# platforms/claude

The Claude Code adapter. **Shipped and in use.**

## What's here

```
platforms/claude/
  hooks/
    session-brief.mjs  SessionStart - prints prey + last session's hot files + top webscores. Fires once per session.
    prompt-brief.mjs   UserPromptSubmit - looks for filename / cluster mentions in the prompt, surfaces the brain's view. Fires per prompt. Silent when nothing matches.
    journal.mjs        PostToolUse on Edit|Write|MultiEdit - appends one JSONL line to cephalothorax. Dumb, fast, exit 0. Fires per edit.
  README.md            this file
```

The three hooks together make the brain **always-on**: it boots with the session, whispers per prompt, and journals every edit. Each takes `--brain "<abs path>"` so one Claude install can drive many brains. The hooks are referenced from `~/.claude/skills/spiderbrain/` (or wherever the skill is installed globally).

## How to wire it (per-project)

In your project's `.claude/settings.local.json`, add:

```jsonc
{
  "hooks": {
    "SessionStart": [
      {
        "command": "node",
        "args": [
          "<SPIDERBRAIN_HOME>/platforms/claude/hooks/session-brief.mjs",
          "--brain",
          "C:/abs/path/to/yourproject-spiderbrain"
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "command": "node",
        "args": [
          "<SPIDERBRAIN_HOME>/platforms/claude/hooks/prompt-brief.mjs",
          "--brain",
          "C:/abs/path/to/yourproject-spiderbrain"
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "command": "node",
        "args": [
          "<SPIDERBRAIN_HOME>/platforms/claude/hooks/journal.mjs",
          "--brain",
          "C:/abs/path/to/yourproject-spiderbrain"
        ]
      }
    ]
  }
}
```

Adjust paths for your OS. The hooks are designed to be **additive** - they merge with whatever else is in `settings.local.json`, never replace it. All three are required for the always-on contract; you can omit `UserPromptSubmit` if you accept the per-prompt gap (see the always-on note in [`../../core/SKILL.md`](../../core/SKILL.md)).

## Skill trigger

Invoke the skill explicitly: say "spiderbrain" in chat, or use `/spiderbrain`. The skill spec lives at `core/SKILL.md`.

## Behaviour guarantees

- **session-brief.mjs:** runs at session start only. Reads two files. <30 ms overhead.
- **prompt-brief.mjs:** runs per prompt. Reads the prompt + `synganglion.json`, emits a context block only if filenames or cluster names match. Stays silent otherwise. <50 ms typical. Hard cap on output budget so it never bloats a prompt.
- **journal.mjs:** never blocks an edit. No JSON parse, no lock. Swallows all errors. Always exits 0.
- All three hooks tolerate a missing or corrupt brain folder - they print a brief warning (or nothing) and exit 0, never crash the session, prompt, or edit.

## Caveats

- Paths must be absolute and (ideally) free of spaces. Claude Code's hook shell-quoting is fine with spaces but the `--brain` arg should be the absolute path you'd type in a terminal.
- The hooks expect Node ≥ 18 in `PATH`. If `node` isn't found, the hook exits 0 silently - the session continues without the brain.

## Status

**Shipped.** This is the reference adapter and the one all measured benchmarks were run against.

## Related

- [../README.md](../README.md) - the cross-platform adapter index.
- [../../core/SKILL.md](../../core/SKILL.md) - the skill spec the hooks attach to.
