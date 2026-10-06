'use client'

import type { ComponentProps } from 'react'

import { motion, MotionConfig, useReducedMotion } from 'motion/react'

import { Button, Card, Stack } from './components.js'

const AnimatedButton = motion.create(Button)
/** Optional entry point: import only when the application has installed Motion. */
const AnimatedCard = motion.create(Card)
const AnimatedStack = motion.create(Stack)

export const MotionCard = (props: ComponentProps<typeof AnimatedCard>) => <AnimatedCard {...props} />
export const MotionStack = (props: ComponentProps<typeof AnimatedStack>) => <AnimatedStack {...props} />

export const LumenMotionConfig = ({ children, ...props }: Omit<ComponentProps<typeof MotionConfig>, 'reducedMotion'>) => (
  <MotionConfig {...props} reducedMotion="user">{children}</MotionConfig>
)

/** Keeps native button semantics and turns transform gestures off for reduced motion. */
export const MotionButton = ({ whileHover, whileTap, ...props }: ComponentProps<typeof AnimatedButton>) => {
  const reduced = useReducedMotion()

  const gestures = reduced ?
    {} :
    {
      ...(whileHover === undefined ? {} : { whileHover }),
      ...(whileTap === undefined ? {} : { whileTap })
    }

  return <AnimatedButton {...props} {...gestures} />
}
