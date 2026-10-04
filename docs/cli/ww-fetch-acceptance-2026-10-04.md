# `ww fetch` bounded acceptance evidence — 2026-10-04

Status: candidate evidence for Principal review; **not** a Product acceptance decision.

## Repository and scope

- Git HEAD before and after: `1f0bc0a65fad48cf60a7e1f53742c56937db8237` (`Add ww top-level and proposed fetch manuals`). No commit or push in this pass.
- Working tree before this pass was already dirty with the uncommitted fetch candidate and documentation: `docs/README.md`, deleted `docs/cli/ww-fetch-man-proposed.txt`, `docs/cli/ww-man.txt`, `docs/journal/project-journal-5.md`, `docs/parking-lot-10.md`, `options-prototype/src/roadmap/roadmap-projection.json`, `scripts/wheelwright.mjs`, `scripts/wheelwright.test.mjs`, and untracked `docs/cli/ww-fetch-man.txt`, `docs/cli/ww-prices-man.txt`, `docs/cli/ww-sort-man.txt`. This pass preserved those changes.
- Scope: reconcile fetch's human wording, exercise the real CLI adapter against deterministic HTTP fixtures, check existing regressions, and walk the local Wheelwright backend. No `ww ls` implementation, `ww prices`/`ww sort` redesign, backend change, or distribution work.
- Changes in this pass: `scripts/wheelwright.mjs` chooses verbose local-state qualifications from the independent acquisition outcome and `heldPrice`; `scripts/wheelwright.test.mjs` expectations follow that wording; `docs/cli/ww-fetch-man.txt` describes it. New `scripts/ww-fetch.acceptance.mjs` runs black-box cases through `scripts/ww`; test-only `scripts/ww-acceptance-pty.py` gives stdout and stderr separate TTYs. This report and its `docs/README.md` index entry preserve evidence.

## Contract under test

Explicit symbol operands are normalized and deduplicated. Exit `0` requires completed work and a locally stored price for every distinct symbol; exit `1` means failure, noncompletion, or any absent price; exit `2` is usage error. Acquisition outcome and stored-price state remain independent. Verbose `From` names the Wheelwright origin actually contacted, not its upstream provider. Successful TTY quiet fetch is silent; non-TTY quiet fetch still emits completed per-symbol JSONL results. Noncompletion emits no certified per-symbol records. `ww refresh` remains retired; bare `ww fetch` has no default context in this candidate. The aggregate phrase `N/N prices held` remains provisional Product wording.

## Deterministic fixture and execution method

The runner starts a loopback HTTP server on an ephemeral port. It returns explicit completed or incomplete targeted-refresh results, per-symbol invocation outcomes and held-price booleans, or a deliberate HTTP 503. It records the actual method, path, and repeated `symbol` query parameters. Assertions run through the executable `scripts/ww` PATH adapter with real argv, process streams, exit status, and HTTP interaction. TTY cases use the two-PTY helper, so stdout and stderr remain separately observable; the helper is test infrastructure and imposes no Python runtime dependency on `ww`. Non-TTY cases capture process pipes, equivalent to redirected stdout for TTY detection. Raw streams below are JSON-escaped so `\r\n`, `\n`, and control bytes remain exact.

Executed suite command from repository root:

```sh
node scripts/ww-fetch.acceptance.mjs > /tmp/ww-fetch-acceptance-cases.md
```

Actual runner stdout was redirected into that evidence file; runner stderr was empty; exit status `0`. The complete case inventory and actual command/stream/status evidence follows. The ephemeral fixture port in each command is the one actually used in this run.

# Deterministic ww fetch acceptance evidence

Fixture origin: `http://127.0.0.1:63415`. Each request is handled by a local HTTP server with an explicit completed/incomplete response and per-symbol acquisition/held-price facts. TTY cases use the test-only two-PTY helper so stdout and stderr remain separate. Output below is JSON-escaped to preserve exact newlines and control bytes.

Result: **26 passed / 0 failed / 0 not executable**.

## A01 normal explicit symbols, TTY — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 python3 scripts/ww-acceptance-pty.py ./scripts/ww fetch QQQ SPY XLE`

Actual stdout: `""`

Actual stderr: `"fetch complete: 3/3 prices held\r\n"`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ","SPY","XLE"]}]`

## A02 verbose TTY and Wheelwright origin — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 python3 scripts/ww-acceptance-pty.py ./scripts/ww fetch -v QQQ SPY XLE`

Actual stdout: `""`

Actual stderr: `"From http://127.0.0.1:63415\r\nQQQ  acquisition ACQUIRED\r\nSPY  acquisition ACQUIRED\r\nXLE  acquisition ACQUIRED\r\nfetch complete: 3/3 prices held\r\n"`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ","SPY","XLE"]}]`

## A03 quiet TTY is silent — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 python3 scripts/ww-acceptance-pty.py ./scripts/ww fetch -q QQQ SPY XLE`

Actual stdout: `""`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ","SPY","XLE"]}]`

## A04 quiet redirected streams retain records — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch --quiet QQQ SPY XLE`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"QQQ\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n{\"kind\":\"fetch-result/v1\",\"symbol\":\"SPY\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n{\"kind\":\"fetch-result/v1\",\"symbol\":\"XLE\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ","SPY","XLE"]}]`

