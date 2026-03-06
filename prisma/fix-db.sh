#!/bin/bash
# Fix migration issues by resetting migration state for V2

echo "🔧 Fixing database migration state..."

# Connect to database and fix migrations
PGPASSWORD=fvZxZLZoArVWbOCNwCXRJsOOtTwNvjiu psql -h switchyard.proxy.rlwy.net -U postgres -p 21881 -d railway -c "
-- Delete all migration history from V1
DELETE FROM _prisma_migrations;

-- Insert V2 migration as already applied
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  '',
  NOW(),
  '20260306143830_init',
  '',
  NULL,
  NOW(),
  1
);
"

echo "✅ Migration state fixed. Running Prisma deploy..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed

echo "🚀 Starting application..."
npm run start:prod
