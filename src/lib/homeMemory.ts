/**
 * Session memory for the visitor's place in the home experience.
 *
 * Leaving home for a project page and coming back re-creates the island from
 * scratch (ClientRouter swaps the body and React re-hydrates), so without this
 * a returning visitor always lands on the first work / the top of the grid and
 * loses where they were. The chosen display already persists this way
 * (sessionStorage, see HomeExperience); these keys extend the same policy to
 * the POSITION within each display.
 *
 * The stage index is remembered continuously and recalled on every stage
 * mount. The grid scroll is read-and-clear: it is captured at the moment a
 * navigation away begins and consumed by the next grid mount, so a plain
 * display toggle (which deliberately starts the grid at the top) never
 * inherits a stale offset.
 */

const STAGE_INDEX_KEY = 'home-stage-index'
const GRID_SCROLL_KEY = 'home-grid-scroll'

export function rememberStageIndex(index: number): void {
  try {
    window.sessionStorage.setItem(STAGE_INDEX_KEY, String(index))
  } catch {
    /* storage unavailable — the next visit simply starts from the first work */
  }
}

export function recallStageIndex(): number {
  try {
    const parsed = Number(window.sessionStorage.getItem(STAGE_INDEX_KEY))
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
  } catch {
    return 0
  }
}

export function rememberGridScroll(y: number): void {
  try {
    window.sessionStorage.setItem(GRID_SCROLL_KEY, String(Math.round(y)))
  } catch {
    /* storage unavailable — the grid just reopens at the top */
  }
}

/** Read and clear the saved grid offset — each save is restored at most once. */
export function takeGridScroll(): number {
  try {
    const parsed = Number(window.sessionStorage.getItem(GRID_SCROLL_KEY))
    window.sessionStorage.removeItem(GRID_SCROLL_KEY)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  } catch {
    return 0
  }
}
