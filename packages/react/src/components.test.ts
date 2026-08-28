import type {
  ComponentPropsWithoutRef,
  ReactElement,
  ReactNode
} from 'react'
import { isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { registerLumenIconPack } from '@santi020k/lumen-core'
import { describe, expect, test } from 'vitest'

import * as LumenReact from './index.js'
import {
  Accordion,
  Agenda,
  Alert,
  Anchor,
  AnimatedLogo,
  AspectRatio,
  Attachment,
  Autocomplete,
  Avatar,
  Backdrop,
  Badge,
  BarChart,
  Breadcrumb,
  Bubble,
  Button,
  ButtonGroup,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Carousel,
  Chart,
  Checkbox,
  Collapsible,
  ColorPicker,
  ComboChart,
  Command,
  ContextMenu,
  ContextNavigation,
  Direction,
  Drawer,
  Empty,
  ErrorState,
  Graphic,
  Heatmap,
  HoverCard,
  Icon,
  Illustration,
  Image,
  Input,
  InputGroup,
  Item,
  Kbd,
  Label,
  LineChart,
  Link,
  Marker,
  Message,
  MessageScroller,
  NativeSelect,
  NavigationMenu,
  NumberField,
  Pagination,
  PieChart,
  Pill,
  Progress,
  RadioGroup,
  RangeChart,
  ScatterChart,
  ScrollArea,
  SearchField,
  Separator,
  Sheet,
  Sidebar,
  Skeleton,
  Slider,
  Sparkline,
  Spinner,
  Stat,
  StatDescription,
  StatIcon,
  StatLabel,
  StatTrend,
  StatValue,
  Switch,
  TagGroup,
  Textarea,
  ThemeBuilder,
  TimeField,
  Toast,
  ToastViewport,
  Toggle,
  ToggleGroup,
  Typography
} from './index.js'

type Props = Record<string, unknown>

const propsOf = (element: ReactElement | undefined): Props => (element?.props ?? {}) as Props
const descendantsOf = (node: ReactNode): ReactElement[] => {
  if (Array.isArray(node)) return node.flatMap(descendantsOf)
  if (!isValidElement(node)) return []

  const element = node as ReactElement

  return [element, ...descendantsOf(propsOf(element).children as ReactNode)]
}
const OptimizedImage = (_props: ComponentPropsWithoutRef<'img'> & { preload?: boolean }) => null

describe('@santi020k/lumen-react components', () => {
  test('composes structural container classes', () => {
    expect(propsOf(Accordion({ className: 'x' }) as ReactElement).className).toBe('ui-accordion x')
    expect(propsOf(ButtonGroup({}) as ReactElement).className).toBe('ui-button-group')
    expect(propsOf(InputGroup({}) as ReactElement).className).toBe('ui-input-group')
    expect(propsOf(Skeleton({}) as ReactElement).className).toBe('ui-skeleton')
    expect(propsOf(Kbd({}) as ReactElement).className).toBe('ui-kbd')
    expect(propsOf(Label({}) as ReactElement).className).toBe('ui-label')
  })

  test('preserves native props and refs across compatibility wrappers', () => {
    const buttonRef = { current: null }
    const inputRef = { current: null }
    const wrapperRef = { current: null }
    const button = Button({ 'aria-label': 'Save', ref: buttonRef, type: 'submit' }) as ReactElement
    const input = Input({ inputMode: 'numeric', ref: inputRef, size: 24, visualSize: 'sm' }) as ReactElement

    expect(propsOf(button).ref).toBe(buttonRef)
    expect(propsOf(button).type).toBe('submit')
    expect(propsOf(button)['aria-label']).toBe('Save')
    expect(propsOf(input).ref).toBe(inputRef)
    expect(propsOf(input).size).toBe(24)
    expect(propsOf(input).inputMode).toBe('numeric')
    expect(propsOf(input).className).toContain('ui-input--sm')
    expect(propsOf(Textarea({ cols: 40, ref: wrapperRef }) as ReactElement).cols).toBe(40)
    expect(propsOf(Label({ htmlFor: 'email', ref: wrapperRef }) as ReactElement).htmlFor).toBe('email')
    expect(propsOf(Avatar({ fallback: 'SM', ref: wrapperRef }) as ReactElement).ref).toBe(wrapperRef)
    expect(propsOf(Badge({ ref: wrapperRef, title: 'Status' }) as ReactElement).title).toBe('Status')
    expect(propsOf(Card({ ref: wrapperRef, role: 'region' }) as ReactElement).role).toBe('region')
    expect(propsOf(Separator({ ref: wrapperRef }) as ReactElement).ref).toBe(wrapperRef)
    expect(propsOf(Skeleton({ ref: wrapperRef, role: 'status' }) as ReactElement).role).toBe('status')
  })

  test('supports router links through Button and ButtonLink asChild', () => {
    const button = Button({
      asChild: true,
      children: Link({ children: 'Projects', className: 'router-link', href: '/projects' }),
      variant: 'secondary'
    }) as ReactElement
    const buttonLink = ButtonLink({
      asChild: true,
      children: Link({ children: 'Docs', className: 'router-link', href: '/old' }),
      href: '/docs',
      variant: 'ghost'
    }) as ReactElement

    expect(button.type).toBe('a')
    expect(propsOf(button).className).toContain('ui-button--secondary')
    expect(propsOf(button)['data-slot']).toBe('button')
    expect(buttonLink.type).toBe('a')
    expect(propsOf(buttonLink).href).toBe('/docs')
    expect(propsOf(buttonLink).className).toContain('ui-button--ghost')
    expect(propsOf(buttonLink).className).toContain('router-link')
    expect(propsOf(buttonLink)['data-slot']).toBe('button-link')
  })

  test('composes Card through stable public parts', () => {
    expect(propsOf(Card({}) as ReactElement).uiClassName).toBe('ui-card')
    expect(propsOf(Card({}) as ReactElement)['data-slot']).toBe('card')
    expect(propsOf(CardHeader({}) as ReactElement).uiClassName).toBe('ui-card__header')
    expect(propsOf(CardTitle({ as: 'h3' }) as ReactElement).uiClassName).toBe('ui-card__title')
    expect(propsOf(CardTitle({ as: 'h3' }) as ReactElement).as).toBe('h3')
    expect(propsOf(CardDescription({}) as ReactElement)['data-slot']).toBe('card-description')
    expect(propsOf(CardContent({}) as ReactElement).uiClassName).toBe('ui-card__content')
    expect(propsOf(CardFooter({}) as ReactElement).uiClassName).toBe('ui-card__footer')
  })

  test('composes Stat parts and semantic trend tones', () => {
    expect(propsOf(Stat({ variant: 'bare' }) as ReactElement).className).toBe('ui-stat--bare')
    expect(propsOf(Stat({ variant: 'bare' }) as ReactElement).uiClassName).toBe('ui-stat')
    expect(propsOf(StatLabel({}) as ReactElement)['data-slot']).toBe('stat-label')
    expect(propsOf(StatValue({ as: 'output' }) as ReactElement).uiClassName).toBe('ui-stat-value')
    expect(propsOf(StatValue({ as: 'output' }) as ReactElement).as).toBe('output')
    expect(propsOf(StatDescription({}) as ReactElement).uiClassName).toBe('ui-stat-description')
    expect(propsOf(StatIcon({}) as ReactElement).className).toBe('ui-stat-icon')
    expect(propsOf(StatTrend({ tone: 'success' }) as ReactElement).className)
      .toBe('ui-stat-trend ui-stat-trend--success')
  })

  test('keeps native images lazy and supports framework image renderers', () => {
    const nativeImage = Image({ alt: 'Landscape', invertOnDark: true, src: '/landscape.jpg' }) as ReactElement
    const optimizedImage = Image({
      alt: 'Portrait',
      as: OptimizedImage,
      height: 800,
      preload: true,
      src: '/portrait.jpg',
      width: 600
    }) as ReactElement

    expect(nativeImage.type).toBe('img')
    expect(propsOf(nativeImage).loading).toBe('lazy')
    expect(propsOf(nativeImage).className).toBe(
      'ui-image ui-image--invert-dark ui-image--fit-cover ui-image--radius-lg'
    )
    expect(optimizedImage.type).toBe(OptimizedImage)
    expect(propsOf(optimizedImage).className).toBe(
      'ui-image ui-image--fit-cover ui-image--radius-lg'
    )
    expect(propsOf(optimizedImage).loading).toBeUndefined()
    expect(propsOf(optimizedImage).preload).toBe(true)

    const contained = Image({
      alt: 'Diagram',
      fit: 'contain',
      radius: 'sm',
      src: '/diagram.svg'
    }) as ReactElement

    expect(propsOf(contained).className).toContain('ui-image--fit-contain')
    expect(propsOf(contained).className).toContain('ui-image--radius-sm')
  })

  test('wraps arbitrary logo artwork without imposing SVG content', () => {
    const artwork = 'inline SVG artwork'
    const logo = AnimatedLogo({ children: artwork, className: 'brand-logo' }) as ReactElement
    const props = propsOf(logo)

    expect(logo.type).toBe('span')
    expect(props.className).toBe('ui-animated-logo brand-logo')
    expect(props['data-animation']).toBe('reveal')
    expect(props['data-ui-animated-logo']).toBe(true)
    expect(props.children).toBe(artwork)

    expect(propsOf(AnimatedLogo({ animation: 'sequence' }) as ReactElement)['data-animation'])
      .toBe('sequence')
  })

  test('renders portable decorative graphics with opt-in image semantics', () => {
    const decorative = Graphic({ children: 'mark', tone: 'accent', variant: 'grid' }) as ReactElement
    const labelled = Graphic({ label: 'Product constellation', size: 'lg' }) as ReactElement

    expect(propsOf(decorative).className).toBe(
      'ui-graphic ui-graphic--grid ui-graphic--accent ui-graphic--md'
    )
    expect(propsOf(decorative)['aria-hidden']).toBe(true)
    expect(propsOf(labelled).role).toBe('img')
    expect(propsOf(labelled)['aria-label']).toBe('Product constellation')
    expect(propsOf(labelled)['aria-hidden']).toBeUndefined()
  })

  test('renders ambient backdrops without changing content semantics', () => {
    const backdrop = Backdrop({ children: 'Readable content', intensity: 'strong', tone: 'neutral', variant: 'dots' }) as ReactElement
    const props = propsOf(backdrop)

    expect(props.className).toBe(
      'ui-backdrop ui-backdrop--dots ui-backdrop--neutral ui-backdrop--strong'
    )
    expect(props.children).toEqual(expect.objectContaining({ type: 'div' }))
    expect(propsOf(props.children as ReactElement).className).toBe('ui-backdrop__content')
  })

  test('renders semantic illustrations with decorative defaults', () => {
    const decorative = Illustration({ variant: 'success' }) as ReactElement
    const labelled = Illustration({ label: 'Connection unavailable', size: 'lg', variant: 'offline' }) as ReactElement

    expect(propsOf(decorative).className).toBe(
      'ui-illustration ui-illustration--success ui-illustration--auto ui-illustration--md'
    )
    expect(propsOf(decorative)['aria-hidden']).toBe(true)
    expect(propsOf(labelled).role).toBe('img')
    expect(propsOf(labelled)['aria-label']).toBe('Connection unavailable')
  })

  test('applies alert variant class and data attribute', () => {
    const alert = Alert({ variant: 'destructive' }) as ReactElement
    const props = propsOf(alert)

    expect(alert.type).toBe('aside')
    expect(props.className).toBe('ui-alert ui-alert--destructive')
    expect(props['data-variant']).toBe('destructive')
  })

  test('omits variant modifier for default alert but keeps glass', () => {
    expect(propsOf(Alert({}) as ReactElement).className).toBe('ui-alert')
    expect(propsOf(Alert({ glass: true }) as ReactElement).className).toBe('ui-alert ui-alert--glass')
    expect(propsOf(Alert({ glass: 'strong' }) as ReactElement).className).toBe('ui-alert ui-alert--glass ui-glass-strong')
  })

  test('merges aspect ratio into inline style', () => {
    const box = AspectRatio({ ratio: '4 / 3', style: { color: 'red' } }) as ReactElement
    const style = propsOf(box).style as Record<string, string>

    expect(style.aspectRatio).toBe('4 / 3')
    expect(style.color).toBe('red')
    expect((propsOf(AspectRatio({}) as ReactElement).style as Record<string, string>).aspectRatio).toBe('16 / 9')
  })

  test('renders avatar image when src is provided', () => {
    const withImage = Avatar({ alt: 'Ada', src: 'a.png' }) as ReactElement
    const image = (propsOf(withImage).children as ReactElement[])[0]

    expect(image?.type).toBe('img')
    expect(propsOf(image).src).toBe('a.png')
    expect(propsOf(image).alt).toBe('Ada')

    const withFallback = Avatar({ fallback: 'AB' }) as ReactElement
    const fallback = (propsOf(withFallback).children as ReactElement[])[0]

    expect(fallback?.type).toBe('span')
    expect(propsOf(fallback).children).toBe('AB')
  })

  test('always emits badge variant modifier', () => {
    expect(propsOf(Badge({}) as ReactElement).className).toBe('ui-badge ui-badge--default')
    expect(propsOf(Badge({ variant: 'secondary' }) as ReactElement).className).toBe('ui-badge ui-badge--secondary')
    expect(propsOf(Badge({ variant: 'secondary' }) as ReactElement)['data-variant']).toBe('secondary')
  })

  test('defaults breadcrumb and pagination aria labels', () => {
    expect(propsOf(Breadcrumb({}) as ReactElement)['aria-label']).toBe('Breadcrumb')
    expect(propsOf(Pagination({}) as ReactElement)['aria-label']).toBe('Pagination')
    expect(propsOf(Pagination({ 'aria-label': 'Pages' }) as ReactElement)['aria-label']).toBe('Pages')
  })

  test('marks conversation bubbles and messages by author', () => {
    expect(propsOf(Bubble({}) as ReactElement).className).toBe('ui-bubble')
    expect(propsOf(Bubble({ from: 'user' }) as ReactElement).className).toBe('ui-bubble ui-bubble--user')
    expect(propsOf(Bubble({ from: 'user' }) as ReactElement)['data-from']).toBe('user')
    expect(propsOf(Message({}) as ReactElement).className).toBe('ui-message ui-message--assistant')
    expect(propsOf(Message({ from: 'user' }) as ReactElement).className).toBe('ui-message ui-message--user')
  })

  test('renders native form controls with fixed types', () => {
    const checkbox = Checkbox({}) as ReactElement
    const slider = Slider({}) as ReactElement
    const toggle = Switch({}) as ReactElement

    expect(propsOf(checkbox).type).toBe('checkbox')
    expect(propsOf(checkbox).className).toBe('ui-checkbox')
    expect(propsOf(slider).type).toBe('range')
    expect(propsOf(slider).className).toBe('ui-slider')
    expect(propsOf(toggle).type).toBe('checkbox')
    expect(propsOf(toggle).role).toBe('switch')
  })

  test('marks collapsible and radio group runtime hooks', () => {
    expect(propsOf(Collapsible({}) as ReactElement)['data-ui-collapsible']).toBe(true)
    expect((Collapsible({}) as ReactElement).type).toBe('details')
    expect(propsOf(RadioGroup({}) as ReactElement)['data-ui-radio-group']).toBe(true)
    expect((RadioGroup({}) as ReactElement).type).toBe('fieldset')
  })

  test('applies input size modifiers and typed input classes', () => {
    expect(propsOf(Input({ visualSize: 'sm' }) as ReactElement).className).toBe('ui-input ui-input--sm')
    expect(propsOf(Input({ visualSize: 'lg' }) as ReactElement).className).toBe('ui-input ui-input--lg')
    expect(propsOf(Input({ size: 24 }) as ReactElement).size).toBe(24)
    expect(propsOf(NumberField({}) as ReactElement).type).toBe('number')
    expect(propsOf(NumberField({}) as ReactElement).className).toBe('ui-input ui-number-field')
    expect(propsOf(SearchField({}) as ReactElement).type).toBe('search')
    expect(propsOf(SearchField({}) as ReactElement).className).toBe('ui-input ui-search-field')
    expect(propsOf(TimeField({}) as ReactElement).type).toBe('time')
    expect(propsOf(TimeField({}) as ReactElement).className).toBe('ui-input ui-time-field')
  })

  test('treats icons as decorative unless labelled', () => {
    const decorative = Icon({ children: 'x' }) as ReactElement
    const labelled = Icon({ label: 'Menu', size: 'sm' }) as ReactElement

    expect(propsOf(decorative)['aria-hidden']).toBe(true)
    expect(propsOf(decorative).role).toBeUndefined()
    expect(propsOf(decorative).children).toBe('x')
    expect(propsOf(labelled)['aria-label']).toBe('Menu')
    expect(propsOf(labelled).role).toBe('img')
    expect(propsOf(labelled)['aria-hidden']).toBeUndefined()
    expect(propsOf(labelled).className).toBe('ui-icon ui-icon--sm')
  })

  test('renders registered filled icon packs through the shared Icon API', () => {
    registerLumenIconPack('brand-test', {
      mark: {
        height: 24,
        name: 'mark',
        node: [['path', { d: 'M2 2h20v20H2z' }]],
        source: 'brand-test',
        style: 'fill',
        width: 24
      }
    })

    const icon = Icon({ name: 'brand-test:mark' }) as ReactElement
    const svg = propsOf(icon).children as ReactElement

    expect(propsOf(svg).className).toBe('ui-icon__svg brand-test-mark')
    expect(propsOf(svg).fill).toBe('currentColor')
    expect(propsOf(svg).stroke).toBe('none')
  })

  test('resolves surface data attributes on glass-aware surfaces', () => {
    expect(propsOf(HoverCard({}) as ReactElement)['data-surface']).toBe('default')
    expect(propsOf(HoverCard({ glass: true }) as ReactElement)['data-surface']).toBe('glass')
    expect(propsOf(NavigationMenu({ glass: true }) as ReactElement)['data-surface']).toBe('glass')
    expect(propsOf(NavigationMenu({ glass: true }) as ReactElement).className)
      .toBe('ui-navigation-menu ui-navigation-menu--glass')
    expect(propsOf(Sheet({}) as ReactElement)['data-ui-sheet']).toBe(true)
    expect(propsOf(Sidebar({ glass: 'subtle' }) as ReactElement).className)
      .toBe('ui-sidebar ui-sidebar--glass ui-glass-subtle')
  })

  test('composes contextual navigation with an optional leading region', () => {
    const navigation = ContextNavigation({
      children: 'Links',
      context: 'Web',
      variant: 'unstyled'
    }) as ReactElement
    const children = propsOf(navigation).children as ReactElement[]

    expect(propsOf(navigation).className)
      .toBe('ui-context-navigation ui-context-navigation--unstyled')
    expect(propsOf(children[0]).className).toBe('ui-context-navigation__context')
    expect(propsOf(children[0])['data-slot']).toBe('context-navigation-context')
    expect(children[1]).toBe('Links')
  })

  test('applies glass intensity on structural glass surfaces', () => {
    expect(propsOf(Empty({ glass: true }) as ReactElement).className).toBe('ui-empty ui-empty--glass')
    expect(propsOf(Item({ glass: 'strong' }) as ReactElement).className).toBe('ui-item ui-item--glass ui-glass-strong')
    expect(propsOf(ScrollArea({}) as ReactElement).className).toBe('ui-scroll-area')
    expect(propsOf(MessageScroller({ glass: 'subtle' }) as ReactElement).className)
      .toBe('ui-message-scroller ui-message-scroller--glass ui-glass-subtle')
  })

  test('renders a labelled recovery state with explicit announcement policy', () => {
    const state = ErrorState({
      actions: 'Try again',
      announce: 'polite',
      description: 'Check your connection.',
      id: 'projects-error',
      kind: 'offline',
      layout: 'page',
      reference: 'REQ-4F82',
      title: 'Could not load projects'
    }) as ReactElement
    const props = propsOf(state)
    const html = renderToStaticMarkup(state)

    expect(props.className).toBe(
      'ui-error-state ui-error-state--offline ui-error-state--page'
    )
    expect(props['aria-labelledby']).toBe('projects-error-title')
    expect(props['aria-live']).toBe('polite')
    expect(props.role).toBe('status')
    expect(html).toContain('data-slot="error-state-actions"')
    expect(html).toContain('data-slot="error-state-reference"')
  })

  test('keeps static error states out of live regions by default', () => {
    const state = ErrorState({
      graphic: false,
      title: 'Could not load projects'
    }) as ReactElement
    const props = propsOf(state)
    const html = renderToStaticMarkup(state)

    expect(props['aria-label']).toBe('Could not load projects')
    expect(props['aria-live']).toBeUndefined()
    expect(props.role).toBeUndefined()
    expect(html).not.toContain('data-slot="error-state-graphic"')
  })

  test('builds native select with placeholder and normalized options', () => {
    const select = NativeSelect({
      options: ['Alpha', { label: 'Beta', value: 'b' }],
      placeholder: 'Pick',
      size: 8,
      visualSize: 'lg'
    }) as ReactElement
    const props = propsOf(select)
    const children = props.children as [ReactElement, unknown, ReactElement[]]

    expect(select.type).toBe('select')
    expect(props.className).toBe('ui-select ui-select--lg')
    expect(props.size).toBe(8)
    expect(props.defaultValue).toBe('')
    expect(propsOf(children[0]).value).toBe('')
    expect(propsOf(children[0]).disabled).toBe(true)
    expect(propsOf(children[0]).children).toBe('Pick')
    expect(children[2]).toHaveLength(2)
    expect(propsOf(children[2][0]).value).toBe('Alpha')
    expect(propsOf(children[2][1]).value).toBe('b')
  })

  test('omits native select placeholder default when value is controlled', () => {
    expect(propsOf(NativeSelect({}) as ReactElement).defaultValue).toBeUndefined()
    expect(propsOf(NativeSelect({ placeholder: 'Pick', value: 'a' }) as ReactElement).defaultValue).toBeUndefined()
  })

  test('clamps progress value between zero and max', () => {
    const over = Progress({ max: 50, value: 150 }) as ReactElement
    const overProps = propsOf(over)
    const overBar = overProps.children as ReactElement

    expect(overProps.role).toBe('progressbar')
    expect(overProps['aria-valuemax']).toBe(50)
    expect(overProps['aria-valuenow']).toBe(50)
    expect((propsOf(overBar).style as Record<string, string>).width).toBe('100%')

    const under = Progress({ value: -10 }) as ReactElement
    expect(propsOf(under)['aria-valuenow']).toBe(0)
    expect(((propsOf(under).children as ReactElement).props as Props).style).toEqual({ width: '0%' })

    const invalidMax = Progress({ max: 0, value: 25 }) as ReactElement
    expect(propsOf(invalidMax)['aria-valuemax']).toBe(100)
  })

  test('exposes separator orientation semantics', () => {
    const horizontal = Separator({}) as ReactElement
    const vertical = Separator({ orientation: 'vertical' }) as ReactElement

    expect(horizontal.type).toBe('hr')
    expect(propsOf(horizontal).className).toBe('ui-separator ui-separator--horizontal')
    expect(propsOf(horizontal)['data-orientation']).toBe('horizontal')
    expect(propsOf(vertical).className).toBe('ui-separator ui-separator--vertical')
    expect(propsOf(vertical)['aria-orientation']).toBe('vertical')
  })

  test('flags spinner accessibility based on labelling', () => {
    const decorative = Spinner({}) as ReactElement
    const status = Spinner({ 'aria-label': 'Loading' }) as ReactElement

    expect(propsOf(decorative)['aria-hidden']).toBe(true)
    expect(propsOf(decorative).role).toBeUndefined()
    expect(propsOf(status)['aria-hidden']).toBeUndefined()
    expect(propsOf(status).role).toBe('status')
    expect(propsOf(status)['aria-label']).toBe('Loading')
  })

  test('marks marker variants and runtime data hooks', () => {
    expect(propsOf(Marker({}) as ReactElement).className).toBe('ui-marker')
    expect(propsOf(Marker({ variant: 'success' }) as ReactElement).className).toBe('ui-marker ui-marker--success')
    const viewport = propsOf(ToastViewport({ placement: 'top-right' }) as ReactElement)

    expect(viewport['data-ui-toast-viewport']).toBe(true)
    expect(viewport['data-placement']).toBe('top-right')
    expect(viewport['data-ui-toast-max']).toBe(3)
    expect(Reflect.get(LumenReact, 'Sonner')).toBe(ToastViewport)
    expect(propsOf(ThemeBuilder({}) as ReactElement)['data-ui-theme-builder']).toBe(true)
  })

  test('defaults textarea rows and tag group role', () => {
    expect(propsOf(Textarea({}) as ReactElement).rows).toBe(4)
    expect(propsOf(Textarea({ rows: 8 }) as ReactElement).rows).toBe(8)
    expect(propsOf(Textarea({}) as ReactElement).className).toBe('ui-textarea')
    expect(propsOf(TagGroup({}) as ReactElement).role).toBe('list')
    expect(propsOf(TagGroup({ role: 'group' }) as ReactElement).role).toBe('group')
  })

  test('derives toast live region and role from variant', () => {
    const status = Toast({}) as ReactElement
    const alert = Toast({ variant: 'destructive' }) as ReactElement

    expect(propsOf(status)['aria-live']).toBe('polite')
    expect(propsOf(status).role).toBe('status')
    expect(propsOf(status).className).toBe('ui-toast')
    expect(propsOf(alert)['aria-live']).toBe('assertive')
    expect(propsOf(alert).role).toBe('alert')
    expect(propsOf(alert).className).toBe('ui-toast ui-toast--destructive')
    expect(propsOf(alert)['data-variant']).toBe('destructive')
  })

  test('reflects toggle pressed state', () => {
    expect(propsOf(Toggle({}) as ReactElement)['aria-pressed']).toBe(false)
    expect(propsOf(Toggle({}) as ReactElement).className).toBe('ui-toggle')
    expect(propsOf(Toggle({}) as ReactElement).type).toBe('button')
    expect(propsOf(Toggle({ pressed: true }) as ReactElement)['aria-pressed']).toBe(true)
    expect(propsOf(Toggle({ pressed: true }) as ReactElement).className).toBe('ui-toggle')
    expect(propsOf(Toggle({ controlled: true }) as ReactElement)['data-ui-controlled']).toBe(true)
    expect(propsOf(ToggleGroup({}) as ReactElement)['data-ui-toggle-group']).toBe(true)
  })

  test('supports migration-friendly links, pills, and navigation surfaces', () => {
    const newTabLink = Link({
      href: 'https://example.com',
      newTab: true,
      rel: 'external'
    }) as ReactElement
    const linkedPill = Pill({
      children: 'Topic',
      count: 4,
      href: '/topics/lumen',
      variant: 'brand'
    }) as ReactElement
    const anchor = Anchor({
      items: [{ depth: 3, href: '#usage', label: 'Usage' }]
    }) as ReactElement
    const anchorChildren = propsOf(anchor).children as [ReactElement, unknown]
    const anchorItems = propsOf(anchorChildren[0]).children as ReactElement[]
    const anchorLink = propsOf(anchorItems[0]).children as ReactElement

    expect(newTabLink.type).toBe('a')
    expect(propsOf(newTabLink).target).toBe('_blank')
    expect(propsOf(newTabLink).rel).toBe('external noopener noreferrer')
    expect(propsOf(Link({ variant: 'inherit' }) as ReactElement).className).toBe('ui-link ui-link--inherit')
    expect(linkedPill.type).toBe('a')
    expect(propsOf(linkedPill).href).toBe('/topics/lumen')
    expect(propsOf(linkedPill).className).toBe('ui-pill ui-pill--brand')
    expect(propsOf(linkedPill)['data-variant']).toBe('brand')
    expect(propsOf(anchorLink)['data-depth']).toBe(3)
    expect(propsOf(anchorLink)['aria-current']).toBe('location')
    expect(propsOf(NavigationMenu({ variant: 'unstyled' }) as ReactElement).className)
      .toBe('ui-navigation-menu ui-navigation-menu--unstyled')
    expect(propsOf(Sidebar({ variant: 'unstyled' }) as ReactElement).className)
      .toBe('ui-sidebar ui-sidebar--unstyled')
  })

  test('supports semantic items and stable progress indicator parts', () => {
    const item = Item({ as: 'article', children: 'Release' }) as ReactElement
    const progress = Progress({ value: 40 }) as ReactElement
    const indicator = propsOf(progress).children as ReactElement

    expect(item.type).toBe('article')
    expect(propsOf(item)['data-slot']).toBe('item')
    expect(propsOf(indicator)['data-slot']).toBe('progress-indicator')
  })

  test('renders remaining structural primitives', () => {
    expect(propsOf(Typography({}) as ReactElement).className).toBe('ui-typography')
    expect(propsOf(Agenda({ glass: true }) as ReactElement).className).toBe('ui-agenda ui-agenda--glass')
    expect((Chart({}) as ReactElement).type).toBe('figure')
    expect(propsOf(Chart({}) as ReactElement).className).toBe('ui-chart')
    expect(propsOf(Sheet({}) as ReactElement)['data-ui-sheet']).toBe(true)
    expect(propsOf(Sheet({}) as ReactElement)['data-surface']).toBe('default')
  })

  test('renders data chart primitives from shared series contracts', () => {
    const series = [{
      data: [
        { x: 'Mon', y: 4 },
        { x: 'Tue', y: 8 }
      ],
      id: 'downloads',
      label: 'Downloads'
    }]
    const bars = BarChart({
      heading: 'Package downloads',
      orientation: 'horizontal',
      series
    }) as ReactElement
    const line = LineChart({
      area: true,
      referenceValue: 6,
      series
    }) as ReactElement
    const pie = PieChart({
      centerLabel: 'Total',
      centerValue: '12',
      series: {
        data: [
          { label: 'Astro', x: 'astro', y: 8 },
          { label: 'React', x: 'react', y: 4 }
        ],
        id: 'downloads',
        label: 'Downloads'
      }
    }) as ReactElement
    const sparkline = Sparkline({
      area: true,
      label: 'Downloads increased from 4 to 8',
      values: [4, 8]
    }) as ReactElement
    const scatter = ScatterChart({
      series: [{ data: [{ size: 12, x: 1, y: 4 }, { size: 20, x: 2, y: 8 }], id: 'downloads', label: 'Downloads' }]
    }) as ReactElement
    const heatmap = Heatmap({
      data: [{ value: 8, x: 'Mon', y: 'Morning' }]
    }) as ReactElement
    const range = RangeChart({
      data: [{ high: 12, low: 4, x: 'Mon' }]
    }) as ReactElement
    const combo = ComboChart({
      series: [{ data: series[0]?.data ?? [], id: 'downloads', label: 'Downloads', mark: 'line' }]
    }) as ReactElement

    expect(bars.type).toBe(Chart)
    expect(propsOf(bars).className).toBe('ui-bar-chart')
    expect(propsOf(bars).heading).toBe('Package downloads')
    expect(line.type).toBe(Chart)
    expect(propsOf(line).className).toBe('ui-line-chart')
    expect(pie.type).toBe(Chart)
    expect(propsOf(pie).className).toBe('ui-pie-chart ui-pie-chart--donut')
    expect(sparkline.type).toBe('span')
    expect(propsOf(sparkline).role).toBe('img')
    expect(propsOf(sparkline)['aria-label']).toBe('Downloads increased from 4 to 8')
    expect(propsOf(sparkline).className).toBe('ui-sparkline ui-chart-tone--series-1')
    expect(propsOf(scatter).className).toBe('ui-scatter-chart')
    expect(propsOf(heatmap).className).toBe('ui-heatmap')
    expect(propsOf(range).className).toBe('ui-range-chart ui-chart-tone--series-1')
    expect(propsOf(combo).className).toBe('ui-combo-chart')
  })

  test('omits unavailable heatmap cells from the SVG while preserving table gaps', () => {
    const heatmap = Heatmap({
      data: [
        { value: 8, x: 'Mon', y: 'Morning' },
        { value: null, x: 'Tue', y: 'Morning' },
        { value: Number.POSITIVE_INFINITY, x: 'Wed', y: 'Morning' }
      ]
    }) as ReactElement
    const descendants = descendantsOf(heatmap)
    const cells = descendants.filter(element => element.type === 'rect')
    const tableValues = descendants
      .filter(element => element.type === 'td')
      .map(element => propsOf(element).children)

    expect(cells).toHaveLength(1)
    expect(tableValues.filter(value => value === 'Not available')).toHaveLength(2)
  })

  test('preserves heatmap coordinate types in fallback keys', () => {
    const heatmap = Heatmap({
      data: [
        { value: 4, x: 1, y: 'row' },
        { value: 8, x: '1', y: 'row' }
      ]
    }) as ReactElement
    const descendants = descendantsOf(heatmap)
    const cellKeys = descendants.filter(element => element.type === 'rect').map(element => element.key)
    const rowKeys = descendants
      .filter(element => element.type === 'tr' && element.key !== null)
      .map(element => element.key)

    expect(new Set(cellKeys).size).toBe(2)
    expect(new Set(rowKeys).size).toBe(2)
  })

  test('treats non-finite range bounds as unavailable in the disclosure table', () => {
    const range = RangeChart({
      data: [{ high: Number.POSITIVE_INFINITY, low: Number.NaN, x: 'Mon' }],
      formatValue: value => {
        if (!Number.isFinite(value)) throw new Error('Expected only finite range values')

        return String(value)
      }
    }) as ReactElement
    const tableValues = descendantsOf(range)
      .filter(element => element.type === 'td')
      .map(element => propsOf(element).children)

    expect(tableValues).toEqual(['Not available', 'Not available'])
  })

  test('preserves range coordinate types in fallback keys', () => {
    const range = RangeChart({
      data: [
        { high: 4, low: 1, x: 1 },
        { high: 8, low: 2, x: '1' }
      ]
    }) as ReactElement
    const descendants = descendantsOf(range)
    const intervalKeys = descendants
      .filter(element => propsOf(element).className === 'ui-range-chart__interval')
      .map(element => element.key)
    const rowKeys = descendants
      .filter(element => element.type === 'tr' && element.key !== null)
      .map(element => element.key)

    expect(new Set(intervalKeys).size).toBe(2)
    expect(new Set(rowKeys).size).toBe(2)
  })

  test('treats non-finite scatter sizes as unavailable in the disclosure table', () => {
    const scatter = ScatterChart({
      formatValue: value => {
        if (!Number.isFinite(value)) throw new Error('Expected only finite scatter values')

        return String(value)
      },
      series: [{
        data: [
          { size: Number.NaN, x: 1, y: 4 },
          { size: Number.POSITIVE_INFINITY, x: 2, y: 8 }
        ],
        id: 'downloads',
        label: 'Downloads'
      }]
    }) as ReactElement
    const tableValues = descendantsOf(scatter)
      .filter(element => element.type === 'td')
      .map(element => propsOf(element).children)

    expect(tableValues).toEqual([
      'Downloads',
      '4',
      'Not available',
      'Downloads',
      '8',
      'Not available'
    ])
  })

  test('keeps repeated scatter coordinates as distinct marks and rows', () => {
    const scatter = ScatterChart({
      series: [{
        data: [{ x: 1, y: 4 }, { x: 1, y: 8 }],
        id: 'downloads',
        label: 'Downloads'
      }]
    }) as ReactElement
    const descendants = descendantsOf(scatter)
    const circleKeys = descendants
      .filter(element => element.type === 'circle')
      .map(element => element.key)
    const rowKeys = descendants
      .filter(element => element.type === 'tr' && element.key !== null)
      .map(element => element.key)

    expect(new Set(circleKeys).size).toBe(2)
    expect(new Set(rowKeys).size).toBe(2)
  })

  test('summarizes only scatter points that can be drawn', () => {
    const scatter = ScatterChart({
      series: [{
        data: [{ x: 0, y: 1 }, { x: 'invalid', y: 1000 }],
        id: 'downloads',
        label: 'Downloads'
      }]
    }) as ReactElement

    expect(propsOf(scatter).summary).toBe('1 series, 1 point. Values range from 1 to 1.')
  })

  test('aligns combo line points with bar category centers', () => {
    const data = [
      { x: 'Mon', y: 4 },
      { x: 'Tue', y: 8 },
      { x: 'Wed', y: 6 }
    ]
    const combo = ComboChart({
      series: [
        { data, id: 'bars', label: 'Bars', mark: 'bar' },
        { data, id: 'line', label: 'Line', mark: 'line' }
      ]
    }) as ReactElement
    const descendants = descendantsOf(combo)
    const categoryCenters = descendants
      .filter(element => element.type === 'rect')
      .map(element => Number((Number(propsOf(element).x) + Number(propsOf(element).width) / 2).toFixed(3)))
    const line = descendants.find(element => propsOf(element).className === 'ui-line-chart__line')
    const lineXCoordinates = [...String(propsOf(line).d).matchAll(/[LM]\s+(-?\d+(?:\.\d+)?)/gu)]
      .map(match => Number(match[1]))

    expect(categoryCenters).toHaveLength(3)
    expect(lineXCoordinates).toEqual(categoryCenters)
  })

  test('renders the empty state when chart series contain no usable data', () => {
    const pieSeries = {
      data: [],
      id: 'downloads',
      label: 'Downloads'
    }
    const series = [pieSeries]

    for (const chart of [
      BarChart({ series }),
      LineChart({ series }),
      PieChart({ series: pieSeries })
    ]) {
      const children = propsOf(chart as ReactElement).children
      const elements = (Array.isArray(children) ? children : [children])
        .filter(isValidElement)
      const plot = elements.find(child => String(propsOf(child).className).includes('ui-chart__plot'))

      expect(elements.some(child => propsOf(child).className === 'ui-chart__empty')).toBe(true)
      expect(propsOf(plot).hidden).toBe(true)
      expect(elements.some(child => propsOf(child).className === 'ui-chart__data')).toBe(false)
    }
  })

  test('summarizes only rendered pie slices', () => {
    const pie = PieChart({
      series: {
        data: [{ x: 'Available', y: 8 }, { x: 'Zero', y: 0 }, { x: 'Negative', y: -2 }],
        id: 'share',
        label: 'Share'
      }
    }) as ReactElement

    expect(propsOf(pie).summary).toContain('1 point')
    expect(propsOf(pie).summary).toContain('8 to 8')
  })

  test('sets text direction default', () => {
    expect(propsOf(Direction({}) as ReactElement).dir).toBe('ltr')
    expect(propsOf(Direction({ dir: 'rtl' }) as ReactElement).dir).toBe('rtl')
    expect(propsOf(Direction({}) as ReactElement).className).toBe('ui-direction')
  })

  test('switches attachment element by href presence', () => {
    const article = Attachment({}) as ReactElement
    const link = Attachment({ href: '/file.pdf' }) as ReactElement

    expect(article.type).toBe('article')
    expect(propsOf(article).className).toBe('ui-attachment')
    expect(link.type).toBe('a')
    expect(propsOf(link).href).toBe('/file.pdf')
    expect(propsOf(link).className).toBe('ui-attachment')
  })

  test('marks overlay and surface primitives with runtime hooks', () => {
    expect(propsOf(Carousel({}) as ReactElement)['data-ui-carousel']).toBe(true)
    expect(propsOf(Carousel({}) as ReactElement).className).toBe('ui-carousel')
    expect(propsOf(Command({ glass: true }) as ReactElement)['data-ui-command']).toBe(true)
    expect(propsOf(Command({ glass: true }) as ReactElement).className).toBe('ui-command ui-command--glass')
    expect(propsOf(Drawer({}) as ReactElement)['data-ui-drawer']).toBe(true)
    expect(propsOf(Drawer({ glass: true }) as ReactElement)['data-surface']).toBe('glass')
    expect(propsOf(Drawer({ glass: true }) as ReactElement).className).toBe('ui-drawer ui-drawer--glass')
  })

  test('renders context menu with menu role and surface data', () => {
    const menu = ContextMenu({}) as ReactElement

    expect(menu.type).toBe('menu')
    expect(propsOf(menu).role).toBe('menu')
    expect(propsOf(menu)['data-ui-context-menu']).toBe(true)
    expect(propsOf(menu)['data-surface']).toBe('default')
    expect(propsOf(menu).className).toBe('ui-menu')
  })

  test('defaults color picker input type', () => {
    const picker = ColorPicker({}) as ReactElement

    expect(picker.type).toBe('input')
    expect(propsOf(picker).type).toBe('color')
    expect(propsOf(picker).className).toBe('ui-color-picker')
  })

  test('configures autocomplete combobox semantics', () => {
    const autocomplete = Autocomplete({ list: 'fruit-options' }) as ReactElement
    const props = propsOf(autocomplete)

    expect(autocomplete.type).toBe('input')
    expect(props.role).toBe('combobox')
    expect(props['aria-autocomplete']).toBe('list')
    expect(props.type).toBe('search')
    expect(props.list).toBe('fruit-options')
    expect(props.className).toBe('ui-input ui-autocomplete')
  })
})
