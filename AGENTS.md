<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Database is an external Supabase project reached through the browser client in `src/lib/supabase.ts` (URL + publishable key); schema changes live in `supabase/kelola.sql` and are run by the user in the Supabase SQL Editor. Why: project uses its own Supabase, not Lovable Cloud.
- Registration numbers (`no_daftar`) are generated in the browser (`src/lib/pendaftaran.ts`) and sent with the insert; the form drops any column the database reports as missing (e.g. new fields not yet added via `kelola.sql`) and retries. Why: anon RLS cannot read back the inserted row, and registration must not fail before the user runs the SQL.
- Public status lookup goes only through the security-definer SQL function `lacak_pendaftaran` (registration number + birth date), never a direct anon SELECT on `pendaftar`. Why: anon must not read registrant rows; the function returns only non-sensitive fields.
- AI announcement drafting runs in a server function (`src/lib/pengumuman-ai.functions.ts`) that verifies the admin's Supabase access token (sent by a client middleware) before calling OpenAI with the user's own `OPENAI_API_KEY` secret from `pengumuman-ai.server.ts`. Why: the user chose their own OpenAI key; the external Supabase has no generated auth middleware and the key must stay server-side.
- The registration form writes the existing `pendaftar` column names (`no_daftar`, `asal_sekolah`, `jurusan`, `berkas_*`, `gelombang`/`gelombang_id`) and uploads files to the private `berkas` bucket under `{no_daftar}/`. Why: Admin, export, print sheet and `lacak_pendaftaran` read those names; renaming would hide new registrants from staff.