## A05 quiet and verbose conflict before HTTP — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -q --verbose QQQ`

Actual stdout: `""`

Actual stderr: `"ww: fetch: --quiet and --verbose cannot be combined\nTry 'ww --help'.\n"`

Actual exit status: `2`

HTTP requests: `[]`

## A06 failed attempt with previous price still succeeds — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -v QQQ SPY`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"QQQ\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n{\"kind\":\"fetch-result/v1\",\"symbol\":\"SPY\",\"acquisitionOutcome\":\"FAILED\",\"heldPrice\":true}\n"`

Actual stderr: `"From http://127.0.0.1:63415\nQQQ  acquisition ACQUIRED\nSPY  acquisition FAILED    previous price retained\nfetch complete: 2/2 prices held\n"`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ","SPY"]}]`

## A07 failed attempt without local price fails — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -v QQQ XLE`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"QQQ\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n{\"kind\":\"fetch-result/v1\",\"symbol\":\"XLE\",\"acquisitionOutcome\":\"FAILED\",\"heldPrice\":false}\n"`

Actual stderr: `"From http://127.0.0.1:63415\nQQQ  acquisition ACQUIRED\nXLE  acquisition FAILED    no local price stored\nww: fetch completed; 1/2 prices held; XLE has no local price stored\n"`

Actual exit status: `1`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ","XLE"]}]`

## A08 ACQUIRED without local price still fails — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -v XLE`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"XLE\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":false}\n"`

Actual stderr: `"From http://127.0.0.1:63415\nXLE  acquisition ACQUIRED  no local price stored\nww: fetch completed; 0/1 prices held; XLE has no local price stored\n"`

Actual exit status: `1`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["XLE"]}]`

## A09 UNKNOWN with local price stays neutral — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -v QQQ`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"QQQ\",\"acquisitionOutcome\":\"UNKNOWN\",\"heldPrice\":true}\n"`

Actual stderr: `"From http://127.0.0.1:63415\nQQQ  acquisition UNKNOWN  local price stored\nfetch complete: 1/1 prices held\n"`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ"]}]`

## A10 noncompletion certifies no per-symbol records — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -v QQQ`

Actual stdout: `""`

Actual stderr: `"ww: fetch did not complete (NOT_COMPLETED)\n"`

Actual exit status: `1`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ"]}]`

## A11 duplicate and case-varied operands normalize — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch qqq QQQ SPY`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"QQQ\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n{\"kind\":\"fetch-result/v1\",\"symbol\":\"SPY\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ","SPY"]}]`

## A12 duplicate count in terminal summary — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 python3 scripts/ww-acceptance-pty.py ./scripts/ww fetch qqq QQQ SPY`

Actual stdout: `""`

Actual stderr: `"fetch complete: 2/2 prices held\r\n"`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ","SPY"]}]`

## A13 WW_BASE_URL selects the reported authority — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63427 ./scripts/ww fetch -v QQQ`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"QQQ\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n"`

Actual stderr: `"From http://127.0.0.1:63427\nQQQ  acquisition ACQUIRED\nfetch complete: 1/1 prices held\n"`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ"]}]`

## A14 HTTP failure stays on stderr — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch QQQ`

Actual stdout: `""`

Actual stderr: `"ww: backend returned HTTP 503\n"`

Actual exit status: `1`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ"]}]`

## A15 quiet failure still diagnoses — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -q XLE`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"XLE\",\"acquisitionOutcome\":\"FAILED\",\"heldPrice\":false}\n"`

Actual stderr: `"ww: fetch completed; 0/1 prices held; XLE has no local price stored\n"`

Actual exit status: `1`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["XLE"]}]`

## A16 incomplete backend response cannot certify results — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch QQQ`

Actual stdout: `""`

Actual stderr: `"ww: backend returned per-symbol results for incomplete refresh\n"`

Actual exit status: `1`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ"]}]`

## A17 top-level -h — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww -h`

Actual stdout: `"Usage: ww <command> [options]\n       ww --help | --man\n\nSmall Wheelwright evidence tools for people, shells, and agents.\nUse explicit symbols. Reading never silently acquires; acquisition never claims\nfreshness or suitability. Pipe commands without a format flag.\n\nWorking commands:\n  fetch [-q | -v] SYMBOL...  Acquire evidence; succeed when all requested prices are held\n  prices SYMBOL...          Inspect currently held underlying price evidence (read-only)\n  sort --by FIELD           Reorder ww price records from stdin (price or symbol)\n\nExample:\n  ww fetch QQQ SPY XLE && ww prices QQQ SPY XLE | ww sort --by price\n\nTTY output is for humans; pipe/redirect output is bounded JSON Lines.\nResults go to stdout; diagnostics go to stderr. Exit status controls &&.\nUse 'ww <command> --help' or '--man' for command details; 'ww --man'\ndescribes the current CLI. 'ww observed-prices' remains a prices alias.\nBackend: WW_BASE_URL (default http://localhost:3100).\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[]`

## A17b top-level --help — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww --help`

