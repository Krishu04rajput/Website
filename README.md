# K&D Studio — two-developer portfolio

A responsive, premium dark-theme portfolio for Krishu and Divyansh. Static front end + Vercel serverless contact API, ready to connect to GitHub and deploy on Vercel.

## 1. Personal details
- Krishu GitHub: `https://github.com/krishu04rajput`
- Krishu Discord username: `krishu04rajput`
- Divyansh GitHub: `https://github.com/div209`
- Divyansh Discord username: `divyansh073868`

Discord profile links in the page are convenience links and may not resolve to a user profile in every Discord setup. If desired, replace them with server invites or another contact method you control.

## 2. Add portraits
Create `assets/` and add:
- `assets/krishu.jpg`
- `assets/divyansh.jpg`

The cards show a designed initials fallback if those images are missing. Use portraits you have permission to publish.

## 3. Set up the working contact form
The form POSTs to `/api/contact`, a Vercel serverless function that sends enquiries through Resend. It does not expose the email API key to the browser.

1. Create a Resend account and verify a domain/sender as required by Resend.
2. In Vercel → Project → Settings → Environment Variables, add:
   - `RESEND_API_KEY` = your private Resend API key
   - `CONTACT_TO` = inbox that should receive enquiries
   - `CONTACT_FROM` = verified sender, e.g. `K&D Studio <contact@yourdomain.com>`
3. Add the variables to Preview and Production environments as appropriate, then redeploy.

Never put these secrets in `script.js`, HTML, or a public GitHub repository. Until configured, the form deliberately returns a clear “not configured” message.

## 4. Deploy using GitHub + Vercel
1. Create a new GitHub repository (for example `kd-studio-portfolio`).
2. Upload the contents of this folder to the repository root (not the enclosing folder).
3. On Vercel, import the GitHub repository. Framework preset: Other; build command: leave blank; output directory: `.`.
4. Add the environment variables above, deploy, and test the form with a real enquiry.
5. Future pushes to the connected production branch trigger deployments automatically.

`vercel.json` routes `/api/contact` to the serverless function. The site has no build step or package dependencies.

## 5. Customize before publishing
- Replace Divyansh's generic skills and experience text in `index.html` with accurate details from him.
- Replace "Building & learning" with a truthful experience summary for Krishu (no years were provided, so the site does not invent a number).
- Add project demo URLs, real screenshots, project status, and any other relevant links.
- Confirm that both people agree to publish their photos and contact details.

## Local preview
Open `index.html` for a visual-only preview. The contact API requires Vercel (or a compatible local serverless setup); it won't send mail by opening the HTML file directly.
