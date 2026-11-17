# Existing-session Claude–Codex messaging: verified local method

**Date:** November 12, 2026; bootstrap updated November 16, 2026
**Standing:** Category E — bounded engineering reference and observed tooling evidence. Not Wheelwright Product architecture, a permission grant, or a commissioned messaging service.  
**Principal instruction:** “persist this approach since it's the only thing we've gotten to work” (PR46 conversation, after the correlated acknowledgement below).

## New-thread bootstrap — updated November 16, 2026

**Purpose:** connect a new Codex thread to an already-running Claude Code conversation on the Principal's Mac, preserving each conversation's context and permissions. This is local engineering tooling, not a Wheelwright Product capability. Follow the repository bootstrap first; do not install anything merely to bootstrap messaging.

The verified directions are:

| Direction / recipient state | Observed mechanism | Boundary |
| --- | --- | --- |
| Codex → existing Claude conversation | Write a correlated request into a file watched by a background task owned by that Claude conversation; completion wakes Claude | Watcher must already be armed, or be explicitly armed in the existing Claude conversation; restarting Claude stops its watcher |
| Claude → active existing Codex turn | Recovered helper performs a WebSocket handshake over the existing local app-server Unix control socket, initializes, then calls `turn/steer` with the exact active turn ID | Demonstrated during an active PR47 turn on November 16; no replacement conversation/server |
| Claude → idle existing Codex conversation | `codex queue --thread <CURRENT_THREAD_ID> --message '<identified reply>' --resume` | Queue acceptance is not receipt; this route waited for turn completion when Codex was active |

### Procedure

1. **Recover current identities and transport state.** Identify this Codex thread and the actual existing Claude conversation using available session metadata and installed tooling. Historical IDs below are evidence, not destinations. Verify that the existing local Codex app server is running and that Claude's own file-event watcher is armed. Do not start a new Claude/Codex conversation or server as a substitute. If the watcher is absent, report that exact missing prerequisite rather than claiming a connection.
2. **Recover the working specimens.** On the Principal's Mac, the protected evidence root is `~/Library/Application Support/Wheelwright/agent-communication/`. The original watcher specimen is in `20261112-existing-session-watcher/`. The recovered live-reply helper is `20261116-claude-turn-steer/codex_ws_steer.py`, with `receipt.json`; the separate receiver receipt is `20261116-live-steer-receipt.json`. Verify the helper's SHA-256 before reuse:

   ```text
   f758c08babcc9266e8c0286b3c341032220fa37158cb61feb5e96d57c2ab0b7d
   ```

   The earlier Downloads source was `~/Downloads/claude-codex_ws_steer-2026-11-16.py`. The protected copy is the recovery locator. If it is unavailable or differs, say so; do not silently replace it with a new client. These files are local evidence, not a universally installed command.
3. **Coordinate the inbox.** `/tmp/codex-to-claude.md` was used by the existing Claude watcher. Confirm its current watch and pending-request state before writing; multiple Codex threads share this inbox. Use a unique correlation ID and include sender, intended Claude recipient, this Codex reply thread ID, bounded request and no-reply-loop instruction. Write into the watched inode; do not replace/delete it. Do not overwrite another agent's unacknowledged request. The original private-directory one-shot specimen below remains available when explicitly coordinated with Claude.
4. **Use the correct return path.** For active Codex, Claude must obtain the current active turn ID and use the recovered helper's `turn/steer` path. Its one-shot invocation shape is:

   ```sh
   python3 '<absolute protected path>/codex_ws_steer.py' steer \
     '<CURRENT_CODEX_THREAD_ID>' '<CURRENT_ACTIVE_TURN_ID>' \
     'FROM CLAUDE: <session>; correlation=<request-id>; <bounded reply>; no new Principal authority'
   ```

   A stale expected turn ID or idle recipient is not delivery. For idle Codex, use the queue fallback explicitly. Do not use `thread/inject_items` as a wake mechanism or assume `queue --resume` can steer an active turn. Respect native parent/child messaging restrictions: direct app-server input to a multi-agent sub-agent can be refused; route through its owning parent instead of bypassing the restriction.
5. **Prove one round trip.** Send a trivial request for Claude's current session identity and an acknowledgement. Require the correlated reply to arrive in this actual Codex thread. Record the identities, correlation, send/receipt times and outcome, then stop. Socket/RPC success, a queue ID, or a file appearing is not sufficient. Acknowledgements must not trigger acknowledgement loops.

### November 16 evidence and limits