Actual stdout: `"Usage: ww <command> [options]\n       ww --help | --man\n\nSmall Wheelwright evidence tools for people, shells, and agents.\nUse explicit symbols. Reading never silently acquires; acquisition never claims\nfreshness or suitability. Pipe commands without a format flag.\n\nWorking commands:\n  fetch [-q | -v] SYMBOL...  Acquire evidence; succeed when all requested prices are held\n  prices SYMBOL...          Inspect currently held underlying price evidence (read-only)\n  sort --by FIELD           Reorder ww price records from stdin (price or symbol)\n\nExample:\n  ww fetch QQQ SPY XLE && ww prices QQQ SPY XLE | ww sort --by price\n\nTTY output is for humans; pipe/redirect output is bounded JSON Lines.\nResults go to stdout; diagnostics go to stderr. Exit status controls &&.\nUse 'ww <command> --help' or '--man' for command details; 'ww --man'\ndescribes the current CLI. 'ww observed-prices' remains a prices alias.\nBackend: WW_BASE_URL (default http://localhost:3100).\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[]`

## A18 top-level --man — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww --man`

Actual stdout: `"WW(1)                       Wheelwright Manual                      WW(1)\n\nNAME\n    ww — inspect and acquire Wheelwright evidence with Unix commands\n\nSYNOPSIS\n    ww [--help | -h | --man]\n    ww COMMAND [OPTIONS] [OPERANDS]\n\nDESCRIPTION\n    ww supplies small evidence capabilities to people, shell scripts, and\n    agents. The shell composes commands with pipes, redirection, and &&.\n    Reading held evidence is separate from asking Wheelwright to acquire it.\n\nWORKING COMMANDS\n    fetch [-q | -v] SYMBOL...\n        Ask the existing backend to acquire evidence for explicit symbols.\n        Exit 0 only after completed work with a held price for every requested\n        symbol. A previously held price may survive a failed acquisition.\n        Normal terminal status goes to stderr; -q/--quiet suppresses it.\n        -v/--verbose reports the Wheelwright endpoint contacted, invocation\n        outcome, and held state per symbol without displaying prices or\n        claiming upstream provider provenance.\n        Run 'ww fetch --help' or 'ww fetch --man' for the current contract.\n\n    prices SYMBOL...\n        Read the underlying prices Wheelwright currently holds, including\n        explicit absence and acquisition state. This never acquires evidence.\n        Run 'ww prices --help' or 'ww prices --man' for evidence limits.\n\n    sort --by FIELD [--descending]\n        Read ww price composition records from stdin and emit those same\n        records ordered by numeric price or symbol. When sorting by price,\n        missing prices sort last.\n        Price order is ascending unless --descending is given.\n        Run 'ww sort --help' or 'ww sort --man' for the bounded input format.\n\n    observed-prices SYMBOL...\n        Compatibility spelling for prices. The same read and output behavior\n        applies; new examples use prices.\n\nOUTPUT AND COMPOSITION\n    Direct terminal output is human-oriented. When stdout is piped or\n    redirected, prices and sort emit bounded JSON Lines price records;\n    fetch emits bounded per-symbol result records after completed work. Fetch\n    writes its concise human status to terminal stderr and leaves terminal\n    stdout empty. This is not a universal ww wire-format commitment. Results\n    go to stdout; status and diagnostics go to stderr. Neither progress nor\n    decoration belongs in composition stdout.\n\n    A useful composition is:\n\n        ww fetch QQQ SPY XLE && ww prices QQQ SPY XLE | ww sort --by price\n\n    The shell runs prices only if fetch returns success. The pipe then\n    passes price records to sort, which orders them numerically. Fetching\n    evidence does not itself display prices or judge whether they are timely\n    enough for a purpose.\n\nEXIT STATUS\n    0   Command succeeded under its documented contract.\n    1   Backend, input-record, or evidence-operation failure.\n    2   Invalid usage.\n\n    Detailed backend outcomes are not encoded as a catalog of exit codes.\n    See command help for the meaning of success and failure in each command.\n\nEVIDENCE LIMITS\n    A held price is not a guaranteed current market price. The timestamp\n    associated with a price through the primary option chain is not an\n    independently established underlying-quote acquisition time. ww does\n    not infer quote age, freshness, trade suitability, or recommendations.\n\nDISCOVERY\n    ww --help                  Short command list and example\n    ww --man                   This current top-level manual\n    ww COMMAND --help          Terse command-specific help\n    ww COMMAND --man           Current command-specific behavioral manual\n\nENVIRONMENT\n    WW_BASE_URL   Backend base URL; default http://localhost:3100\n\nSEE ALSO\n    ww fetch --man, ww prices --man, ww sort --man\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[]`

## A19 fetch -h — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -h`

