import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

/* ---- Nav ---- */
export interface NavItem {
  icon: LucideIcon
  label: string
}

/* ---- Drawer Steps ---- */
export interface DrawerStep {
  /** Title shown at the top of the step */
  title: string
  /** Fully custom content rendered in the drawer body */
  content: ReactNode
}

/* ---- CTA Buttons ---- */
export interface CTAButton {
  label: string
  icon?: LucideIcon
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  variant?: "primary" | "secondary"
}

/* ---- Action Button (the "+" trigger) ---- */
export interface ActionButton {
  icon: LucideIcon
  label?: string
  onClick?: () => void
}

/* ---- Component Props ---- */
export interface BottomNavbarProps {
  /** Navigation items rendered in the collapsed bar */
  navItems: NavItem[]

  /** Currently active tab label (controlled). If omitted, uses internal state. */
  activeTab?: string
  /** Callback when a nav tab is selected */
  onTabChange?: (label: string) => void
  /** Default active tab when uncontrolled */
  defaultActiveTab?: string

  /** Action button config (defaults to a "+" icon that opens the drawer) */
  actionButton?: ActionButton

  /** Drawer configuration. If omitted, the drawer feature is disabled. */
  drawer?: {
    /** Ordered list of steps */
    steps: DrawerStep[]
    /** CTA buttons for the current step. Max 2 — [back, primary] or [primary] */
    ctaButtons: CTAButton[]
    /** Current step index (controlled). If omitted, uses internal state. */
    currentStep?: number
    /** Callback when step changes */
    onStepChange?: (step: number) => void

    /** Whether the drawer is open (controlled). If omitted, uses internal state. */
    isOpen?: boolean
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void
  }
}
