"use client"

import Link from "next/link"
import Image from "next/image"
import { ModeToggle } from "@/components/mode-toggle"

export function PublicNav() {
  return (
    <header className="fixed top-0 left-0 z-50 h-16 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 ml-2">
        {/* Logo with Link */}
        <Link href="/" className="flex items-center">
          {/* Light Mode Logo */}
          <Image
            src="/logo-light.svg"
            alt="Pintell Logo Light"
            width={72}
            height={24}
            className="h-8 w-auto sm:h-8 md:h-9 transition-opacity duration-300 dark:hidden"
            priority
          />
          {/* Dark Mode Logo */}
          <Image
            src="/logo-dark.svg"
            alt="Pintell Logo Dark"
            width={72}
            height={24}
            className="h-8 w-auto sm:h-8 md:h-9 transition-opacity duration-300 hidden dark:block"
            priority
          />
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
} 