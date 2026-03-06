"use client"

import React, { useState, useCallback, useRef, useMemo, useEffect } from "react"
import { motion, AnimatePresence, useAnimationControls } from "framer-motion"
import { Plus, ChevronLeft, Loader2 } from "lucide-react"
import type { BottomNavbarProps, CTAButton } from "./types"
import { LiquidMetalButton } from "../liquid-metal-button"

const iconWhiteStyle: React.CSSProperties = { color: "rgba(255,255,255,0.9)" }
const whileTapScale08 = { scale: 0.8 }

/* ---- shared easing ---- */
const ease = [0.32, 0.72, 0, 1] as const

/* ---- layout constants ---- */
const NAV_HEIGHT = 68
const MAX_DRAWER_VH = 0.85
const SIDE_INSET = 12
const BOTTOM_INSET = 16
const INNER_PAD = 20
const COLLAPSED_WIDTH = 280
const EXPANDED_WIDTH = `calc(100vw - ${SIDE_INSET * 2}px)`

/* ---- static styles (avoid re-creating objects every render) ---- */
const backdropStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.55)",
}

const fixedWrapperStyle: React.CSSProperties = {
    bottom: BOTTOM_INSET,
    left: 0,
    right: 0,
    pointerEvents: "none",
}

const containerInnerStyle: React.CSSProperties = { display: "inline-flex" }

const mainPanelStyle: React.CSSProperties = {
    overflow: "hidden",
    position: "relative",
    pointerEvents: "auto",
    willChange: "height, width, border-radius",
    contain: "layout style",
    transform: "translateZ(0)",
}

const glassLayerStyle: React.CSSProperties = {
    borderRadius: "inherit",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    transform: "translateZ(0)",
}

const highlightStyle: React.CSSProperties = {
    background:
        "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.12) 50%, transparent 90%)",
}

const navBarStyle: React.CSSProperties = { height: NAV_HEIGHT }

const navItemBtnStyle: React.CSSProperties = { width: 40, height: 40 }


/* ---- static transition configs ---- */
const backdropTransition = { duration: 0.25, ease }
const mainTransition = { duration: 0.35, ease }
const navFadeTransition = { duration: 0.2, ease }
const stepTransition = { duration: 0.2, ease }
const titleTransition = { delay: 0.05, duration: 0.25, ease }
const ctaFadeTransition = { duration: 0.2 }
const backBtnSpring = { type: "spring" as const, damping: 20, stiffness: 300, mass: 0.8 }

