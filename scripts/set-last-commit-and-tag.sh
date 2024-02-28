#!/bin/bash

# Add the original repository as a remote if not already present
if ! git remote | grep -q upstream; then
  git remote add upstream https://github.com/dydxprotocol/v4-web.git
fi

# Fetch latest changes from the original repository
git fetch --unshallow upstream

# Find the last common commit
VITE_LAST_ORIGINAL_COMMIT=$(git merge-base HEAD upstream/main)

# Check if the command succeeded and VITE_LAST_ORIGINAL_COMMIT is not empty
if [ -z "$VITE_LAST_ORIGINAL_COMMIT" ]; then
  echo "Unable to determine the last original commit."
  exit 0
fi

# Find the tag the commit lives in
VITE_LAST_TAG=$(git describe --exact-match $VITE_LAST_ORIGINAL_COMMIT)

# Update or add VITE_LAST_ORIGINAL_COMMIT in .env
if grep -q "VITE_LAST_ORIGINAL_COMMIT=" .env; then
  # Variable exists, replace it
  awk -v lc="$VITE_LAST_ORIGINAL_COMMIT" '/^VITE_LAST_ORIGINAL_COMMIT=/ {$0="VITE_LAST_ORIGINAL_COMMIT="lc} 1' .env > .env.tmp && mv .env.tmp .env
else
  # Variable does not exist, append it
  echo "VITE_LAST_ORIGINAL_COMMIT=$VITE_LAST_ORIGINAL_COMMIT" >> .env
fi

echo "VITE_LAST_ORIGINAL_COMMIT set as $VITE_LAST_ORIGINAL_COMMIT"

# Update or add VITE_LAST_TAG in .env
if grep -q "VITE_LAST_TAG=" .env; then
  # Variable exists, replace it
  awk -v lc="$VITE_LAST_TAG" '/^VITE_LAST_TAG=/ {$0="VITE_LAST_TAG="lc} 1' .env > .env.tmp && mv .env.tmp .env
else
  # Variable does not exist, append it
  echo "VITE_LAST_TAG=$VITE_LAST_TAG" >> .env
fi

echo "VITE_LAST_TAG set as $VITE_LAST_TAG"