# Instagram account setup

**Status: live and configured as `@lumenui.dev`.** Santiago confirmed creation on 2026-09-03, and
the public profile resolved at `https://www.instagram.com/lumenui.dev/`. The account is public, uses
the Business type and visible Software category, and has its first post published. The clickable
website and owner-controlled two-factor authentication remain incomplete. This document never
records credentials or other private account data.

## Account data

| Field | Value to enter |
| --- | --- |
| Selected username | `@lumenui.dev` |
| Profile URL | `https://www.instagram.com/lumenui.dev/` |
| Rejected as unavailable | `@lumenui`, `@lumen.ui` |
| Display name | `Lumen UI` |
| Account type | Professional — Business |
| Category | `Software` or the closest available software/developer-tools category |
| Public category label | Show it only if the selected label accurately describes Lumen |
| Website | `https://lumen.santi020k.com` |
| Public contact buttons | Off initially |
| Profile visibility | Public |
| Primary language | English |
| Secondary-language story | Mention the verified English/Spanish `LanguageToggle` example only when localization is the topic |
| Profile image | `apps/docs/public/icon-512.png` |
| Profile image alt/reference | Lumen's lowercase `lu` monogram with one warm point of light on a dark rounded square |

Santiago selected `@lumenui.dev` after Meta reported `@lumenui` and `@lumen.ui` as unavailable. The
public profile now resolves; verify the displayed bio, image, and website after configuration.

## Verified live state

| Setting | State verified on 2026-09-03 |
| --- | --- |
| Display name, bio, and profile image | Configured |
| Visibility | Public |
| Professional account | Business |
| Category | Software, visible |
| Public contact information | Not used |
| Tags and mentions | Limited to accounts Lumen follows |
| Tagged-post review | Manual approval enabled |
| Comment filtering | Standard and advanced filtering enabled |
| First post | Published with a full caption and custom alternative text |
| Clickable website | Pending; Instagram exposes this edit only in the mobile app |
| Authentication-app two-factor authentication | Owner action pending; status not inspected or recorded |

## Bio

Preferred English-first bio:

> Accessible UI for web, native, Figma & AI.<br>
> 150+ web primitives • Free & MIT<br>
> EN/ES LanguageToggle example<br>
> ↓ Build with Lumen

Compact fallback:

> Accessible UI for web, native, Figma & AI.<br>
> Free & MIT • EN/ES example<br>
> ↓ Build with Lumen

The localization line deliberately names the example. Do not shorten it to “Lumen supports English
and Spanish,” because the documentation site and packages do not ship fully translated content.

## Owner-only fields

Santiago should choose these inside Accounts Center; never record their values in this repository:

- an owner-controlled email address that will remain accessible;
- a unique generated password stored in the owner's password manager;
- an account-recovery phone number only if Santiago wants Meta to hold it;
- authentication-app secrets and recovery codes; and
- the minimum necessary list of administrators.

Do not synchronize Santiago's personal profile name, username, photo, or avatar into the Lumen
profile. Meta allows profile-information synchronization across Accounts Center, but it is not
required to create a separate Instagram profile.

## Creation sequence in Meta

1. Add a new Instagram profile from Santiago's existing Accounts Center.
2. Enter the selected username, `@lumenui.dev`.
3. Set the display name, profile image, website, and preferred bio from this packet.
4. Make the profile public and switch it to a professional Business account.
5. Choose the closest accurate software/developer-tools category.
6. Leave public email, phone, address, WhatsApp, and action buttons off initially.
7. Decline cross-profile name, username, profile-photo, and avatar synchronization.
8. Turn on authentication-app two-factor authentication and store recovery codes outside the
   repository.
9. Enable login alerts, review active sessions, and remove unnecessary administrators.
10. Apply the moderation defaults below before publishing or sharing the handle.

Meta documents that professional accounts provide a professional dashboard and that
authentication-app two-factor authentication can be connected to multiple devices. Review the
current official instructions during setup:

- [Create a professional Instagram account](https://www.facebook.com/help/instagram/2358103564437429)
- [Authentication-app two-factor authentication](https://www.facebook.com/help/instagram/1124604297705184)
- [Accounts Center profile synchronization](https://www.facebook.com/help/instagram/451345223552070)

## Moderation and privacy defaults

- Enable Instagram's built-in spam and offensive-comment filtering.
- Enable manual approval before tagged posts appear on the profile.
- Restrict mentions and tags to people the account follows until moderation capacity is established.
- Do not upload a personal address book or enable contact syncing.
- Do not invite users to send passwords, tokens, private repositories, customer data, or security
  reports in comments or direct messages.
- Route suspected vulnerabilities to the private channel in `SECURITY.md` and ordinary support to
  `https://lumen.santi020k.com/support`.
- Hide credential leaks or other sensitive data; ask the author to rotate the exposed credential
  without repeating it.
- Preserve criticism and technical disagreement that does not expose sensitive data or violate
  platform rules.
- Do not enable branded-content, affiliate, paid-promotion, or advertising features without a
  separate approved campaign and required disclosures.

## First profile set

Do not announce an empty profile. Prepare and review this English-first set before sharing the
handle:

1. **Logo introduction:** published with the canonical positioning, core platform story, free/MIT
   status, website text, and custom alternative text.
2. **Introduction carousel:** positioning, the three web targets, native foundations, free/MIT
   status, and the website CTA.
3. **Settings-screen guide carousel:** one real screen, responsive state, keyboard focus, validation,
   and the guide CTA.
4. **One screen, three web targets Reel:** reuse
   `apps/docs/public/launch/one-screen-three-web-targets-vertical.mp4`.
5. **Prompt to verified UI Reel:** reuse
   `apps/docs/public/launch/prompt-to-verified-ui-vertical.mp4`.
6. **Localization-boundary carousel:** English-first explanation of localization-ready primitives,
   with the verified English/Spanish `LanguageToggle` default as the example.

Use one primary CTA per item. The profile should lead to the documentation site, not to an
unverified store, directory listing, or social account.

Suggested Highlights, created only after matching Stories exist:

- `Start Here`
- `Web`
- `Native`
- `AI + MCP`
- `Figma`
- `EN / ES`

Do not create empty Highlights.

## Creation handoff

After Meta accepts the account, record only these public facts in this file and
[`CHANNELS.md`](CHANNELS.md):

- exact username and profile URL;
- creation date;
- Business account and visible category state;
- website and final bio;
- whether security/moderation setup is complete; and
- whether the account is ready for content review.

Never record the login email, password, phone number, authentication secret, recovery codes, or
private administrator details.

Account creation is not publication approval. Every post and Reel still requires its own exact
copy, asset, alternative text, destination check, and approval row in
[`PUBLISHING_QUEUE.md`](PUBLISHING_QUEUE.md).
