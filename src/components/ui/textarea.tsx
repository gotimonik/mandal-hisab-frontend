"use client"

import * as React from "react"
import { cn } from "cn"

/** Chrome / Android size a textarea to its text with CSS (field-sizing). Safari / iOS can't yet. */
const growsByItself = () => typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content")

/** Without field-sizing: grow the box to its text (as tall as its content, never shorter than `rows`), so it never scrolls inside. */
function fitToText(el: HTMLTextAreaElement | null) {
  if (!el || growsByItself()) return
  el.style.height = "auto"
  const border = el.offsetHeight - el.clientHeight
  el.style.height = `${el.scrollHeight + border}px`
}

function Textarea({ className, ref, onInput, ...props }: React.ComponentProps<"textarea">) {
  const inner = React.useRef<HTMLTextAreaElement | null>(null)
  // keep the caller's ref (react-hook-form's register) working too
  const setRef = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      inner.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [ref]
  )
  // on mount, when a controlled value changes, and when the box changes width (rotation, dialogs opening)
  React.useLayoutEffect(() => fitToText(inner.current), [props.value])
  React.useEffect(() => {
    const el = inner.current
    if (!el || growsByItself() || typeof ResizeObserver === "undefined") return
    let width = el.clientWidth
    const ro = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth
        fitToText(el)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <textarea
      ref={setRef}
      data-slot="textarea"
      onInput={(e) => {
        fitToText(e.currentTarget)
        onInput?.(e)
      }}
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none overflow-hidden rounded-xl border border-input bg-card px-3 py-2 text-base shadow-xs md:rounded-lg transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
