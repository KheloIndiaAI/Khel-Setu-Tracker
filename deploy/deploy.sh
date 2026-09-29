#!/usr/bin/env bash
# Runs ON the EC2 VM (as root, via AWS SSM Run Command) from /home/ubuntu/khel-setu.
# Inputs (env): APP_IMAGE TOOLS_IMAGE ECR_REGISTRY AWS_REGION
# Flow: ECR login -> pull -> prisma migrate deploy (one-off) -> up -d -> wait for health -> rollback on failure.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/khel-setu}"
cd "$APP_DIR"
export PATH="$PATH:/snap/bin:/usr/local/bin"
: "${APP_IMAGE:?}" "${TOOLS_IMAGE:?}" "${ECR_REGISTRY:?}" "${AWS_REGION:?}"
[ -f .env ] || { echo "Missing $APP_DIR/.env - refusing to deploy"; exit 1; }

DC="docker compose --profile proxy"
LAST_GOOD=".last_good"

wait_healthy() {
  local cid status
  for _ in $(seq 1 45); do
    cid="$($DC ps -q app || true)"
    if [ -n "$cid" ]; then
      status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo unknown)"
      [ "$status" = "healthy" ] && return 0
    fi
    sleep 4
  done
  return 1
}

rollback() {
  echo "!! Deploy failed - rolling back"
  $DC logs --tail=60 app || true
  if [ -f "$LAST_GOOD" ]; then
    # shellcheck disable=SC1090
    . "./$LAST_GOOD"
    export APP_IMAGE TOOLS_IMAGE
    $DC up -d --remove-orphans || true
    echo "Rolled back to $APP_IMAGE"
  else
    echo "No previous good release recorded; leaving current containers as they are"
  fi
  exit 1
}

echo "== ECR login ($ECR_REGISTRY)"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "== Pull $APP_IMAGE"
$DC pull app migrate

echo "== Database migrations (prisma migrate deploy)"
$DC up -d db
$DC run --rm migrate || rollback

echo "== Start new release"
$DC up -d --remove-orphans || rollback

echo "== Waiting for app health"
wait_healthy || rollback

printf 'APP_IMAGE=%s\nTOOLS_IMAGE=%s\n' "$APP_IMAGE" "$TOOLS_IMAGE" > "$LAST_GOOD"
chown ubuntu:ubuntu "$LAST_GOOD" 2>/dev/null || true

echo "== Cleanup old images (>72h, unused)"
docker image prune -af --filter "until=72h" >/dev/null || true
echo "== Deployed $APP_IMAGE"
$DC ps
