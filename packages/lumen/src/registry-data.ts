// Generated from registry/lumen.registry.json by `pnpm run sync:registry`. Do not edit directly.
import type { LumenRegistry } from './registry-types.js'

export const lumenRegistry = {
  "name": "lumen",
  "version": 1,
  "description": "Astro-first Lumen UI primitives, recipes, tokens, runtime, and AI docs.",
  "packages": [
    "@santi020k/lumen-astro",
    "@santi020k/lumen-react",
    "@santi020k/lumen-elements",
    "@santi020k/lumen-core"
  ],
  "items": [
    {
      "name": "all-components",
      "type": "component-set",
      "files": [
        "packages/core/src/components.ts",
        "packages/astro/components",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ]
    },
    {
      "name": "advanced-fields",
      "type": "recipe",
      "components": [
        "Autocomplete",
        "SearchField",
        "NumberField",
        "TimeField",
        "DateRangePicker",
        "ColorPicker",
        "TagGroup"
      ]
    },
    {
      "name": "scheduler",
      "type": "recipe",
      "components": [
        "Schedule",
        "Agenda",
        "Calendar",
        "DatePicker"
      ]
    },
    {
      "name": "data-collections",
      "type": "recipe",
      "components": [
        "DataTable",
        "Tree",
        "TreeGrid",
        "VirtualList",
        "Pagination",
        "Command"
      ]
    },
    {
      "name": "theme-builder",
      "type": "recipe",
      "components": [
        "ThemeBuilder",
        "ColorPicker",
        "Card",
        "Button",
        "Input"
      ]
    },
    {
      "name": "rich-text-editor",
      "type": "recipe",
      "components": [
        "RichTextEditor",
        "ButtonGroup",
        "ToggleGroup",
        "Textarea"
      ]
    },
    {
      "name": "ai-docs",
      "type": "documentation",
      "files": [
        "llms.txt",
        "docs/ai-usage.md",
        "docs/feature-roadmap.md"
      ]
    },
    {
      "name": "figma-design-to-code",
      "type": "documentation",
      "files": [
        "registry/figma-design-map.json",
        "docs/figma-design-to-code.md",
        "docs/figma.md"
      ]
    }
  ],
  "components": [
    {
      "name": "Accordion",
      "type": "component",
      "description": "Stacks collapsible content sections.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Accordion.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Alert",
      "type": "component",
      "description": "Surfaces contextual status messages.",
      "category": "Feedback",
      "files": [
        "packages/astro/components/Alert.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "AlertDialog",
      "type": "component",
      "description": "Confirms destructive or high-commitment actions.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/components/AlertDialog.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "Button",
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Agenda",
      "type": "component",
      "description": "Lists upcoming appointments, tasks, or dated events.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Agenda.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "AspectRatio",
      "type": "component",
      "description": "Keeps media and embeds in a predictable ratio.",
      "category": "Layout",
      "files": [
        "packages/astro/components/AspectRatio.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Attachment",
      "type": "component",
      "description": "Displays a file attachment with metadata.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Attachment.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Autocomplete",
      "type": "component",
      "description": "Captures searchable text connected to suggestions.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Autocomplete.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Avatar",
      "type": "component",
      "description": "Represents a person, team, or entity.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Avatar.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "BackToTop",
      "type": "component",
      "description": "Returns user to the top of the page.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/BackToTop.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Badge",
      "type": "component",
      "description": "Labels status, type, plan, or count information.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Badge.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Breadcrumb",
      "type": "component",
      "description": "Shows page hierarchy and parent navigation.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/Breadcrumb.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Bubble",
      "type": "component",
      "description": "Frames chat messages and short comments.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Bubble.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Button",
      "type": "component",
      "description": "Triggers primary, secondary, destructive, and quiet actions.",
      "category": "Actions",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "ButtonGroup",
      "type": "component",
      "description": "Groups related button actions.",
      "category": "Actions",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/components/ButtonGroup.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "Button",
        "styles"
      ]
    },
    {
      "name": "Calendar",
      "type": "component",
      "description": "Presents a calendar surface for date selection.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Calendar.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Callout",
      "type": "component",
      "description": "Important notice or callout.",
      "category": "Feedback",
      "files": [
        "packages/astro/components/Callout.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Card",
      "type": "component",
      "description": "Frames a focused item, metric, plan, or form.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Card.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Carousel",
      "type": "component",
      "description": "Displays a horizontal sequence of slides.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Carousel.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Chart",
      "type": "component",
      "description": "Frames metric headers, SVG plots, and captions for lightweight data visualization.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Chart.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Checkbox",
      "type": "component",
      "description": "Captures a binary form value.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Checkbox.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Collapsible",
      "type": "component",
      "description": "Shows and hides one optional content region.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Collapsible.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Code",
      "type": "component",
      "description": "Renders inline code and framed code blocks with theme-aware palettes.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Code.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Combobox",
      "type": "component",
      "description": "Combines text entry and option selection.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Combobox.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Command",
      "type": "component",
      "description": "Builds command palettes and filterable action lists.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/Input.astro",
        "packages/astro/components/Command.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "Input",
        "styles",
        "runtime"
      ]
    },
    {
      "name": "ContextMenu",
      "type": "component",
      "description": "Provides contextual actions for a selected object.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/ContextMenu.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "ColorPicker",
      "type": "component",
      "description": "Captures a color token or brand swatch value.",
      "category": "Forms",
      "files": [
        "packages/astro/components/ColorPicker.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "DataTable",
      "type": "component",
      "description": "Styles dense tabular data and records.",
      "category": "Data display",
      "files": [
        "packages/astro/components/DataTable.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "DatePicker",
      "type": "component",
      "description": "Provides a styled date input.",
      "category": "Forms",
      "files": [
        "packages/astro/components/DatePicker.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "DateRangePicker",
      "type": "component",
      "description": "Groups start and end date controls for range selection.",
      "category": "Forms",
      "files": [
        "packages/astro/components/DatePicker.astro",
        "packages/astro/components/DateRangePicker.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "DatePicker",
        "styles"
      ]
    },
    {
      "name": "Dialog",
      "type": "component",
      "description": "Presents modal content for focused tasks.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/components/Dialog.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "Button",
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Direction",
      "type": "component",
      "description": "Controls directional layout and text flow.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Direction.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Drawer",
      "type": "component",
      "description": "Slides in supporting navigation, filters, or task panels.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/components/Drawer.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "Button",
        "styles",
        "runtime"
      ]
    },
    {
      "name": "DropdownMenu",
      "type": "component",
      "description": "Shows compact actions from a trigger.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/components/DropdownMenu.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "Button",
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Empty",
      "type": "component",
      "description": "Explains an empty state and next action.",
      "category": "Feedback",
      "files": [
        "packages/astro/components/Empty.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Eyebrow",
      "type": "component",
      "description": "Small heading or eyebrow text.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Eyebrow.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Field",
      "type": "component",
      "description": "Groups labels, controls, descriptions, and errors.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Input.astro",
        "packages/astro/components/Label.astro",
        "packages/astro/components/Field.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "Input",
        "Label",
        "styles"
      ]
    },
    {
      "name": "FloatingBadge",
      "type": "component",
      "description": "A badge that floats above its container.",
      "category": "Data display",
      "files": [
        "packages/astro/components/FloatingBadge.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "FormattedDate",
      "type": "component",
      "description": "Displays a formatted date.",
      "category": "Data display",
      "files": [
        "packages/astro/components/FormattedDate.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "HoverCard",
      "type": "component",
      "description": "Shows extra context on hover and focus.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/HoverCard.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Icon",
      "type": "component",
      "description": "Renders Lucide icons with Lumen sizing and accessibility defaults.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Icon.astro",
        "packages/astro/styles/lumen.css",
        "packages/core/src/icons.ts"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Image",
      "type": "component",
      "description": "Displays an image.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Image.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Input",
      "type": "component",
      "description": "Captures short text, email, password, search, or numeric values.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Input.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "InputGroup",
      "type": "component",
      "description": "Combines inputs with prefixes, suffixes, or controls.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Input.astro",
        "packages/astro/components/InputGroup.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "Input",
        "styles"
      ]
    },
    {
      "name": "InputOTP",
      "type": "component",
      "description": "Collects one-time passcodes and verification codes.",
      "category": "Forms",
      "files": [
        "packages/astro/components/InputOTP.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Item",
      "type": "component",
      "description": "Creates a compact row for lists and search results.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Item.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Kbd",
      "type": "component",
      "description": "Displays keyboard shortcuts.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Kbd.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Label",
      "type": "component",
      "description": "Labels form controls with consistent spacing.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Input.astro",
        "packages/astro/components/Label.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "Input",
        "styles"
      ]
    },
    {
      "name": "Link",
      "type": "component",
      "description": "A standard link.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/Link.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Marker",
      "type": "component",
      "description": "Highlights status, position, or annotations.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Marker.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Menubar",
      "type": "component",
      "description": "Creates horizontal application menus.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/Menubar.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Message",
      "type": "component",
      "description": "Structures a chat, activity, or system message.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Avatar.astro",
        "packages/astro/components/Bubble.astro",
        "packages/astro/components/Message.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "Avatar",
        "Bubble",
        "styles"
      ]
    },
    {
      "name": "MessageScroller",
      "type": "component",
      "description": "Provides a scrollable message feed.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Message.astro",
        "packages/astro/components/MessageScroller.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "Message",
        "styles"
      ]
    },
    {
      "name": "NativeSelect",
      "type": "component",
      "description": "Styles the browser-native select element.",
      "category": "Forms",
      "files": [
        "packages/astro/components/NativeSelect.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "NavigationMenu",
      "type": "component",
      "description": "Builds grouped top-level navigation.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/NavigationMenu.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "NumberField",
      "type": "component",
      "description": "Captures constrained numeric values.",
      "category": "Forms",
      "files": [
        "packages/astro/components/NumberField.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Pagination",
      "type": "component",
      "description": "Moves through paginated records or result sets.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/Pagination.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "PhoneInput",
      "type": "component",
      "description": "Pairs a country dial-code select with a telephone number input.",
      "category": "Forms",
      "files": [
        "packages/astro/components/PhoneInput.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "Input",
        "NativeSelect",
        "styles"
      ]
    },
    {
      "name": "Pill",
      "type": "component",
      "description": "A rounded pill badge.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Pill.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Popover",
      "type": "component",
      "description": "Displays lightweight floating content from a trigger.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/components/Popover.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "Button",
        "styles"
      ]
    },
    {
      "name": "Progress",
      "type": "component",
      "description": "Shows completion, loading progress, or quota usage.",
      "category": "Feedback",
      "files": [
        "packages/astro/components/Progress.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Prose",
      "type": "component",
      "description": "Formats markdown or rich text.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Prose.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "RadioGroup",
      "type": "component",
      "description": "Groups mutually exclusive options.",
      "category": "Forms",
      "files": [
        "packages/astro/components/RadioGroup.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Resizable",
      "type": "component",
      "description": "Frames panes that can be resized.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Resizable.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "RichTextEditor",
      "type": "component",
      "description": "Frames rich text toolbar and editing compositions.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/components/ButtonGroup.astro",
        "packages/astro/components/RichTextEditor.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "Button",
        "ButtonGroup",
        "styles",
        "runtime"
      ]
    },
    {
      "name": "ScrollArea",
      "type": "component",
      "description": "Provides a styled scroll container.",
      "category": "Layout",
      "files": [
        "packages/astro/components/ScrollArea.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Schedule",
      "type": "component",
      "description": "Displays calendar events across day, week, or resource grids.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Schedule.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "SearchField",
      "type": "component",
      "description": "Captures search queries with native search semantics.",
      "category": "Forms",
      "files": [
        "packages/astro/components/SearchField.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Select",
      "type": "component",
      "description": "Creates a custom select control.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Select.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Separator",
      "type": "component",
      "description": "Separates related content groups.",
      "category": "Layout",
      "files": [
        "packages/astro/components/Separator.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Sheet",
      "type": "component",
      "description": "Shows a side sheet for secondary flows.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/Button.astro",
        "packages/astro/components/Sheet.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "Button",
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Sidebar",
      "type": "component",
      "description": "Builds persistent app navigation.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/Sidebar.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Skeleton",
      "type": "component",
      "description": "Reserves space during loading states.",
      "category": "Feedback",
      "files": [
        "packages/astro/components/Skeleton.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "SkipLink",
      "type": "component",
      "description": "Skips to main content.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/SkipLink.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Slider",
      "type": "component",
      "description": "Captures numeric values across a bounded range.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Slider.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Sonner",
      "type": "component",
      "description": "Provides the toast viewport for notifications.",
      "category": "Feedback",
      "files": [
        "packages/astro/components/Sonner.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Spinner",
      "type": "component",
      "description": "Indicates short loading states.",
      "category": "Feedback",
      "files": [
        "packages/astro/components/Spinner.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Switch",
      "type": "component",
      "description": "Toggles a single setting on or off.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Switch.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Table",
      "type": "component",
      "description": "Styles semantic tables for records and comparisons.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Table.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Tabs",
      "type": "component",
      "description": "Switches between related panels.",
      "category": "Navigation",
      "files": [
        "packages/astro/components/Tabs.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "TagGroup",
      "type": "component",
      "description": "Groups removable or selectable tags.",
      "category": "Forms",
      "files": [
        "packages/astro/components/TagGroup.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Textarea",
      "type": "component",
      "description": "Captures longer free-form text.",
      "category": "Forms",
      "files": [
        "packages/astro/components/Textarea.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "ThemeBuilder",
      "type": "component",
      "description": "Frames token previews and theme export controls.",
      "category": "Data display",
      "files": [
        "packages/astro/components/ThemeBuilder.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "ThemeToggle",
      "type": "component",
      "description": "Toggles the color theme.",
      "category": "Actions",
      "files": [
        "packages/astro/components/ThemeToggle.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "TimeField",
      "type": "component",
      "description": "Captures a native time value.",
      "category": "Forms",
      "files": [
        "packages/astro/components/TimeField.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Toast",
      "type": "component",
      "description": "Displays temporary feedback for background actions.",
      "category": "Feedback",
      "files": [
        "packages/astro/components/Toast.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Toggle",
      "type": "component",
      "description": "Represents an on/off action.",
      "category": "Actions",
      "files": [
        "packages/astro/components/Toggle.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "ToggleGroup",
      "type": "component",
      "description": "Groups related toggles.",
      "category": "Actions",
      "files": [
        "packages/astro/components/Toggle.astro",
        "packages/astro/components/ToggleGroup.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "Toggle",
        "styles",
        "runtime"
      ]
    },
    {
      "name": "Tooltip",
      "type": "component",
      "description": "Adds concise helper text to compact controls.",
      "category": "Overlays",
      "files": [
        "packages/astro/components/Tooltip.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Tree",
      "type": "component",
      "description": "Displays hierarchical navigation or object collections.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Tree.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "TreeGrid",
      "type": "component",
      "description": "Displays hierarchical rows with grid-like columns.",
      "category": "Data display",
      "files": [
        "packages/astro/components/TreeGrid.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "Typography",
      "type": "component",
      "description": "Applies Lumen text rhythm to article content.",
      "category": "Data display",
      "files": [
        "packages/astro/components/Typography.astro",
        "packages/astro/styles/lumen.css"
      ],
      "dependencies": [
        "styles"
      ]
    },
    {
      "name": "VirtualList",
      "type": "component",
      "description": "Frames long scrollable collections for virtualization adapters.",
      "category": "Data display",
      "files": [
        "packages/astro/components/VirtualList.astro",
        "packages/astro/styles/lumen.css",
        "packages/astro/runtime/UIPrimitives.astro"
      ],
      "dependencies": [
        "styles",
        "runtime"
      ]
    },
    {
      "name": "LanguageToggle",
      "type": "component",
      "category": "Actions",
      "description": "A Language Toggle component.",
      "files": [
        "packages/astro/components/LanguageToggle.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Particles",
      "type": "component",
      "category": "Layout",
      "description": "A particles component.",
      "files": [
        "packages/astro/components/Particles.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "AnimatedNumber",
      "type": "component",
      "category": "Data display",
      "description": "Animates a formatted metric while keeping one stable accessible value.",
      "files": [
        "packages/astro/components/AnimatedNumber.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "RevealGroup",
      "type": "component",
      "category": "Layout",
      "description": "Reveals a group of direct children with tokenized, reduced-motion-aware staggering.",
      "files": [
        "packages/astro/components/RevealGroup.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "ScrollReveal",
      "type": "component",
      "category": "Layout",
      "description": "A Scroll Reveal component.",
      "files": [
        "packages/astro/components/ScrollReveal.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Stat",
      "type": "component",
      "category": "Data display",
      "description": "A stat component.",
      "files": [
        "packages/astro/components/Stat.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Meter",
      "type": "component",
      "category": "Data display",
      "description": "A meter component.",
      "files": [
        "packages/astro/components/Meter.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Note",
      "type": "component",
      "category": "Data display",
      "description": "A note component.",
      "files": [
        "packages/astro/components/Note.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Rating",
      "type": "component",
      "category": "Data display",
      "description": "A rating component.",
      "files": [
        "packages/astro/components/Rating.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Timeline",
      "type": "component",
      "category": "Data display",
      "description": "A timeline component.",
      "files": [
        "packages/astro/components/Timeline.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "AnimatedLogo",
      "type": "component",
      "category": "Brand",
      "description": "Reveals any inline SVG logo with accessible, reduced-motion-aware animation.",
      "files": [
        "packages/astro/components/AnimatedLogo.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "AnimatedPortrait",
      "type": "component",
      "category": "Brand",
      "description": "An animated portrait component.",
      "files": [
        "packages/astro/components/AnimatedPortrait.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "ButtonLink",
      "type": "component",
      "category": "Navigation",
      "description": "A button-styled link.",
      "files": [
        "packages/astro/components/ButtonLink.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "CoverImage",
      "type": "component",
      "category": "Data display",
      "description": "A cover image component.",
      "files": [
        "packages/astro/components/CoverImage.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "GradientDivider",
      "type": "component",
      "category": "Layout",
      "description": "A gradient divider component.",
      "files": [
        "packages/astro/components/GradientDivider.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Stepper",
      "type": "component",
      "category": "Navigation",
      "description": "A multi-step progress indicator.",
      "files": [
        "packages/astro/components/Stepper.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "FileUpload",
      "type": "component",
      "category": "Forms",
      "description": "A file upload input with drag-and-drop support.",
      "files": [
        "packages/astro/components/FileUpload.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Tour",
      "type": "component",
      "category": "Overlays",
      "description": "A guided product tour component.",
      "files": [
        "packages/astro/components/Tour.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Anchor",
      "type": "component",
      "category": "Navigation",
      "description": "A side navigation anchor for in-page sections.",
      "files": [
        "packages/astro/components/Anchor.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Segmented",
      "type": "component",
      "category": "Forms",
      "description": "A segmented control for mutually exclusive options.",
      "files": [
        "packages/astro/components/Segmented.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Toolbar",
      "type": "component",
      "category": "Layout",
      "description": "A horizontal toolbar for grouping actions.",
      "files": [
        "packages/astro/components/Toolbar.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Descriptions",
      "type": "component",
      "category": "Data display",
      "description": "A key-value description list component.",
      "files": [
        "packages/astro/components/Descriptions.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Popconfirm",
      "type": "component",
      "category": "Overlays",
      "description": "A confirmation popover for destructive actions.",
      "files": [
        "packages/astro/components/Popconfirm.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Transfer",
      "type": "component",
      "category": "Forms",
      "description": "A dual-panel list for transferring items between sets.",
      "files": [
        "packages/astro/components/Transfer.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Cascader",
      "type": "component",
      "category": "Forms",
      "description": "A cascading selector for hierarchical options.",
      "files": [
        "packages/astro/components/Cascader.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "TreeSelect",
      "type": "component",
      "category": "Forms",
      "description": "A dropdown backed by a hierarchical tree of options.",
      "files": [
        "packages/astro/components/TreeSelect.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Mentions",
      "type": "component",
      "category": "Forms",
      "description": "A textarea with @-mention autocomplete.",
      "files": [
        "packages/astro/components/Mentions.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "QRCode",
      "type": "component",
      "category": "Data display",
      "description": "A frame for a rendered QR code image.",
      "files": [
        "packages/astro/components/QRCode.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Watermark",
      "type": "component",
      "category": "Layout",
      "description": "Overlays a text or image watermark on content.",
      "files": [
        "packages/astro/components/Watermark.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "Affix",
      "type": "component",
      "category": "Layout",
      "description": "Sticks an element to a fixed position when scrolled past.",
      "files": [
        "packages/astro/components/Affix.astro",
        "packages/react/src/components.tsx"
      ]
    },
    {
      "name": "SpeedDial",
      "type": "component",
      "category": "Navigation",
      "description": "A floating action button with expandable sub-actions.",
      "files": [
        "packages/astro/components/SpeedDial.astro",
        "packages/react/src/components.tsx"
      ]
    }
  ]
} as const satisfies LumenRegistry
