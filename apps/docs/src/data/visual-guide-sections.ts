const visualGuideSections = ['motion', 'effects', 'charts', 'ai', 'recipes'] as const

export type VisualGuideId = typeof visualGuideSections[number]

export const isVisualGuideId = (value?: string): value is VisualGuideId => visualGuideSections.some(id => id === value)
