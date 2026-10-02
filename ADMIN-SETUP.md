# PKR admin media manager

The website now includes a secure admin panel at:

`https://pkr-website.pages.dev/admin/`

It supports:

- password login with an HttpOnly session cookie
- adding images, MP4 videos, and PDF documents
- optional video poster and PDF cover uploads
- editing titles and descriptions
- hiding media from the public site without deleting the original file

## One-time Cloudflare Pages setup

In the Cloudflare Pages project for `pkr-website`, open **Settings → Environment variables** and add these variables for **Production**:

| Variable | What to enter |
|---|---|
| `ADMIN_PASSWORD` | A strong private password used only for this admin panel |
| `SESSION_SECRET` | A long random secret, at least 32 characters |
| `GITHUB_TOKEN` | A GitHub fine-grained token with **Contents: Read and write** access to `contactuspkr-ui/pkr-website` only |
| `GITHUB_REPO` | `contactuspkr-ui/pkr-website` |
| `GITHUB_BRANCH` | `main` |

Mark the first three values as encrypted/secrets in Cloudflare. Never put them in `index.html`, `admin.js`, GitHub, or WhatsApp messages.

After saving the variables, trigger a new Pages deployment. The admin URL will then be ready.

## How to use it

1. Open `/admin/`.
2. Sign in with the `ADMIN_PASSWORD` value.
3. Choose **Image / gallery**, **Video**, or **PDF document**.
4. Select the file, enter a title and description, and click **Upload and publish**.
5. For a video, optionally add a poster image. For a PDF, optionally add a cover image.
6. The panel writes the file and catalog to GitHub. Cloudflare Pages then deploys the update automatically.

Each uploaded file should stay below 24 MB. This keeps uploads within the site’s static hosting limits and helps deployments complete reliably.

## Security notes

- The password is checked only inside a Cloudflare Pages Function; it is not shipped to the browser.
- The GitHub token is used only server-side by the Functions.
- The session is an expiring, signed, HttpOnly, Secure, SameSite cookie.
- Hiding an item removes it from the public catalog but intentionally leaves the file in GitHub, so an accidental hide is reversible.
- Rotate `ADMIN_PASSWORD`, `SESSION_SECRET`, and `GITHUB_TOKEN` if access is ever shared with the wrong person.