PR47's receiver receipt records multiple labeled Claude messages arriving **during its ongoing active turn**, without Principal relay or waiting for that turn to finish. The helper was recovered from Claude's actual Downloads artifact and hash-verified into protected storage. An earlier claimed protected path did not exist; that mistake and its correction remain in the receipt. PR47's separately attempted `pr47-live-delivery.py` timed out during initialization and was **not** the working path. Do not retry that alternative as though it were the accepted specimen.

The recovered helper is a minimal one-shot specimen: no comprehensive WebSocket fragmentation, message-size or ping handling is claimed. Keep messages short and non-sensitive, bound each exchange, and use the trusted local socket only. The helper itself does not provide automatic idle fallback, watcher startup/rearming, restart recovery, strong sender authentication or a commissioned persistent bridge. Verify current installed behavior before reuse.

`turn/steer` carries **user-role input**. Preserve the explicit external-agent/session/correlation/no-new-authority envelope; transport role does not turn Claude into the Principal. Communication grants neither task permissions nor authority to change services, credentials, code, accounts or trades. Independent investigations must finish before conclusions are exchanged when review independence is required. Persistent configuration or service installation still needs Principal authorization.

The instructions and observed standing are published here. Raw receipts and the recovered executable remain in protected local storage; no full conversation, credentials or financial records are published by this reference. Official mechanism reference: [Codex app-server steering](https://learn.chatgpt.com/docs/app-server#steer-an-active-turn).

## What actually worked on November 12

Codex wrote a bounded request to a watched local file. A **background Bash task owned by the existing Claude Code conversation** received a macOS kernel file-change event and exited. Claude Code's background-task completion notification triggered a new turn in that same conversation. Claude read the task output and replied using:

```sh
codex queue --thread <existing-codex-thread-id> --message '<identified, correlated reply>' --resume
```

The reply arrived automatically in the existing PR46 Codex thread after its active turn ended and triggered the next turn. No Principal message relay occurred between dispatch and receipt. No replacement model conversation, Fakechat, plugin installation, CLI configuration change, or persistent service was used in the successful test.

This differs from the earlier mailbox test: neither actor manually polled for the successful test's message. The waiting shell task generated an automatic completion event. Initial watch arming was explicitly requested by the Principal; **automatic startup or rearming was not demonstrated**.

## Verified specimen and attribution

| Evidence | Observed value (UTC, November 12, 2026) |
|---|---|
| Request/correlation identity | `watch-peer-7c16fa5c-cf9a-4f0f-bb93-de280b3e6f94` |
| Existing Claude conversation | `76d02bf7-0aef-45bc-ae1a-2c745711b901` |
| Claude process/address at successful test | PID `10866`, `options-52`; address/process changed across earlier restarts, conversation ID persisted |
| Existing Codex PR46 thread | `01a1ade5-a1cc-7101-baad-b6a86328ef43` |
| Installed versions observed during investigation | Claude Code `2.1.322`; Codex CLI `0.167.1`; running Codex app server `0.167.2` |
| Claude starts watcher | `20:29:51.361Z`, Bash `run_in_background: true` |
| Initiating Claude turn ends | `20:30:02.403Z` |
| Codex writes request | `20:30:10.850117Z` |
| Claude task-completion notification | `20:30:10.984Z`, task `b02nl7hkw`, exit code 0 |
| Claude invokes native Codex queue | `20:30:19.151Z` |
| Queue acknowledgement | Message `01a1d174-4955-7c50-86c8-8c67f59d3471`, addressed to the original PR46 thread |
| Codex receipt | Correlated text arrived as the next input after Codex ended its turn; triggered an acknowledgement turn. Receipt wall-clock was recorded locally when evidence was updated, not asserted as a transport timestamp. |

Received text:

```text
FROM CLAUDE: 76d02bf7-0aef-45bc-ae1a-2c745711b901; ACK watch-peer-7c16fa5c-cf9a-4f0f-bb93-de280b3e6f94; background watcher completed and woke this existing session
```

Attribution was checked against `claude agents --json`, the specific existing Claude transcript's background invocation/completion/queue tool calls, Codex's native thread inventory, and the actual acknowledgement delivered into PR46. A successful queue command alone was not counted as delivery.

## Reproduce the November 12 one-shot mechanism

Use a new private temporary directory and unique request ID for each test. Discover current session/thread identities rather than copying the historical IDs above as universal destinations. Keep the destination Codex thread explicitly bound to the authorized exchange.

1. Create `message.txt` containing an inert baseline. Save the following script beside it as `watch.py`.
2. Ask **the existing Claude conversation** to start `python3 -I <absolute-path>/watch.py` through its Bash tool with `run_in_background: true`, then end its initiating turn. Launching an unrelated shell watcher outside Claude does not establish the required Claude-owned completion notification.
3. After `ready` exists and Claude's initiating turn has finished, Codex writes one request with a correlation ID **into the existing `message.txt` inode**. The tested script watches writes; atomic rename/replacement is not covered.
4. The request instructs Claude to make exactly one identified reply using native `codex queue ... --resume` against the existing Codex thread, then stop. It grants no additional task or execution permissions.
5. End the active Codex turn so the queued follow-up can run. Verify the matching acknowledgement in that same conversation. Do not treat a queue success status as proof of delivery.

The script used in the successful specimen (180 seconds is a bounded test timeout, not an operational policy):

```python
import os, select, pathlib, time
base = pathlib.Path(__file__).parent
fd = os.open(base / 'message.txt', os.O_RDONLY)
kq = select.kqueue()
kq.control([
    select.kevent(
        fd,
        filter=select.KQ_FILTER_VNODE,
        flags=select.KQ_EV_ADD | select.KQ_EV_CLEAR,
        fflags=select.KQ_NOTE_WRITE,
    )
], 0, 0)
(base / 'ready').write_text('WATCH_REGISTERED')
events = kq.control(None, 1, 180)
if not events:
    raise SystemExit('WATCH_TIMED_OUT')
print((base / 'message.txt').read_text(), flush=True)
```

## November 12 specimen limits and authority

- **One-shot verified; ongoing peer facility not installed.** The watcher exits on the first write or timeout. It must be explicitly rearmed for another inbound message. Do not claim continuous listening, automatic rearming, multi-message delivery, restart recovery, or unattended reliability from this specimen.
- The file event and reply queue are different mechanisms. No assertion is made that arbitrary MCP notifications can wake Codex or that Claude's native peer socket is a supported cross-vendor API.
- Use private directories/files and small non-sensitive payloads. Files and asserted sender labels do not authenticate an agent against other processes running as the same macOS user. Correlation is not cryptographic authentication.
- Messages retain agent provenance and remain untrusted task inputs. Neither agreement between agents nor a message changes Principal authority, review independence, repository permissions, or brokerage permissions.
- Bound each exchange and prohibit recursive delegation. Acknowledgement must not trigger another acknowledgement. Persistent installation/configuration changes require separate Principal approval.
- Each triggered model turn consumes the respective account's usage. No precise token or monetary measurement was captured in this test. The watcher itself is a local waiting process, not a model polling loop.
- When independent review is required, complete investigations independently before exchanging conclusions. Communication does not make self-review independent.

## Preserve the failed alternatives accurately

Fakechat's localhost WebSocket accepted earlier requests, but no corresponding Claude transcript event or correlated reply was observed. The repeated bounded live probe timed out after 90 seconds; a previous attempt timed out after five minutes. Later stale-server/startup/reconnect trouble was also reported. These establish failure of the tested setup, **not** permanent impossibility of Claude Channels. Do not repeat setup work as though these attempts never happened or describe socket acceptance as delivery.

The official `openai/codex-plugin-cc` provides Claude-to-Codex delegation/review and plugin-managed thread continuation. Inspection did not establish it as a bidirectional connection to both already-running conversations. It was not installed for this experiment.

## Recoverable evidence

Protected local evidence was copied out of temporary storage to:

```text
~/Library/Application Support/Wheelwright/agent-communication/20261112-existing-session-watcher/
```

`manifest.json` records file hashes. It includes the tested `watch.py`, request, initial instructions, send receipt, complete private `roundtrip-evidence.json`, and preceding feasibility/failed-channel records. Directory mode is 0700 and copied files are 0600. Raw transcripts remain local; no account records, credentials, or brokerage data were part of the test payload.

Complete round-trip evidence SHA-256:

```text
fd3d733c3c0a1bbdc0ef808ce3d99591c4546c7d4a59fb865fc8b6575593e49f
```

This reference preserves the method and sanitized chronology in Git even if the protected machine-local evidence is unavailable. The original `/tmp/watch-peer-…` directory is not a durable dependency.

Provider references (behavior remains subject to installed version and actual verification):

- [Codex native queue and app-server commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli)
- [Claude Channels contract](https://code.claude.com/docs/en/channels-reference)
- [Official Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc)
