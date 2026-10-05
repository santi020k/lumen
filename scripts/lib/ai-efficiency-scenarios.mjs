export const efficiencyScenarios = [
  {
    id: 'profile-dialog', heading: 'Profile',
    prompt: 'Build a profile settings screen with the main h1 Profile. The Edit profile button opens a modal dialog named Profile settings. Its Display name text field initially contains Ada and receives focus on opening. Editing the field persists across closing and reopening. Escape and the Cancel button both close the dialog and return focus to Edit profile. Trap keyboard focus while the modal is open.'
  },
  {
    id: 'notification-settings', heading: 'Notification settings',
    prompt: 'Build a settings screen with the main h1 Notification settings. The Email address field initially contains ada@example.com. Show delivery details toggles the initially hidden text Weekly summaries arrive on Monday. without clearing edited input. Save preferences displays a status region containing Preferences saved for <email>. using the current field value. This is an in-memory demo, with no network or persistence across page reloads.'
  },
  {
    id: 'workspace-settings', heading: 'Workspace settings', framework: 'react',
    prompt: 'Build a multi-section workspace settings screen with the main h1 Workspace settings. Include notification preferences: Email address initially ada@example.com; Show delivery details toggles initially hidden text Weekly summaries arrive on Monday. without clearing edits; Save preferences displays a status region Preferences saved for <email>. using the current value. Add a Team members list with accessible name Team members containing Ada (Owner), Grace (Editor), and Lin (Viewer). A Search members textbox filters names case-insensitively. A Role filter select with All, Owner, Editor, Viewer combines with the search. No results appears when the combined filter matches nobody. Clearing filters restores all three members. Filtering must not reset edited preferences. Use distinct section headings, public components when available, and in-memory synthetic state only.'
  },
  {
    id: 'elements-notification-settings', heading: 'Notification settings', framework: 'elements',
    prompt: 'Build a notification preferences screen with the main h1 Notification settings. The Email address field initially contains ada@example.com. Show delivery details toggles initially hidden text Weekly summaries arrive on Monday. without clearing edited input. Save preferences displays a status region containing Preferences saved for <email>. using the current value. This is an in-memory demo; no network or persistence across reloads. Preserve native labels and bubbling input events.'
  }
]


export const efficiencyCaseIds = schemaVersion => efficiencyScenarios.slice(0, schemaVersion === 1 ? 2 : 4).map(scenario => scenario.id)
