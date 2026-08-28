<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Supabase migration deployment

- Keep every database change in a timestamped file under `supabase/migrations/`; that file remains the source of truth even when the Dashboard is used to deploy it.
- Do not attempt migration deployment through the Supabase CLI. This project's linked CLI repeatedly fails while initializing its temporary database login role (`LegacyDbConfigLoginRoleNetworkError`); retrying it wastes time and does not provide new evidence.
- When the user authorizes live deployment, go directly to the already-authenticated Supabase Dashboard SQL Editor for the linked project.
- In the SQL Editor, run the exact migration in a transaction. If Dashboard execution bypasses the CLI, add the matching version and name to `supabase_migrations.schema_migrations` in the same transaction with `on conflict (version) do nothing`; do not duplicate ledger registration when the migration already handles it.
- Retry a failed editor run in a fresh query so stale or partially edited text cannot be mixed into the migration. A failed transaction must not be reported as applied.
- After deployment, run a separate read-only SQL verification tailored to the migration. At minimum verify the ledger entry and created/changed objects; for privileged functions also verify execution grants, `security definer`, fixed `search_path`, and tenant/ownership checks.
- Report a migration as live only after verification passes. Never expose credentials, tokens, connection strings, or private data in commands, logs, documentation, or responses.
