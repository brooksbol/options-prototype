#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../options-prototype"

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  . "/opt/homebrew/opt/nvm/nvm.sh"
fi

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

if [ ! -d node_modules ]; then
  npm install
fi

npm run dev
