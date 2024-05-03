#!/bin/bash

# Add the original repository as a remote if not already present
if ! git remote | grep -q upstream; then
  git remote add upstream https://github.com/dydxprotocol/v4-web.git
fi

# Fetch latest changes from the original repository
git fetch upstream

# Find the last common commit
VITE_LAST_ORIGINAL_COMMIT=$(git merge-base HEAD upstream/main)

# Check if the command succeeded and VITE_LAST_ORIGINAL_COMMIT is not empty
if [ -z "$VITE_LAST_ORIGINAL_COMMIT" ]; then
  echo "Error: Unable to determine the last original commit."
  exit 1
fi

# Update or add VITE_LAST_ORIGINAL_COMMIT in .env
if grep -q "VITE_LAST_ORIGINAL_COMMIT=" .env; then
  # Variable exists, replace it
  awk -v lc="$VITE_LAST_ORIGINAL_COMMIT" '/^VITE_LAST_ORIGINAL_COMMIT=/ {$0="VITE_LAST_ORIGINAL_COMMIT="lc} 1' .env > .env.tmp && mv .env.tmp .env
else
  # Variable does not exist, append it
  echo "VITE_LAST_ORIGINAL_COMMIT=$VITE_LAST_ORIGINAL_COMMIT" >> .env
fi

echo "VITE_LAST_ORIGINAL_COMMIT set as $VITE_LAST_ORIGINAL_COMMIT"