Actual stdout: `"Usage: ww fetch [-q | --quiet | -v | --verbose] [--] SYMBOL...\n\nAsk the existing Wheelwright backend to run targeted evidence acquisition for\nexplicit symbols. This changes Wheelwright's evidence store. It is separate\nfrom prices, which only reads held evidence.\n\nThe backend reports whether the targeted operation completed and, for each\nsymbol, its acquisition outcome and whether a price is held afterward. A\npreserved earlier price can be held after a failed acquisition. A completed\nattempt with no held price is not success. Exit status is zero only when the\noperation completed and every requested symbol has a held price.\n\nHeld does not mean newly acquired, fresh, independently timestamped as an\nunderlying quote, or suitable for a trading decision. The exact held price\nand its evidence state are read with ww prices.\n\nOn success, a terminal stderr receives a concise held-price completion count.\n-q/--quiet suppresses that status and nonfatal notices, not errors. When\nstdout is piped or redirected, it emits one bounded JSON Lines result per\nrequested symbol after completion. An incomplete operation emits no records.\nUse -v/--verbose for each symbol's invocation acquisition outcome and held-price\nstate on stderr. Its From line identifies the Wheelwright service endpoint\nconsulted, not an upstream market-data provider. It does not report prices.\nQuiet and verbose cannot be combined.\n\nExample:\n  ww fetch QQQ && ww prices QQQ\n\nUse 'ww fetch --man' for the full behavioral contract.\nBackend: WW_BASE_URL (default http://localhost:3100).\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[]`

## A20 fetch --help — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch --help`

Actual stdout: `"Usage: ww fetch [-q | --quiet | -v | --verbose] [--] SYMBOL...\n\nAsk the existing Wheelwright backend to run targeted evidence acquisition for\nexplicit symbols. This changes Wheelwright's evidence store. It is separate\nfrom prices, which only reads held evidence.\n\nThe backend reports whether the targeted operation completed and, for each\nsymbol, its acquisition outcome and whether a price is held afterward. A\npreserved earlier price can be held after a failed acquisition. A completed\nattempt with no held price is not success. Exit status is zero only when the\noperation completed and every requested symbol has a held price.\n\nHeld does not mean newly acquired, fresh, independently timestamped as an\nunderlying quote, or suitable for a trading decision. The exact held price\nand its evidence state are read with ww prices.\n\nOn success, a terminal stderr receives a concise held-price completion count.\n-q/--quiet suppresses that status and nonfatal notices, not errors. When\nstdout is piped or redirected, it emits one bounded JSON Lines result per\nrequested symbol after completion. An incomplete operation emits no records.\nUse -v/--verbose for each symbol's invocation acquisition outcome and held-price\nstate on stderr. Its From line identifies the Wheelwright service endpoint\nconsulted, not an upstream market-data provider. It does not report prices.\nQuiet and verbose cannot be combined.\n\nExample:\n  ww fetch QQQ && ww prices QQQ\n\nUse 'ww fetch --man' for the full behavioral contract.\nBackend: WW_BASE_URL (default http://localhost:3100).\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[]`

## A21 fetch --man — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch --man`

Actual stdout: `"WW-FETCH(1)                 Wheelwright Manual                WW-FETCH(1)\n\nNAME\n    ww fetch — request market observations for specified symbols\n\nSYNOPSIS\n    ww fetch [-q | --quiet | -v | --verbose] [--] SYMBOL...\n\nDESCRIPTION\n    Ask Wheelwright to acquire evidence for each specified symbol, then report\n    whether it holds a price for every requested symbol.\n\n    Fetch updates Wheelwright's held knowledge. It does not display prices;\n    use ww prices for that. It does not guarantee a new observation, a current\n    market price, freshness, or suitability for a trading decision.\n\n    A failed acquisition attempt may leave an earlier price held. In that\n    case, fetch can succeed because its postcondition concerns held prices\n    after the completed operation, not whether every attempt acquired a new\n    value.\n\nOPTIONS\n    -q, --quiet\n        Suppress normal human status and nonfatal notices. Errors still appear\n        on stderr. Quiet does not change exit status or composition records.\n\n    -v, --verbose\n        On completed work, show each requested symbol's acquisition outcome\n        from this invocation and qualify its local price state when useful. Write\n        the detail to stderr, followed by the held-price summary on success.\n        From identifies the Wheelwright authority actually contacted by ww.\n        It does not identify Wheelwright's upstream\n        market-data provider or per-symbol evidence provenance. Verbose does\n        not display prices. Verbose and quiet are mutually exclusive.\n\n    --\n        End option parsing. Remaining arguments are symbol operands.\n\nOUTPUT\n    In default mode, on successful completion when stderr is a terminal,\n    write to stderr:\n\n        fetch complete: 3/3 prices held\n\n    The count is held prices over distinct requested symbols. It is not a\n    count of newly acquired observations or successful provider attempts.\n    This is a completion summary, not an incremental progress meter.\n\n    If an acquisition attempt did not succeed but Wheelwright retains an\n    earlier price, normal terminal diagnostics identify that fact without\n    treating the price as newly acquired.\n\n    Verbose mode writes its detail and successful summary to stderr even when\n    stderr is redirected. For a completed verbose fetch, it can show:\n\n        From http://localhost:3100\n        QQQ  acquisition ACQUIRED\n        SPY  acquisition FAILED    previous price retained\n        XLE  acquisition ACQUIRED\n        fetch complete: 3/3 prices held\n\n    ACQUIRED is the backend's invocation acquisition outcome. It does not\n    independently certify a new underlying quote or a locally stored price.\n    If a completed result has no locally stored price, even ACQUIRED is\n    qualified with \"no local price stored\" and the command exits nonzero.\n    UNKNOWN with a locally stored price uses the neutral phrase \"local price\n    stored\"; it cannot establish that a previous price was retained.\n\n    Direct terminal stdout is empty. When stdout is piped or redirected, it\n    carries bounded per-symbol JSON Lines records with acquisitionOutcome and\n    heldPrice as independent facts. Human status never contaminates those\n    records. An incomplete operation does not certify after-completion symbol\n    results and emits no composition records.\n\nEXIT STATUS\n    0   Operation completed and every requested symbol has a held price.\n    1   Operation failed, did not complete, or left a requested price absent.\n    2   Invalid command usage.\n\n    Diagnostics identify affected symbols where the backend can establish\n    them. Exit status does not encode detailed backend acquisition outcomes.\n\nEXAMPLES\n    ww fetch QQQ SPY XLE && ww prices QQQ SPY XLE\n\n    ww fetch -q QQQ SPY XLE && ww prices QQQ SPY XLE\n\n    ww fetch -v QQQ SPY XLE\n\n    A completed fetch with XLE absent exits nonzero and reports on stderr:\n\n        ww: fetch completed; 2/3 prices held; XLE has no local price stored\n\nUNRESOLVED DEFAULT CONTEXT\n    Bare ww fetch is not implemented. It requires an authoritative default\n    market context or a separately marked provisional experiment. The current\n    command requires explicit symbols; operands replace any future default.\n\nSEE ALSO\n    ww prices, ww sort\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[]`

