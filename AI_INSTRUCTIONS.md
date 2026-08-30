# AI Working Instructions

## Delivery

- After every verified repository change, create a focused Git commit and push it to the configured remote. Do this by default unless the user explicitly asks not to commit or push.
- Before committing, inspect the final diff and run checks proportionate to the change. Do not commit unrelated working-tree changes.
- Report the commit hash and push outcome to the user.

## Change discipline

- Read `README.md`, `PROJECT_CONTEXT.md`, and `ARCHITECTURE.md` before major changes.
- Read `INTERFACES.md` before changing APIs, CLI commands, environment variables, configuration files, persisted formats, database schemas, webhooks, integrations, browser-automation assumptions, or DOM selectors.
- Prefer minimal, reversible changes and match existing patterns before adding new ones.
- Do not rename files, exported symbols, APIs, data contracts, database fields, environment variables, or persisted formats without strong justification. Preserve backward compatibility when possible.
- State assumptions explicitly when evidence is incomplete; avoid broad refactors unless requested.

## Documentation and safety

- Update only materially affected project memory after meaningful changes that pass the documentation write gate; do not update it for wording-only, formatting-only, or other non-semantic edits.
- Treat authentication, authorization, Supabase access, payments, and user-controlled input as security-sensitive. Preserve least privilege and never expose secrets, tokens, or personal data.
