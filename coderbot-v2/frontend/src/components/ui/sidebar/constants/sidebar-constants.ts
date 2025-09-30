/**
 * Constantes do componente Sidebar
 *
 * Centraliza todas as constantes relacionadas ao sidebar para facilitar manutenção
 * e evitar duplicação de valores mágicos.
 */

export const SIDEBAR_CONSTANTS = {
  COOKIE: {
    NAME: "sidebar:state",
    MAX_AGE: 60 * 60 * 24 * 7, // 7 dias
  },
  DIMENSIONS: {
    DESKTOP: "16rem",
    MOBILE: "18rem",
    ICON: "3rem",
  },
  KEYBOARD: {
    SHORTCUT: "b",
  },
  ANIMATION: {
    DURATION: 200,
    EASING: "ease-linear",
  },
} as const

export const SIDEBAR_WIDTH = SIDEBAR_CONSTANTS.DIMENSIONS.DESKTOP
export const SIDEBAR_WIDTH_MOBILE = SIDEBAR_CONSTANTS.DIMENSIONS.MOBILE
export const SIDEBAR_WIDTH_ICON = SIDEBAR_CONSTANTS.DIMENSIONS.ICON
export const SIDEBAR_COOKIE_NAME = SIDEBAR_CONSTANTS.COOKIE.NAME
export const SIDEBAR_COOKIE_MAX_AGE = SIDEBAR_CONSTANTS.COOKIE.MAX_AGE
export const SIDEBAR_KEYBOARD_SHORTCUT = SIDEBAR_CONSTANTS.KEYBOARD.SHORTCUT
