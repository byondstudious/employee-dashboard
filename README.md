# Employee Dashboard — Setup & Deployment

## How it works

```
Browser → index.html (login form + dashboard)
        → /api/login  (checks credentials, issues a signed session token)
        → /api/data   (checks token, calls Airtable with the hidden key, returns records)
```

The Airtable API key never touches the browser — it lives only in the serverless function's environment variables. This is the key difference from a direct-fetch dashboard.

## Required Airtable table fields

In the Airtable base your n8n workflow already logs to, make sure the table has these fields (names must match exactly, case-sensitive):

| Field | Type |
|---|---|
| Name | Single line text |
| Received | Date (with time) |
| Outcome | Single line text |
| Status | Single select: `Booked`, `Replied`, `Needs Review` |
| ResponseTimeSeconds | Number (optional — omit and the dashboard shows "—") |

## Deploying (Vercel, free tier)

1. Create a free account at vercel.com.
2. Install the Vercel CLI (`npm i -g vercel`) or connect a GitHub repo containing this folder — either works.
3. From this folder, run `vercel` (CLI) or import the repo in the Vercel dashboard.
4. In the project's Settings → Environment Variables, add:
   - `SESSION_SECRET` — any long random string (this signs session tokens; generate one at random, don't reuse it elsewhere)
   - `EMPLOYEE_CREDENTIALS` — a JSON array, e.g. `[{"username":"jane","password":"changeme123"},{"username":"mike","password":"changeme456"}]`
   - `AIRTABLE_API_KEY` — a personal access token from Airtable with read access to the base
   - `AIRTABLE_BASE_ID` — found in Airtable's API docs for your base (starts with `app...`)
   - `AIRTABLE_TABLE_NAME` — e.g. `Leads`
5. Deploy. Vercel gives you a URL like `your-project.vercel.app`.
6. Add a custom domain (free on Vercel) so it lives at something like `dashboard.youragency.com`, and link to that from an "Employee" tab on your main site's nav.

## Adding or removing employees

Edit the `EMPLOYEE_CREDENTIALS` environment variable (add/remove entries in the JSON array), then redeploy. No code changes needed.

## Security notes, honestly

- This is a lightweight, appropriate setup for a small internal tool with a handful of employees — not bank-grade auth. Passwords are checked as plain strings against an environment variable, and session tokens are self-signed rather than using a full auth provider.
- As you grow past a few employees, consider upgrading to a proper auth provider (Clerk and Auth0 both have free tiers) for hashed passwords, per-user audit logs, and password reset flows — swapping that in later only touches `api/login.js`, not the rest of the app.
- Never commit the `.env` values to a public GitHub repo — set them in Vercel's dashboard, not in the code.
- The 8-hour session length in `api/login.js` is adjustable — shorten it if you want employees to re-authenticate more often.
