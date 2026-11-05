import toastStyles from '../styles/runtime/toast.css?url'

import { loadRuntimeStylesheet } from './styles.js'
import type { LumenRuntimeFeature } from './types.js'

export const runtimeFeatures: readonly LumenRuntimeFeature[] = [
  { name: 'forms',
    selector: '.ui-field, [data-ui-field], form[data-ui-form]',
    load: () => import('./features/forms.js').then(m => ({ init: scope => {
      m.initFields(scope)

      m.initForms(scope)
    }  })) },
  { name: 'password',
    selector: '[data-ui-password-field]',
    load: () => import('./features/password.js').then(m => ({ init: scope => {
      m.initPasswordFields(scope)
    }  })) },
  { name: 'list-box',
    selector: '[data-ui-list-box]',
    load: () => import('./features/list-box.js').then(m => ({ init: scope => {
      m.initListBoxes(scope)
    }  })) },
  { name: 'disclosures',
    selector: '[data-ui-popover], [data-ui-dropdown-menu], [data-ui-hover-card]',
    load: () => import('./features/disclosures.js').then(m => ({ init: scope => {
      m.initDisclosures(scope)
    },
    outside: { selector: '[data-ui-popover], [data-ui-dropdown-menu], [data-ui-hover-card]', close: m.closeDisclosure },
    escape: { selector: '[data-ui-popover], [data-ui-dropdown-menu], [data-ui-hover-card]',
      isOpen: root => root.querySelector('[data-ui-trigger]')?.getAttribute('aria-expanded') === 'true',
      close: root => {
        m.closeDisclosure(root)

        root.querySelector<HTMLElement>('[data-ui-trigger]')?.focus({ preventScroll: true })
      } } })) },
  { name: 'tabs',
    selector: '[data-ui-tabs]',
    load: () => import('./features/tabs.js').then(m => ({ init: scope => {
      m.initTabs(scope)
    },
    cleanup: m.clearTabLayout })) },
  { name: 'roving',
    selector: '[data-ui-menubar], [data-ui-radio-group], [data-ui-toggle-group], [data-ui-toolbar]',
    load: () => import('./features/roving.js').then(m => ({ init: scope => {
      m.initRovingGroups(scope)
    }  })) },
  { name: 'toggles',
    selector: '[data-ui-toggle]',
    load: () => import('./features/toggles.js').then(m => ({ init: scope => {
      m.initToggles(scope)
    }  })) },
  { name: 'theme-toggle',
    selector: '[data-ui-theme-toggle]',
    load: () => import('./features/theme-toggle.js').then(m => ({ init: scope => {
      m.initThemeToggles(scope)
    }  })) },
  { name: 'language-toggle',
    selector: '[data-ui-language-toggle]',
    load: () => import('./features/language-toggle.js').then(m => ({ init: scope => {
      m.initLanguageToggles(scope)
    }  })) },
  { name: 'command',
    selector: '[data-ui-command]',
    load: () => import('./features/command.js').then(m => ({ init: scope => {
      m.initCommand(scope)
    }  })) },
  { name: 'combobox',
    selector: '[data-ui-combobox]',
    load: () => import('./controllers/combobox.js').then(m => ({ init: scope => {
      m.initComboboxes(scope)
    },
    cleanup: m.clearComboboxes,
    outside: { selector: '[data-ui-combobox]', close: m.closeCombobox } })) },
  { name: 'select',
    selector: '[data-ui-select]',
    load: () => import('./features/select.js').then(m => ({ init: scope => {
      m.initSelects(scope)
    },
    outside: { selector: '[data-ui-select]', close: m.closeSelect } })) },
  { name: 'resizable',
    selector: '[data-ui-resizable]',
    load: () => import('./features/resizable.js').then(m => ({ init: scope => {
      m.initResizableGroups(scope)
    }  })) },
  { name: 'otp',
    selector: '[data-ui-input-otp]',
    load: () => import('./features/otp.js').then(m => ({ init: scope => {
      m.initInputOtpFields(scope)
    }  })) },
  { name: 'data-table',
    selector: '[data-ui-datatable]',
    load: () => import('./features/data-table.js').then(m => ({ init: scope => {
      m.initDataTables(scope)
    }  })) },
  { name: 'calendar',
    selector: '[data-ui-calendar]',
    load: () => import('./features/calendar.js').then(m => ({ init: scope => {
      m.initCalendars(scope)
    }  })) },
  { name: 'date-picker',
    selector: '[data-ui-date-picker]',
    load: () => import('./features/date-picker.js').then(m => ({ init: scope => {
      m.initDatePickers(scope)
    },
    outside: { selector: '[data-ui-date-picker]', close: m.closeDatePicker },
    escape: { selector: '[data-ui-date-picker]', isOpen: root => root.querySelector('[aria-expanded="true"]') !== null, close: m.closeDatePicker } })) },
  { name: 'amount-field',
    selector: '[data-ui-amount-field]',
    load: () => import('./controllers/amount-field.js').then(m => ({ init: scope => {
      m.initAmountFields(scope)
    }  })) },
  { name: 'message-scroller',
    selector: '[data-ui-message-scroller]',
    load: () => import('./controllers/message-scroller.js').then(m => ({ init: scope => {
      m.initMessageFeeds(scope)
    }  })) },
  { name: 'code',
    selector: '[data-ui-code], [data-ui-code-copy], [data-ui-copy-button]',
    load: () => import('./features/code.js').then(m => ({ init: scope => {
      m.initCodeRegions(scope)

      m.initCopyButtons(scope)
    }  })) },
  { name: 'scroll-cue',
    selector: '[data-ui-scroll-cue]',
    load: () => import('./controllers/scroll-cue.js').then(m => ({ init: scope => {
      m.initScrollCues(scope)
    },
    cleanup: m.clearScrollCues })) },
  { name: 'progress',
    selector: '[data-ui-progress]',
    load: () => import('./controllers/progress.js').then(m => ({ init: scope => {
      m.initProgress(scope)
    }  })) },
  { name: 'carousel',
    selector: '[data-ui-carousel]',
    load: () => import('./features/carousel.js').then(m => ({ init: scope => {
      m.initCarousel(scope)
    }  })) },
  { name: 'schedule',
    selector: '[data-ui-schedule]',
    load: () => import('./features/schedule.js').then(m => ({ init: scope => {
      m.initSchedules(scope)
    }  })) },
  { name: 'kanban',
    selector: '[data-ui-kanban]',
    load: () => import('./features/kanban.js').then(m => ({ init: scope => {
      m.initKanbanBoards(scope)
    }  })) },
  { name: 'tree',
    selector: '[role="tree"], [role="treegrid"]',
    load: () => import('./features/tree.js').then(m => ({ init: scope => {
      m.initTreeCollections(scope)
    }  })) },
  { name: 'virtual-list',
    selector: '[data-ui-virtual-list]',
    load: () => import('./features/virtual-list.js').then(m => ({ init: scope => {
      m.initVirtualLists(scope)
    },
    cleanup: m.clearVirtualLists })) },
  { name: 'tags',
    selector: '.ui-tag-group, [data-ui-tag-group]',
    load: () => import('./features/tags.js').then(m => ({ init: scope => {
      m.initTagGroups(scope)
    }  })) },
  { name: 'rich-text',
    selector: '[data-ui-rich-text-editor]',
    load: () => import('./features/rich-text.js').then(m => ({ init: scope => {
      m.initRichTextEditors(scope)
    }  })) },
  { name: 'theme-builder',
    selector: '[data-ui-theme-builder]',
    load: () => import('./features/theme-builder.js').then(m => ({ init: scope => {
      m.initThemeBuilders(scope)
    }  })) },
  { name: 'tooltips',
    selector: '.ui-tooltip, [data-ui-tooltip]',
    load: () => import('./features/tooltips.js').then(m => ({ init: scope => {
      m.initTooltips(scope)
    }  })) },
  { name: 'context-menu',
    selector: '[data-ui-context-menu-trigger], [data-ui-context-menu]',
    load: () => import('./features/context-menu.js').then(m => ({ init: scope => {
      m.initContextMenus(scope)
    },
    outside: { selector: '[data-ui-context-menu][data-state="open"]', close: m.closeContextMenu },
    escape: { selector: '[data-ui-context-menu][data-state="open"]', close: m.closeContextMenu } })) },
  { name: 'date-range',
    selector: '[data-ui-date-range-picker]',
    load: () => import('./features/date-range.js').then(m => ({ init: scope => {
      m.initDateRangePickers(scope)
    }  })) },
  { name: 'glass',
    selector: '[data-ui-glass-track]',
    load: () => import('./features/glass.js').then(m => ({ init: scope => {
      m.initGlassTracking(scope)
    }  })) },
  { name: 'tour',
    selector: '[data-ui-tour]',
    load: () => import('./features/tour.js').then(m => ({ init: scope => {
      m.initTours(scope)
    }  })) },
  { name: 'transfer',
    selector: '[data-ui-transfer]',
    load: () => import('./features/transfer.js').then(m => ({ init: scope => {
      m.initTransfers(scope)
    }  })) },
  { name: 'mentions',
    selector: '[data-ui-mentions]',
    load: () => import('./features/mentions.js').then(m => ({ init: scope => {
      m.initMentions(scope)
    }  })) },
  { name: 'speed-dial',
    selector: '[data-ui-speed-dial]',
    load: () => import('./features/speed-dial.js').then(m => ({ init: scope => {
      m.initSpeedDials(scope)
    },
    outside: { selector: '[data-ui-speed-dial][data-state="open"]', close: m.closeSpeedDial },
    escape: { selector: '[data-ui-speed-dial][data-state="open"]', close: m.closeSpeedDial } })) },
  { name: 'cascader',
    selector: '[data-ui-cascader]',
    load: () => import('./features/cascader.js').then(m => ({ init: scope => {
      m.initCascaders(scope)
    }  })) },
  { name: 'tree-select',
    selector: '[data-ui-tree-select]',
    load: () => import('./features/tree-select.js').then(m => ({ init: scope => {
      m.initTreeSelects(scope)
    }  })) },
  { name: 'media',
    selector: '[data-ui-media-thumbnail], [data-ui-media-viewport]',
    load: () => import('./controllers/media-workspace.js').then(m => ({ init: scope => {
      m.initMediaWorkspaceControllers(scope)
    }  })) },
  { name: 'image-comparison',
    selector: '[data-ui-image-comparison]',
    load: () => import('./controllers/image-comparison.js').then(m => ({ init: scope => {
      m.initImageComparisonControllers(scope)
    }  })) },
  { name: 'file-upload',
    selector: '[data-ui-file-upload]',
    load: () => import('./controllers/file-upload.js').then(m => ({ init: scope => {
      m.initFileUploadControllers(scope)
    }  })) },
  { name: 'world-map',
    selector: '[data-ui-world-map]',
    load: () => import('./controllers/world-map.js').then(m => ({ init: scope => {
      m.initWorldMapControllers(scope)
    }  })) },
  { name: 'visual-interactions',
    selector: '[data-ui-tab-indicator], [data-ui-chart-motion], [data-ui-motion-group], [data-ui-visual-effect="spotlight"], [data-ui-prompt-composer], [data-ui-approval-card]',
    load: () => import('./controllers/visual-interactions.js').then(m => ({ init: scope => {
      m.initVisualInteractionControllers(scope)
    }  })) },
  { name: 'charts',
    selector: '[data-ui-chart-interactive]',
    load: () => import('./controllers/charts.js').then(m => ({ init: scope => {
      m.initChartControllers(scope)
    }  })) },
  { name: 'motion',
    selector: '[data-ui-back-to-top], [data-ui-scroll-reveal], [data-ui-reveal-group], [data-ui-animated-number]',
    load: () => import('./controllers/motion.js').then(m => ({ init: scope => {
      m.initMotionControllers(scope)
    },
    cleanup: m.cleanupMotionControllers })) },
  { name: 'attachments',
    selector: '[data-ui-attachment-preview]',
    load: () => import('./controllers/attachments.js').then(m => ({ init: scope => {
      m.initAttachmentPreviewControllers(scope)
    }  })) },
  { name: 'chart-activation',
    selector: '[data-ui-chart-activation]:not([data-ui-chart-adapter="react"]):not([data-ui-chart-adapter="elements"])',
    load: () => import('./controllers/chart-activation.js').then(m => ({ init: scope => {
      m.initChartActivationControllers(scope)
    }  })) },
  { name: 'phone-input',
    selector: '[data-ui-phone-input]',
    load: () => import('./controllers/phone-input.js').then(m => ({ init: scope => {
      m.initPhoneInputControllers(scope)
    }  })) },
  { name: 'dialogs',
    selector: '[data-ui-dialog], [data-ui-alert-dialog], [data-ui-drawer], [data-ui-sheet], [data-ui-dialog-trigger], [data-ui-alert-dialog-trigger], [data-ui-drawer-trigger], [data-ui-sheet-trigger]',
    load: () => import('./controllers/dialogs.js').then(m => ({ init: scope => {
      m.initDialogControllers(scope)
    }  })) },
  { name: 'document-navigation',
    selector: '[data-ui-anchor], [data-ui-scroll-progress]',
    load: () => import('./controllers/document-navigation.js').then(m => ({ init: scope => {
      m.initDocumentNavigationControllers(scope)
    }  })) },
  { name: 'toast',
    selector: '[data-ui-toast-viewport], [data-ui-toast], .ui-toast',
    load: () => Promise.all([loadRuntimeStylesheet(document, toastStyles), import('./features/toast.js')]).then(([, m]) => ({ init: scope => {
      m.initToasts(scope)
    }  })) }
]
