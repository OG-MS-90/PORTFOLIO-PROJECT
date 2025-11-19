"use client"

import { cn } from "@/lib/utils"

export const Component = () => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
      )}
    >
      <div className="loader-wrapper">
        <span className="loader-letter">G</span>
        <span className="loader-letter">e</span>
        <span className="loader-letter">n</span>
        <span className="loader-letter">e</span>
        <span className="loader-letter">r</span>
        <span className="loader-letter">a</span>
        <span className="loader-letter">t</span>
        <span className="loader-letter">i</span>
        <span className="loader-letter">n</span>
        <span className="loader-letter">g</span>

        <div className="loader" aria-hidden />
      </div>
    </div>
  )
}
