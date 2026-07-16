#!/usr/bin/env sh
# Stops the local stack and removes its volumes (Postgres + MinIO data),
# then starts everything fresh. Useful when local state gets into a bad shape.
set -e

cd "$(dirname "$0")/../.."

docker compose down --volumes
docker compose up -d --build

echo "Stack reset. Run 'pnpm db:migrate:deploy' if you need the schema re-applied."
