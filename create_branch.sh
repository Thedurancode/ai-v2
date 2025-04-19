#!/bin/bash
set -e

# Discard changes in node_modules
git checkout -- dura-react/node_modules || true

# Create a new branch
git checkout -b april-9

# Show current branch
git branch

echo "Successfully created branch 'april-9'"