## A21b long --verbose matches short verbose — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch --verbose QQQ`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"QQQ\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n"`

Actual stderr: `"From http://127.0.0.1:63415\nQQQ  acquisition ACQUIRED\nfetch complete: 1/1 prices held\n"`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ"]}]`

## A22 bare fetch is usage error, no whole-cycle HTTP — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch`

Actual stdout: `""`

Actual stderr: `"ww: fetch: at least one symbol is required\nTry 'ww --help'.\n"`

Actual exit status: `2`

HTTP requests: `[]`

## A23 -- terminates fetch options — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 ./scripts/ww fetch -- QQQ`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"QQQ\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["QQQ"]}]`

## A24 large fetch into head has no broken-pipe stack trace — PASS

Command: `WW_BASE_URL=http://127.0.0.1:63415 zsh -c "set -o pipefail; ./scripts/ww fetch AA AB AC AD AE AF AG AH AI AJ AK AL AM AN AO AP AQ AR AS AT AU AV AW AX AY AZ BA BB BC BD BE BF BG BH BI BJ BK BL BM BN BO BP BQ BR BS BT BU BV BW BX BY BZ CA CB CC CD CE CF CG CH CI CJ CK CL CM CN CO CP CQ CR CS CT CU CV CW CX CY CZ DA DB DC DD DE DF DG DH DI DJ DK DL DM DN DO DP DQ DR DS DT DU DV DW DX DY DZ EA EB EC ED EE EF EG EH EI EJ EK EL EM EN EO EP EQ ER ES ET EU EV EW EX EY EZ FA FB FC FD FE FF FG FH FI FJ FK FL FM FN FO FP FQ FR FS FT FU FV FW FX FY FZ GA GB GC GD GE GF GG GH GI GJ GK GL GM GN GO GP GQ GR GS GT GU GV GW GX GY GZ HA HB HC HD HE HF HG HH HI HJ HK HL HM HN HO HP HQ HR HS HT HU HV HW HX HY HZ IA IB IC ID IE IF IG IH II IJ IK IL IM IN IO IP IQ IR IS IT IU IV IW IX IY IZ JA JB JC JD JE JF JG JH JI JJ JK JL JM JN JO JP JQ JR JS JT JU JV JW JX JY JZ KA KB KC KD KE KF KG KH KI KJ KK KL KM KN KO KP KQ KR KS KT KU KV KW KX KY KZ LA LB LC LD LE LF LG LH LI LJ LK LL LM LN LO LP LQ LR LS LT LU LV LW LX LY LZ MA MB MC MD ME MF MG MH MI MJ MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NB NC ND NE NF NG NH NI NJ NK NL NM NN NO NP NQ NR NS NT NU NV NW NX NY NZ OA OB OC OD OE OF OG OH OI OJ OK OL OM ON OO OP OQ OR OS OT OU OV OW OX OY OZ PA PB PC PD PE PF PG PH PI PJ PK PL PM PN PO PP PQ PR PS PT PU PV PW PX PY PZ QA QB QC QD QE QF QG QH QI QJ QK QL QM QN QO QP QQ QR QS QT QU QV QW QX QY QZ RA RB RC RD RE RF RG RH RI RJ RK RL RM RN RO RP RQ RR RS RT RU RV RW RX RY RZ SA SB SC SD SE SF SG SH SI SJ SK SL SM SN SO SP SQ SR SS ST SU SV SW SX SY SZ TA TB TC TD TE TF TG TH TI TJ TK TL TM TN TO TP TQ TR TS TT TU TV TW TX TY TZ UA UB UC UD UE UF UG UH UI UJ UK UL UM UN UO UP UQ UR US UT UU UV UW UX UY UZ VA VB VC VD VE VF VG VH VI VJ VK VL VM VN VO VP VQ VR VS VT VU VV VW VX VY VZ WA WB WC WD WE WF WG WH WI WJ WK WL WM WN WO WP WQ WR WS WT WU WV WW WX WY WZ XA XB XC XD XE XF XG XH XI XJ XK XL XM XN XO XP XQ XR XS XT XU XV XW XX XY XZ YA YB YC YD YE YF YG YH YI YJ YK YL YM YN YO YP YQ YR YS YT YU YV YW YX YY YZ | head -1"`

