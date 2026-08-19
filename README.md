# blindrumors.cloud — go subdomain

Twelve pages live under `go.blindrumors.cloud`:

- `/` — Locals Go early access waitlist (index.html)
- `/assistant/` — Reesee AI Assistant chat tool
- `/dashboard/` — Private, login-gated founder dashboard (sign-up funnel view)
- `/host-purchase/` — Event hosts buy a vendor packet and get their referral link
- `/vendor-signup/` — Vendors land here via a host's referral link (`?ref=code`) and self-register
- `/partner/` — Founding Partner Promotional Command Center (Reesee-guided promo builder, dashboard, loyalty, analytics)
- `/admin/` — Admin dashboard (businesses, founding partners, promotions moderation, campaign moderation, tier/feature management, loyalty programs)
- `/campaign-create/` — 🔥 Viral Share Network: business owners submit a YouTube link, Reesee writes the campaign copy, submit for approval
- `/join-network/` — Public opt-in for the Share Network (name, email, interests)
- `/share-feed/` — Share Opportunities feed — members see matched campaigns and can Watch / Share / Not Interested
- `/watch/` — Tracking redirect (`?c=slug&m=membercode`) — logs the click, then sends the visitor to the real video
- `/giftcard/` — Locals Go $2,000 Gift Card Giveaway graphic (real sponsor list — this replaces the earlier ChatGPT version, which had incorrect business names and should be considered retired)

## Viral Share Network notes

- Campaigns start as `pending` and only appear in the Share Feed once an admin approves them in `/admin/` → Campaigns tab.
- Campaign priority in the feed is based on the submitting business's Founding Partner tier price (higher tier = shown first).
- Sharing uses native mobile share, copy link, text, email, Facebook, and X — no auto-posting, no bots, no fake engagement, per the spec's anti-spam requirements.
- Email/SMS distribution (Daily Share Digest) is **not built** — that needs a transactional email/SMS service (e.g. Resend, Twilio) connected first.

## Admin access

The first person to sign in on `/admin/` automatically becomes the admin (bootstrap rule — only fires once, while the admin list is empty). After that, only existing admins can access the panel; everyone else is signed back out automatically. Make sure Reesee is the first person to log into that page.

## Deploy (GitHub Pages)

1. Push this entire folder structure to the root of your repo — keep `/assistant` as a subfolder, don't flatten it.
2. Repo → Settings → Pages → Source: Deploy from branch `main`, folder `/root`.
3. Repo → Settings → Pages → Custom domain → `go.blindrumors.cloud` → Save.
4. DNS (at your registrar): CNAME record, Host `go`, Target `<yourusername>.github.io`.
5. Enable "Enforce HTTPS" once available.

## Live URLs once deployed

- Waitlist: `https://go.blindrumors.cloud/`
- Reesee AI Assistant: `https://go.blindrumors.cloud/assistant/`
- Founder Dashboard: `https://go.blindrumors.cloud/dashboard/` — first visit, click "Create an account" with your own email/password. Only signed-in users can see the data; the public site visitors cannot read any sign-up info even with the page's source code visible.

## Referral links (waitlist)

`https://go.blindrumors.cloud/?src=instagram` (also: facebook, discord, twitch, x, linkedin) — optionally add `&ref=partner-name`.