export function BottomNavbar({
    navItems,
    activeTab: controlledActiveTab,
    onTabChange,
    defaultActiveTab,
    actionButton,
    drawer,
}: BottomNavbarProps) {
    /* ---- Internal state (used when props are uncontrolled) ---- */
    const [internalTab, setInternalTab] = useState(
        defaultActiveTab ?? navItems[0]?.label ?? ""
    )
    const [internalOpen, setInternalOpen] = useState(false)
    const [internalStep, setInternalStep] = useState(0)

    /* ---- Resolve controlled vs uncontrolled ---- */
    const activeTab = controlledActiveTab ?? internalTab
    const isOpen = drawer?.isOpen ?? internalOpen
    const step = drawer?.currentStep ?? internalStep

    /* ---- Refs for stable callbacks (avoid stale closures) ---- */
    const drawerRef = useRef(drawer)
    drawerRef.current = drawer
    const isOpenRef = useRef(isOpen)
    isOpenRef.current = isOpen

    const setActiveTab = useCallback((label: string) => {
        setInternalTab(label)
        onTabChange?.(label)
    }, [onTabChange])

    const setIsOpen = useCallback((open: boolean) => {
        setInternalOpen(open)
        drawerRef.current?.onOpenChange?.(open)
        if (!open) {
            setInternalStep(0)
            drawerRef.current?.onStepChange?.(0)
        }
    }, [])

    const setStep = useCallback((s: number) => {
        setInternalStep(s)
        drawerRef.current?.onStepChange?.(s)
    }, [])

    /* ---- Actions (stable references) ---- */
    const toggle = useCallback(() => {
        const wasOpen = isOpenRef.current
        setIsOpen(!wasOpen)
        if (wasOpen) setStep(0)
    }, [setIsOpen, setStep])

    const close = useCallback(() => {
        setIsOpen(false)
        setStep(0)
    }, [setIsOpen, setStep])

    /* ---- Container bounce (cancel previous before starting new) ---- */
    const containerControls = useAnimationControls()
    const bouncing = useRef(false)
    const bounce = useCallback(async () => {
        if (bouncing.current) {
            containerControls.stop()
        }
        bouncing.current = true
        await containerControls.start({
            scale: 0.95,
            transition: { duration: 0.1 },
        })
        await containerControls.start({
            scale: 1,
            transition: { type: "spring", damping: 12, stiffness: 500 },
        })
        bouncing.current = false
    }, [containerControls])

    /* ---- Lock body scroll when drawer is open ---- */
    useEffect(() => {
        if (isOpen) {
            const prev = document.body.style.overflow
            document.body.style.overflow = "hidden"
            return () => { document.body.style.overflow = prev }
        }
    }, [isOpen])

    /* ---- Determine CTA layout ---- */
    const ctaButtons = drawer?.ctaButtons ?? []
    const backBtn: CTAButton | null =
        ctaButtons.length > 0 && ctaButtons[0].variant === "secondary"
            ? ctaButtons[0]
            : null
    const actionBtns: CTAButton[] = backBtn ? ctaButtons.slice(1) : ctaButtons

    /* ---- Determine current step content ---- */
    const currentStepData = drawer?.steps?.[step]

    /* ---- Action button config ---- */
    const ActionIcon = actionButton?.icon ?? Plus

    /* ---- Measure drawer content height ---- */
    const contentRef = useRef<HTMLDivElement>(null)
    const [contentHeight, setContentHeight] = useState(0)

    useEffect(() => {
        if (!isOpen || !contentRef.current) {
            if (!isOpen) setContentHeight(0)
            return
        }
        const el = contentRef.current
        let rafId = 0
        const measure = () => {
            // Debounce via rAF to avoid multiple setState calls per frame
            cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(() => {
                const h = el.offsetHeight
                if (h > 0) setContentHeight((prev) => (prev === h ? prev : h))
            })
        }
        // Measure after a frame so content has rendered
        requestAnimationFrame(measure)
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => {
            cancelAnimationFrame(rafId)
            ro.disconnect()
        }
    }, [isOpen, step, currentStepData])

    /* ---- Memoized animate targets (avoid new objects each render) ---- */
    const maxH = (typeof window !== "undefined" ? window.innerHeight : 700) * MAX_DRAWER_VH
    // 24px top padding + 12px bottom padding from drawerContentStyle
    const expandedHeight = isOpen && contentHeight > 0
        ? Math.min(contentHeight + NAV_HEIGHT + 24 + 12, maxH)
        : NAV_HEIGHT
    const mainAnimate = useMemo(() => ({
        height: isOpen ? expandedHeight : NAV_HEIGHT,
        width: isOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        borderRadius: isOpen ? 30 : 50,
    }), [isOpen, expandedHeight])

    const navItemsAnimate = useMemo(() => ({
        opacity: isOpen ? 0 : 1,
        x: isOpen ? -16 : 0,
    }), [isOpen])

    const navItemsStyle = useMemo<React.CSSProperties>(() => ({
        padding: 4,
        pointerEvents: isOpen ? "none" as const : "auto" as const,
    }), [isOpen])

    const ctaOuterStyle = useMemo<React.CSSProperties>(() => ({
        pointerEvents: isOpen ? "auto" as const : "none" as const,
    }), [isOpen])

    const ctaWrapperStyle = useMemo<React.CSSProperties>(() => ({
        paddingLeft: 10,
        paddingRight: 10,
        gap: 0,
    }), [])

    const hasBack = backBtn != null && (step > 0 || backBtn.onClick != null)
    const backBtnAnimate = useMemo(() => ({
        width: hasBack ? 48 : 0,
        marginRight: hasBack ? 8 : 0,
        opacity: hasBack ? 1 : 0,
        scale: hasBack ? 1 : 0.5,
    }), [hasBack])

    const drawerContentStyle = useMemo<React.CSSProperties>(() => ({
        bottom: NAV_HEIGHT,
        padding: `24px ${INNER_PAD}px 12px`,
    }), [])

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={backdropTransition}
                        className="fixed inset-0 z-40"
                        style={backdropStyle}
                        onClick={close}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            <div
                className="fixed z-50 flex justify-center"
                style={fixedWrapperStyle}
            >
                <motion.div
                    animate={containerControls}
                    style={containerInnerStyle}
                >
                    <motion.div
                        animate={mainAnimate}
                        transition={mainTransition}
                        style={mainPanelStyle}
                    >
                        {/* Glass layer */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                ...glassLayerStyle,
                                background: isOpen ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                                transition: "background 0.3s ease",
                            }}
                        />

                        {/* Top inner highlight */}
                        <div
                            className="absolute inset-x-0 top-0 h-px pointer-events-none"
                            style={highlightStyle}
                        />

                        <div className="relative z-10 h-full">
                            {/* ---- Drawer content (above the bar) ---- */}
                            <AnimatePresence mode="wait">
                                {isOpen && currentStepData && (
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: step > 0 ? 30 : 0 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: step > 0 ? -30 : 0 }}
                                        transition={stepTransition}
                                        className="absolute inset-x-0 top-0 overflow-hidden"
                                        style={drawerContentStyle}
                                    >
                                        <div ref={contentRef}>
                                            {currentStepData.title && (
                                                <motion.h2
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={titleTransition}
                                                    className="text-xl font-semibold tracking-tight text-foreground mb-5"
                                                >
                                                    {currentStepData.title}
                                                </motion.h2>
                                            )}

                                            {currentStepData.content}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* ---- Bottom bar ---- */}
                            <div
                                className="absolute inset-x-0 bottom-0"
                                style={navBarStyle}
                            >
                                {/* Collapsed nav items */}
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-around"
                                    animate={navItemsAnimate}
                                    transition={navFadeTransition}
                                    style={navItemsStyle}
                                    role="navigation"
                                    aria-label="Main navigation"
                                >
                                    {navItems.map((item) => {
                                        const isActive = activeTab === item.label
                                        return (
                                            <button
                                                key={item.label}
                                                onClick={() => {
                                                    setActiveTab(item.label)
                                                    bounce()
                                                }}
                                                className="flex items-center justify-center relative"
                                                style={navItemBtnStyle}
                                                aria-label={item.label}
                                                aria-current={isActive ? "page" : undefined}
                                            >
                                                <item.icon
                                                    className="w-[22px] h-[22px] transition-colors duration-200"
                                                    style={{
                                                        color: isActive
                                                            ? "rgba(255,255,255,1)"
                                                            : "rgba(255,255,255,0.35)",
                                                    }}
                                                    strokeWidth={isActive ? 2.2 : 1.6}
                                                />
                                            </button>
                                        )
                                    })}

                                    <LiquidMetalButton
                                        key={isOpen ? "action-open" : "action-closed"}
                                        viewMode="icon"
                                        icon={ActionIcon}
                                        onClick={actionButton?.onClick ?? toggle}
                                        aria-label={actionButton?.label ?? "Open menu"}
                                    />
                                </motion.div>

                                {/* ---- CTA Buttons & Back Button ---- */}
                                <div
                                    className="absolute inset-0"
                                    style={ctaOuterStyle}
                                >
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                key="cta-wrapper"
                                                className="absolute inset-0 flex items-center"
                                                style={ctaWrapperStyle}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={ctaFadeTransition}
                                            >
                                                {/* Back button — always rendered, animated via width/opacity */}
                                                <motion.button
                                                    onClick={backBtn?.disabled ? undefined : backBtn?.onClick}
                                                    whileTap={hasBack && !backBtn?.disabled ? whileTapScale08 : undefined}
                                                    animate={backBtnAnimate}
                                                    transition={backBtnSpring}
                                                    style={{
                                                        height: 48,
                                                        borderRadius: "50%",
                                                        background: "rgba(255,255,255,0.15)",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        flexShrink: 0,
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        cursor: backBtn?.disabled ? "not-allowed" : "pointer",
                                                        pointerEvents: hasBack ? undefined : "none",
                                                        willChange: "width, opacity, transform",
                                                    }}
                                                    aria-label={backBtn?.label ?? "Back"}
                                                >
                                                    {backBtn?.loading ? (
                                                        <Loader2
                                                            className="w-[18px] h-[18px] animate-spin"
                                                            style={iconWhiteStyle}
                                                        />
                                                    ) : backBtn?.icon ? (
                                                        <backBtn.icon
                                                            className="w-[18px] h-[18px]"
                                                            style={iconWhiteStyle}
                                                            strokeWidth={2.2}
                                                        />
                                                    ) : (
                                                        <ChevronLeft
                                                            className="w-[18px] h-[18px]"
                                                            style={iconWhiteStyle}
                                                            strokeWidth={2.2}
                                                        />
                                                    )}
                                                </motion.button>

                                                {/* Action CTA buttons */}
                                                {actionBtns.map((btn, idx) => {
                                                    const isSingleAction = actionBtns.length === 1 && !backBtn
                                                    const isMultiNonFirst = !isSingleAction && idx > 0
                                                    return (
                                                        <motion.div
                                                            key={`action-btn-${idx}`}
                                                            initial={{ opacity: 0, scale: 0.92 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.92 }}
                                                            transition={{
                                                                type: "spring",
                                                                damping: 22,
                                                                stiffness: 280,
                                                                delay: idx * 0.04,
                                                            }}
                                                            style={{
                                                                height: 48,
                                                                flex: 1,
                                                                marginLeft: isMultiNonFirst ? 8 : undefined,
                                                                overflow: "hidden",
                                                                pointerEvents: isOpen ? undefined : "none",
                                                            }}
                                                        >
                                                            <LiquidMetalButton
                                                                viewMode="text"
                                                                label={btn.label}
                                                                icon={btn.icon}
                                                                onClick={btn.onClick}
                                                                disabled={btn.disabled}
                                                                loading={btn.loading}
                                                                width="100%"
                                                                height={48}
                                                                aria-label={btn.label}
                                                            />
                                                        </motion.div>
                                                    )
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </>
    )
}

export type { NavItem, DrawerStep, CTAButton, ActionButton, BottomNavbarProps } from "./types"