Actual stdout: `"{\"kind\":\"fetch-result/v1\",\"symbol\":\"AA\",\"acquisitionOutcome\":\"ACQUIRED\",\"heldPrice\":true}\n"`

Actual stderr: `""`

Actual exit status: `0`

HTTP requests: `[{"method":"POST","path":"/api/evidence/refresh","symbols":["AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL","AM","AN","AO","AP","AQ","AR","AS","AT","AU","AV","AW","AX","AY","AZ","BA","BB","BC","BD","BE","BF","BG","BH","BI","BJ","BK","BL","BM","BN","BO","BP","BQ","BR","BS","BT","BU","BV","BW","BX","BY","BZ","CA","CB","CC","CD","CE","CF","CG","CH","CI","CJ","CK","CL","CM","CN","CO","CP","CQ","CR","CS","CT","CU","CV","CW","CX","CY","CZ","DA","DB","DC","DD","DE","DF","DG","DH","DI","DJ","DK","DL","DM","DN","DO","DP","DQ","DR","DS","DT","DU","DV","DW","DX","DY","DZ","EA","EB","EC","ED","EE","EF","EG","EH","EI","EJ","EK","EL","EM","EN","EO","EP","EQ","ER","ES","ET","EU","EV","EW","EX","EY","EZ","FA","FB","FC","FD","FE","FF","FG","FH","FI","FJ","FK","FL","FM","FN","FO","FP","FQ","FR","FS","FT","FU","FV","FW","FX","FY","FZ","GA","GB","GC","GD","GE","GF","GG","GH","GI","GJ","GK","GL","GM","GN","GO","GP","GQ","GR","GS","GT","GU","GV","GW","GX","GY","GZ","HA","HB","HC","HD","HE","HF","HG","HH","HI","HJ","HK","HL","HM","HN","HO","HP","HQ","HR","HS","HT","HU","HV","HW","HX","HY","HZ","IA","IB","IC","ID","IE","IF","IG","IH","II","IJ","IK","IL","IM","IN","IO","IP","IQ","IR","IS","IT","IU","IV","IW","IX","IY","IZ","JA","JB","JC","JD","JE","JF","JG","JH","JI","JJ","JK","JL","JM","JN","JO","JP","JQ","JR","JS","JT","JU","JV","JW","JX","JY","JZ","KA","KB","KC","KD","KE","KF","KG","KH","KI","KJ","KK","KL","KM","KN","KO","KP","KQ","KR","KS","KT","KU","KV","KW","KX","KY","KZ","LA","LB","LC","LD","LE","LF","LG","LH","LI","LJ","LK","LL","LM","LN","LO","LP","LQ","LR","LS","LT","LU","LV","LW","LX","LY","LZ","MA","MB","MC","MD","ME","MF","MG","MH","MI","MJ","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NB","NC","ND","NE","NF","NG","NH","NI","NJ","NK","NL","NM","NN","NO","NP","NQ","NR","NS","NT","NU","NV","NW","NX","NY","NZ","OA","OB","OC","OD","OE","OF","OG","OH","OI","OJ","OK","OL","OM","ON","OO","OP","OQ","OR","OS","OT","OU","OV","OW","OX","OY","OZ","PA","PB","PC","PD","PE","PF","PG","PH","PI","PJ","PK","PL","PM","PN","PO","PP","PQ","PR","PS","PT","PU","PV","PW","PX","PY","PZ","QA","QB","QC","QD","QE","QF","QG","QH","QI","QJ","QK","QL","QM","QN","QO","QP","QQ","QR","QS","QT","QU","QV","QW","QX","QY","QZ","RA","RB","RC","RD","RE","RF","RG","RH","RI","RJ","RK","RL","RM","RN","RO","RP","RQ","RR","RS","RT","RU","RV","RW","RX","RY","RZ","SA","SB","SC","SD","SE","SF","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SP","SQ","SR","SS","ST","SU","SV","SW","SX","SY","SZ","TA","TB","TC","TD","TE","TF","TG","TH","TI","TJ","TK","TL","TM","TN","TO","TP","TQ","TR","TS","TT","TU","TV","TW","TX","TY","TZ","UA","UB","UC","UD","UE","UF","UG","UH","UI","UJ","UK","UL","UM","UN","UO","UP","UQ","UR","US","UT","UU","UV","UW","UX","UY","UZ","VA","VB","VC","VD","VE","VF","VG","VH","VI","VJ","VK","VL","VM","VN","VO","VP","VQ","VR","VS","VT","VU","VV","VW","VX","VY","VZ","WA","WB","WC","WD","WE","WF","WG","WH","WI","WJ","WK","WL","WM","WN","WO","WP","WQ","WR","WS","WT","WU","WV","WW","WX","WY","WZ","XA","XB","XC","XD","XE","XF","XG","XH","XI","XJ","XK","XL","XM","XN","XO","XP","XQ","XR","XS","XT","XU","XV","XW","XX","XY","XZ","YA","YB","YC","YD","YE","YF","YG","YH","YI","YJ","YK","YL","YM","YN","YO","YP","YQ","YR","YS","YT","YU","YV","YW","YX","YY","YZ"]}]`



