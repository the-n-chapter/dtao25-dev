"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

export function PublicNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 ml-2">
        <Link href="/" className="font-bold text-[#5DA9E9]">
          pintell
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
} 