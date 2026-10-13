#!/bin/bash
# Run only inside the verified history preview or an engineering-prepared candidate session.
set -euo pipefail
output=$(mktemp -d /tmp/ww-history-comparison.XXXXXX)
ww ls position-observations --account pts --table --no-color
ww ls position-observations --account pts --jsonl > "$output/catalog.jsonl"
# Explicit selection of the two known fixture boundaries, never automatic predecessor selection.
earlier=$(jq -sr '[.[] | select(.evidenceDate=="2026-09-28")] | if length==1 then .[0].snapshotId else error("fixture earlier boundary ambiguous or missing") end' "$output/catalog.jsonl")
later=$(jq -sr '[.[] | select(.evidenceDate=="2026-10-11")] | if length==1 then .[0].snapshotId else error("fixture later boundary ambiguous or missing") end' "$output/catalog.jsonl")
ww show positions --account pts --snapshot "$earlier" --table --no-color
ww show positions --account pts --snapshot "$later" --table --no-color
ww show positions --account pts --table --no-color
ww show positions --account pts --snapshot "$earlier" --jsonl > "$output/earlier.jsonl"
ww show positions --account pts --snapshot "$later" --jsonl > "$output/later.jsonl"
jq -se --arg earlier "$earlier" --arg later "$later" 'length==2 and .[0].accountId==.[1].accountId and .[0].snapshotId==$earlier and .[1].snapshotId==$later' "$output/earlier.jsonl" "$output/later.jsonl" > /dev/null
jq '{accountId,snapshotId,evidenceDate,recordedAt,observationContext,observation,sourceFile,sourceSha256,artifactId,evaluatedAt,evaluationBasis}' "$output/earlier.jsonl" "$output/later.jsonl"
for side in earlier later; do
 jq -r '.positions[].constituents[].holding | [.contract,.custody,.kind,.quantity] | @tsv' "$output/$side.jsonl" > "$output/$side.rows"
 sort "$output/$side.rows" > "$output/$side.inventory.tsv"
done
if diff -u -L 'Earlier reported inventory' -L 'Later reported inventory' "$output/earlier.inventory.tsv" "$output/later.inventory.tsv"; then
 printf 'No observed inventory difference.\n'
else
 status=$?
 if [ "$status" -ne 1 ]; then exit "$status"; fi
 printf 'Observed inventory differences only; no cause or lifecycle continuity inferred.\n'
fi
printf 'Observation envelopes and comparison files: %s\n' "$output"
