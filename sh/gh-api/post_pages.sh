#! /bin/bash

if [ -f .env.local ]; then
    source .env.local
else
    source .env
fi

curl \
  -i \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: token $GH_ACCESS_TOKEN" \
  https://api.github.com/repos/$GH_USER/$GH_REPO/pages \
  -d '{"source": {"branch": "vocero", "path": "/"}}'