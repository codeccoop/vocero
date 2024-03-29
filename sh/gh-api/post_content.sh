#! /bin/bash

if [ -f .env.local ]; then
    source .env.local
else
    source .env
fi

content='bmFtZTogSmVreWxsIHNpdGUgQ0kKCm9uOgogIHB1c2g6CiAgICBicmFuY2hlczogWyAibWFpbiIgXQogIHB1bGxfcmVxdWVzdDoKICAgIGJyYW5jaGVzOiBbICJtYWluIiBdCgpqb2JzOgogIGJ1aWxkOgoKICAgIHJ1bnMtb246IHVidW50dS1sYXRlc3QKCiAgICBzdGVwczoKICAgIC0gdXNlczogYWN0aW9ucy9jaGVja291dEB2MwogICAgLSBuYW1lOiBCdWlsZCB0aGUgc2l0ZSBpbiB0aGUgamVreWxsL2J1aWxkZXIgY29udGFpbmVyCiAgICAgIHJ1bjogfAogICAgICAgIGRvY2tlciBydW4gXAogICAgICAgIC12ICR7eyBnaXRodWIud29ya3NwYWNlIH19Oi9zcnYvamVreWxsIC12ICR7eyBnaXRodWIud29ya3NwYWNlIH19L19zaXRlOi9zcnYvamVreWxsL19zaXRlIFwKICAgICAgICBqZWt5bGwvYnVpbGRlcjpsYXRlc3QgL2Jpbi9iYXNoIC1jICJjaG1vZCAtUiA3NzcgL3Nydi9qZWt5bGwgJiYgamVreWxsIGJ1aWxkIC0tZnV0dXJlIgo='

curl -i \
    -X PUT \
    -H 'Accept: application/vnd.github+json' \
    -H "Authorization: token $GH_ACCESS_TOKEN" \
    https://api.github.com/repos/$GH_USER/$GH_REPO/contents/.github/workflows/vocero-docker.yml \
    -d '{"message":"Create vocero-docker.yml","committer":{"name":"'$GH_REPO'","email":"'$GH_EMAIL'"},"content": "'$content'"}'
