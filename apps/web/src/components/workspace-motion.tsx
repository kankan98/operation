"use client"

import { MotionConfig, motion, useReducedMotion } from "motion/react"

const enterTransition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
} as const

const quickTransition = {
  duration: 0.16,
  ease: [0.2, 0, 0, 1],
} as const

export function WorkspaceMotionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MotionConfig reducedMotion="user" transition={enterTransition}>
      {children}
    </MotionConfig>
  )
}

export function MotionPage({
  children,
  motionKey,
}: {
  children: React.ReactNode
  motionKey: string
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      key={motionKey}
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 10, filter: "blur(4px)" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={enterTransition}
    >
      {children}
    </motion.div>
  )
}

export function MotionPanel({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 8, filter: "blur(3px)" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...enterTransition, delay }}
    >
      {children}
    </motion.div>
  )
}

export function MotionListItem({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...quickTransition, delay }}
    >
      {children}
    </motion.div>
  )
}