## Real Wheelwright terminal walk

The local service at `http://localhost:3100` answered a read-only quote probe before the walk (HTTP 200, QQQ numeric price 749.58). That probe establishes availability only; the acceptance observation below comes from the actual fetch invocations.

### R01 — verbose fetch at a terminal: PASS

Exact command from repository root:

```sh
python3 scripts/ww-acceptance-pty.py ./scripts/ww fetch -v QQQ SPY XLE
```

The helper runs `./scripts/ww fetch -v QQQ SPY XLE` with separate stdout and stderr PTYs. Actual helper stdout, preserving exact child streams:

```json
{"status": 0, "stdout": "", "stderr": "From http://localhost:3100\r\nQQQ  acquisition ACQUIRED\r\nSPY  acquisition ACQUIRED\r\nXLE  acquisition ACQUIRED\r\nfetch complete: 3/3 prices held\r\n"}
```

Helper stderr: empty. Helper exit: `0`; child exit: `0`. No price was printed by fetch, and `From` names the Wheelwright service.

### R02 — quiet fetch with redirected output: PASS

Exact command:

```sh
./scripts/ww fetch -q QQQ SPY XLE > /tmp/ww-fetch-real.jsonl 2> /tmp/ww-fetch-real.err
```

Actual process stdout and stderr after shell redirection: both empty; exit `0`. Inspection commands `cat /tmp/ww-fetch-real.jsonl` and `cat /tmp/ww-fetch-real.err` each exited `0`. Their actual stdout:

```text
{"kind":"fetch-result/v1","symbol":"QQQ","acquisitionOutcome":"ACQUIRED","heldPrice":true}
{"kind":"fetch-result/v1","symbol":"SPY","acquisitionOutcome":"ACQUIRED","heldPrice":true}
{"kind":"fetch-result/v1","symbol":"XLE","acquisitionOutcome":"ACQUIRED","heldPrice":true}
```

The stderr file was empty. `wc -c /tmp/ww-fetch-real.jsonl /tmp/ww-fetch-real.err` exited `0` and reported 273 bytes and 0 bytes respectively.

### R03 — assembled shell composition at a terminal: PASS

Exact command:

```sh
python3 scripts/ww-acceptance-pty.py zsh -c './scripts/ww fetch -q QQQ SPY XLE && ./scripts/ww prices QQQ SPY XLE | ./scripts/ww sort --by price'
```

Actual helper stdout (JSON-escaped child streams):

```json
{"status": 0, "stdout": "Held underlying prices (chain-associated time is not quote acquisition time)\r\nSYMBOL  PRICE   PREV CLOSE  CHAIN-ASSOCIATED AT          ACQUISITION  LAST ATTEMPT                 FAILS  GEN  PUBLISHED AT\r\nXLE     62.82   62.7        2026-10-04T17:02:09.532671Z  ready        2026-10-04T17:02:09.532671Z  0      11   2026-10-04T17:02:49.680047Z\r\nQQQ     749.58  742.03      2026-10-04T17:02:01.820517Z  ready        2026-10-04T17:02:01.820517Z  0      11   2026-10-04T17:02:49.680047Z\r\nSPY     769.64  763.99      2026-10-04T17:02:06.992441Z  ready        2026-10-04T17:02:06.992441Z  0      11   2026-10-04T17:02:49.680047Z\r\n", "stderr": ""}
```

Helper stderr: empty. Helper exit: `0`; child shell exit: `0`. Numeric ascending order was XLE, QQQ, SPY. This uses the existing provisional `prices` and `ww sort` solely to walk the already implemented composition path.

A captured non-TTY form of the same `&&` expression was also executed:

```sh
./scripts/ww fetch -q QQQ SPY XLE && ./scripts/ww prices QQQ SPY XLE | ./scripts/ww sort --by price
```

It exited `0`, stderr was empty, and actual stdout was:

