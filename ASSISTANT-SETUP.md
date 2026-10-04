# Ask Splain activation

The frontend calls `/api/ask-splain`. The Cloudflare Worker keeps a fixed portfolio knowledge base in `backend/knowledge.mjs` and calls Workers AI. No credentials or conversation database are needed in the browser.

## Deploy on the existing Cloudflare Worker

Use the existing `splain-dev` Worker and preserve its custom domain. In its Git build settings, use `npm run build` as the build command and `npx wrangler deploy` as the deploy command. Remove any old `--assets .` override: only the generated `dist` folder should be served publicly. The Wrangler configuration adds AI and rate limiter bindings and runs the Worker first for `/api/*`.

If deploying locally, install dependencies, sign in to the correct Cloudflare account with `npx wrangler login`, then run `npm run deploy`. Cloudflare may require Workers AI account activation. Check account usage and plan before enabling public inference; do not enable paid services automatically.

Verify a real model reply on the production domain, a follow-up question, clean section refresh, mobile layout, keyboard navigation, and unavailable-service behavior. Unit tests use mocked provider bindings and do not validate live AI output. A basic static preview shows the UI but cannot generate replies.

## Limits and maintenance

- Questions: 600 characters. History: four previous exchanges. Replies: 350 tokens, at most 2400 characters.
- Six requests per minute per shared IP and 30 per minute across visitors, per Cloudflare location. These are approximate abuse safeguards, not a global spending cap.
- Chat remains in page memory and clears on reload. The application does not log or store messages. Cloudflare processes requests under its provider policies; the UI discloses this before sending.
- Output is inserted as text, never HTML. Navigation links are fixed in the interface.
- The model is prompted to stay within published facts, admit uncertainty and decline unrelated requests. This reduces hallucinations but cannot guarantee correctness; test representative questions with the live model before publishing.
- Update `backend/knowledge.mjs` whenever the portfolio changes. Keep unverified claims, private information and credentials out of the knowledge base.

Run `npm test` for backend request validation, rate limits, errors and knowledge injection; `npm run build` prepares only public website assets.
