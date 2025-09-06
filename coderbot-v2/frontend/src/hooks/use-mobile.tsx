import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Inicializar com valor síncrono para evitar hydration mismatch
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    return false
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // Usar o listener moderno se disponível
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange)
    } else {
      // Fallback para navegadores antigos
      mql.addListener(onChange)
    }

    // Garantir estado inicial correto
    setIsMobile(mql.matches)

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange)
      } else {
        mql.removeListener(onChange)
      }
    }
  }, []) // Dependências vazias - só executar uma vez

  return isMobile
}
