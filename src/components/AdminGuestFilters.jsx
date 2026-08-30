import { useEffect, useRef, useState } from 'react'
import { ATTENDANCE_FILTERS, DIETARY_FILTER, countActiveFilters } from '../lib/guestFilters'

/**
 * The Filters control: a toolbar button that opens a panel of checkboxes.
 *
 * It owns only whether the panel is open. Which filters are set lives with the
 * table, since the table is what has to apply them.
 */
export function AdminGuestFilters({ active, onToggle, onClear }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const activeCount = countActiveFilters(active)

  /* The two ways anyone expects a popover to go away. Listeners are bound only
     while it is open, and on pointerdown rather than click so a press that
     starts outside dismisses the panel before it can land on whatever is
     behind it. */
  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const renderOption = (filter, separated) => (
    <label
      key={filter.key}
      className={`admin-filters-option${separated ? ' admin-filters-option--separated' : ''}`}
    >
      <input
        type="checkbox"
        checked={Boolean(active[filter.key])}
        onChange={(event) => onToggle(filter.key, event.target.checked)}
      />
      <span>{filter.label}</span>
    </label>
  )

  return (
    <div className="admin-filters" ref={rootRef}>
      <button
        type="button"
        className="admin-filters-toggle"
        /* Absent rather than "false" when off, so CSS can match on [data-active]. */
        data-active={activeCount > 0 || undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {/* Funnel on phones, where the label is clipped to keep the button on
            the search field's line. The label stays in the DOM either way,
            because it is what names this button for a screen reader. */}
        <svg className="admin-filters-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 5h16l-6 7.5V19l-4 2v-8.5z" />
        </svg>
        <span className="admin-filters-text">Filters</span>
      </button>

      {open && (
        <div className="admin-filters-panel" role="group" aria-label="Filter guests">
          {ATTENDANCE_FILTERS.map((filter) => renderOption(filter, false))}
          {renderOption(DIETARY_FILTER, true)}

          <button
            type="button"
            className="admin-filters-clear"
            onClick={onClear}
            disabled={activeCount === 0}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