```jsonl
{"kind":"fetch-result/v1","symbol":"QQQ","acquisitionOutcome":"ACQUIRED","heldPrice":true}
{"kind":"fetch-result/v1","symbol":"SPY","acquisitionOutcome":"ACQUIRED","heldPrice":true}
{"kind":"fetch-result/v1","symbol":"XLE","acquisitionOutcome":"ACQUIRED","heldPrice":true}
{"kind":"observed-price/v1","symbol":"XLE","price":62.82,"previousClose":62.7,"priceAssociatedChainAt":"2026-10-04T17:02:09.532671Z","acquisitionStatus":"ready","lastAttemptAt":"2026-10-04T17:02:09.532671Z","failureCount":0,"generation":10,"generatedAt":"2026-10-04T17:02:34.478789Z"}
{"kind":"observed-price/v1","symbol":"QQQ","price":749.58,"previousClose":742.03,"priceAssociatedChainAt":"2026-10-04T17:02:01.820517Z","acquisitionStatus":"ready","lastAttemptAt":"2026-10-04T17:02:01.820517Z","failureCount":0,"generation":10,"generatedAt":"2026-10-04T17:02:34.478789Z"}
{"kind":"observed-price/v1","symbol":"SPY","price":769.64,"previousClose":763.99,"priceAssociatedChainAt":"2026-10-04T17:02:06.992441Z","acquisitionStatus":"ready","lastAttemptAt":"2026-10-04T17:02:06.992441Z","failureCount":0,"generation":10,"generatedAt":"2026-10-04T17:02:34.478789Z"}
```

This is an important descriptor/context distinction: quiet suppresses human status, while non-TTY stdout still carries fetch results. Consumers capturing the entire `&&` expression receive both commands' result streams; the TTY walk has only the final price table.

## Existing regression and consistency checks

All commands were run after the fetch change and acceptance runner were in place:

```sh
node --test scripts/wheelwright.test.mjs
```

Exit `0`; actual summary:

```text
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1364.011916
```

The eight named checks covered argument/help, quote absence and timestamp semantics, targeted fetch contract, shell exit behavior, TTY/quiet/pipe representation, numeric sort/null/ties/record preservation, backend error and composition, malformed stdin and broken pipe. No existing check failed.

```sh
cd options-prototype
npm run check:roadmap-projection
```

Exit `0`; actual output:

```text
> options-prototype@0.0.0 check:roadmap-projection
> node scripts/generate-roadmap-projection.mjs --check

[generate-roadmap-projection] --check: projection is in sync with canonical authority.
```

`git diff --check` exited `0` with no output.

## Limits, unresolved wording, and future acceptance direction

- The 26 deterministic cases cover the requested CLI categories, with 0 failed and 0 not executable. This is **not comprehensive end-to-end backend failure coverage**: the fixture proves CLI behavior for synthetic completion/noncompletion and independent outcome/held-price combinations, but does not independently prove the backend scheduler's real timeout behavior. The live walk exercised a successful real backend, not a forced real timeout.
- A24's 650-row `head -1` pipeline returned cleanly under `pipefail` with no stack trace. It observes the conventional pipeline result; the test does not instrument whether a kernel EPIPE was delivered on that particular run.
- `N/N prices held` remains provisional aggregate Product wording. The tests intentionally freeze current candidate bytes while flagging that wording for separate Product review.
- No new backend capability deficit arose in this pass. The previously known authoritative default-context deficit remains: bare `ww fetch` cannot yet select a Wheelwright-governed symbol set. No fixed fixture or whole-cycle backend call was introduced.
- `From` identifies the Wheelwright origin used for the HTTP request. It makes no upstream provider-provenance claim. The user-facing `UNKNOWN` + held wording is neutrally `local price stored`; it does not assert a prior price was retained.
- No `ww ls` implementation was performed. No `ww prices` or `ww sort` redesign was performed.

The next `ww ls` acceptance design should challenge what one default row represents before choosing a two-column price layout. For explicit symbols, the future Unix gauntlet should test TTY versus redirection; `cut -f1`; nontrivial numeric `sort -t $'\t' -k2,2n`; `awk -F '\t'`; `rg` line selection; a simple `sed` transform; clean command substitution and ordinary redirection; a sufficiently large stream through `head` to exercise early closure; no ANSI in non-TTY output; and explicit `--jsonl` retaining full evidence facts and nulls. The absent-price representation and ordinary `sort` null placement are unresolved. If a future pipeline selects zero symbols, `xargs ww fetch -q` must not accidentally invoke bare fetch's eventual default context. No stdin operand syntax is authorized here.

## Conclusion

The bounded `ww fetch` candidate passes its deterministic black-box acceptance layer, existing CLI regressions, roadmap projection check, and a successful real-backend terminal walk. This is implementation evidence for Principal review, not a claim of Product acceptance. At evidence capture, no commit or push had been made; later repository persistence is recorded by Git history.

Working tree after the acceptance pass, before repository persistence (`git status --short`):

```text
 M docs/README.md
 D docs/cli/ww-fetch-man-proposed.txt
 M docs/cli/ww-man.txt
 M docs/journal/project-journal-5.md
 M docs/parking-lot-10.md
 M options-prototype/src/roadmap/roadmap-projection.json
 M scripts/wheelwright.mjs
 M scripts/wheelwright.test.mjs
?? docs/cli/ww-fetch-acceptance-2026-10-04.md
?? docs/cli/ww-fetch-man.txt
?? docs/cli/ww-prices-man.txt
?? docs/cli/ww-sort-man.txt
?? scripts/ww-acceptance-pty.py
?? scripts/ww-fetch.acceptance.mjs
```
