#!/usr/bin/env bash
# Build the private single-file app with real extracted content bundled in.
# The extracted dataset is copyrighted and is NOT committed; it is only injected
# here for the local build, then the produced HTML is delivered privately.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"

data="${1:-$here/out/dataset.json}"
if [[ ! -f "$data" ]]; then
  echo "Dataset not found: $data" >&2
  echo "Run the ingestion (extract -> structure -> assemble.py) first." >&2
  exit 1
fi

cp "$data" "$root/app/src/content/dataset.json"
echo "Bundled dataset: $data"
( cd "$root/app" && pnpm build )
echo "Built: $root/app/dist/index.html"
