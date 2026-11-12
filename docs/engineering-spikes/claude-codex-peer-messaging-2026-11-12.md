# Existing-session Claude–Codex messaging: verified local method

**Date:** November 12, 2026  
**Standing:** Category E — bounded engineering reference and observed tooling evidence. Not Wheelwright Product architecture, a permission grant, or a commissioned messaging service.  
**Principal instruction:** “persist this approach since it's the only thing we've gotten to work” (PR46 conversation, after the correlated acknowledgement below).

## What actually worked

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

## Reproduce the one-shot mechanism

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

## Limits and authority

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
