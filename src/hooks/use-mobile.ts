import * as React from "react"

// Tailwind CSS default breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

const MOBILE_BREAKPOINT = BREAKPOINTS.md

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * Hook to detect if the screen is at or below a specific breakpoint
 * @param breakpoint - The breakpoint to check against (sm, md, lg, xl, 2xl)
 * @returns true if the screen width is less than the breakpoint
 */
export function useIsBelow(breakpoint: Breakpoint) {
  const [isBelow, setIsBelow] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const bp = BREAKPOINTS[breakpoint]
    const mql = window.matchMedia(`(max-width: ${bp - 1}px)`)
    const onChange = () => {
      setIsBelow(window.innerWidth < bp)
    }
    mql.addEventListener("change", onChange)
    setIsBelow(window.innerWidth < bp)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return !!isBelow
}

/**
 * Hook to detect if the screen is at or above a specific breakpoint
 * @param breakpoint - The breakpoint to check against (sm, md, lg, xl, 2xl)
 * @returns true if the screen width is greater than or equal to the breakpoint
 */
export function useIsAbove(breakpoint: Breakpoint) {
  const [isAbove, setIsAbove] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const bp = BREAKPOINTS[breakpoint]
    const mql = window.matchMedia(`(min-width: ${bp}px)`)
    const onChange = () => {
      setIsAbove(window.innerWidth >= bp)
    }
    mql.addEventListener("change", onChange)
    setIsAbove(window.innerWidth >= bp)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return !!isAbove
}

/**
 * Hook to get the current breakpoint
 * @returns The current breakpoint name or 'xs' if below sm
 */
export function useBreakpoint(): "xs" | Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<"xs" | Breakpoint>("xs")

  React.useEffect(() => {
    const getBreakpoint = (): "xs" | Breakpoint => {
      const width = window.innerWidth
      if (width >= BREAKPOINTS["2xl"]) return "2xl"
      if (width >= BREAKPOINTS.xl) return "xl"
      if (width >= BREAKPOINTS.lg) return "lg"
      if (width >= BREAKPOINTS.md) return "md"
      if (width >= BREAKPOINTS.sm) return "sm"
      return "xs"
    }

    const onChange = () => {
      setBreakpoint(getBreakpoint())
    }

    // Create media queries for all breakpoints
    const mediaQueries = Object.values(BREAKPOINTS).map((bp) => {
      const mql = window.matchMedia(`(min-width: ${bp}px)`)
      mql.addEventListener("change", onChange)
      return mql
    })

    setBreakpoint(getBreakpoint())

    return () => {
      mediaQueries.forEach((mql) => {
        mql.removeEventListener("change", onChange)
      })
    }
  }, [])

  return breakpoint
}

/**
 * Hook to detect touch-capable devices
 * @returns true if the device supports touch input
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches
      )
    }
    checkTouch()
  }, [])

  return isTouch
}

/**
 * Hook to detect the window dimensions with debounce
 * @returns Current window width and height
 */
export function useWindowSize() {
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, 100)
    }

    // Set initial size
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return size
}

/**
 * Hook to detect landscape orientation
 * @returns true if the device is in landscape mode
 */
export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(orientation: landscape)")
    const onChange = () => {
      setIsLandscape(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setIsLandscape(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isLandscape
}
