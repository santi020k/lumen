# Community feedback

[Feedback & support](https://lumen.santi020k.com/support) is the shared entry point for the website,
component references, and Playground apps. GitHub holds the public conversation and delivery history.
The website links to live GitHub views; it does not keep a second voting or status database.

## Where feedback belongs

| Need | Destination |
| --- | --- |
| Ideas, missing components, and improvements | [Ideas](https://github.com/santi020k/lumen/discussions/categories/ideas) |
| Setup, usage, and integration questions | [Q&A](https://github.com/santi020k/lumen/discussions/categories/q-a) |
| Reproducible bugs, accessibility defects, and documentation errors | [Bug report](https://github.com/santi020k/lumen/issues/new?template=bug-report.yml) |
| Adoption research and public project submissions | Existing adoption-feedback and showcase issue forms |
| Accepted implementation work | Issues labeled `roadmap` |
| Release news | [Announcements](https://github.com/santi020k/lumen/discussions/categories/announcements) and [Releases](https://github.com/santi020k/lumen/releases) |
| Suspected vulnerabilities | [Private reporting](https://github.com/santi020k/lumen/security/advisories/new), following [SECURITY.md](../SECURITY.md) |

Public reading does not require an account. Posting, voting, and subscribing require a GitHub account.
General support is best-effort. The separate security acknowledgement policy remains in SECURITY.md.
Do not collect private code, credentials, personal information, or telemetry through feedback links.
Documentation bug links prefill only the public component name and canonical reference URL. Reporters
supply their actual installed version; the documentation version is not evidence of their environment.

## Maintainer workflow

1. Search for an existing report. Link duplicates to the original so votes and use cases remain
   together. Redirect usage questions to Q&A and actionable defects to the bug form.
2. Discuss the underlying need before accepting a proposal. Consider accessibility, user impact,
   platform consistency, maintenance cost, and demand. Votes are input, not a delivery commitment.
3. When accepted, create an implementation issue with scope and acceptance criteria. Link the
   discussion from the issue and the issue from the discussion. Apply `roadmap` and the relevant
   package/type labels. Do not create a second issue if a suitable one exists.
4. When implementation starts, add `in progress` and link the pull request. Remove that label if work
   is paused. Keep the issue's current decision and blockers visible.
5. After merging, remove `in progress` and record that the work is awaiting release. Keep the issue
   open until release, or retain that explicit note if GitHub automatically closed it. A closed issue
   is not proof of customer availability.
6. After verifying the change in a published package or app version, link the exact release and
   version from the issue and original discussion, add `shipped`, remove `in progress`, and close
   the issue as completed. Include the issue in release notes. Never mark a local build as shipped.
7. For declined or deferred proposals, explain the reason in the discussion. If accepted work is
   canceled, close its issue as not planned and remove `in progress`; do not add `shipped`.

Use Q&A's accepted-answer feature for resolved questions. Use Announcements for meaningful release
news, with a link to the actual release. Keep notifications useful and avoid promising dates without
an explicit commitment. These are maintainer actions, not automatic comments or status transitions.

## Roadmap views

The website uses these issue queries, defined in `apps/docs/src/data/community.ts`:

- All accepted work: `is:issue label:roadmap`.
- Planned: `is:issue is:open label:roadmap -label:"in progress"` (includes work awaiting release).
- In progress: `is:issue is:open label:roadmap label:"in progress"`.
- Shipped: `is:issue is:closed label:roadmap label:shipped`.

Empty views are valid. Do not invent requests or mark unrelated historical issues as accepted to
populate the roadmap. The full view preserves canceled and closed-but-unreleased work as well.

## GitHub setup and rollout

The repository administrator enables Discussions and verifies these categories:

| Name | Slug | Format |
| --- | --- | --- |
| Ideas | `ideas` | Open-ended discussion |
| Q&A | `q-a` | Question and answer |
| Announcements | `announcements` | Announcement |

Preserve existing categories and conversations. The category slugs must match the files in
`.github/DISCUSSION_TEMPLATE`. Verify `bug`, `feedback`, `showcase`, `roadmap`, `in progress`, and
`shipped` exist with the descriptions in `.github/labels.yml`. Enabling Discussions and creating
labels are repository-setting changes and require the owner's authorization.

Templates become active from the default branch, `main`; having them on a local release branch does
not activate them on GitHub. Release the website and app changes through their existing GitHub and
Xcode Cloud workflows. Do not publish the new links before Discussions and its categories are ready.
No package API or persisted-data migration is required.

After rollout, verify as a signed-out reader that Ideas, Q&A, Announcements, the roadmap queries,
and release history open. As a signed-in contributor, inspect the bug chooser and discussion forms
without submitting test reports. Check public and private destinations remain distinct. Verify the
website on phone and desktop, contextual bug links, and app Settings/About support links.

If rollout needs to be reverted, restore the previous support-page links through a follow-up commit.
Keep existing issues and discussions; do not delete feedback or disable access to recoverable history.
