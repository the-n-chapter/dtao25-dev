import Link from "next/link"
import Image from "next/image"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center md:gap-8">
          {/* Illustration - Left on desktop, bottom on mobile */}
          <div className="order-2 md:order-1 mt-12 md:mt-0 md:w-1/2 flex justify-center">
            <Image
              src="https://illustrations.popsy.co/white/abstract-art-3.svg"
              alt="Abstract art"
              width={300}
              height={300}
              priority
              className="max-w-full h-auto"
            />
          </div>

          {/* Content - Right on desktop, top on mobile */}
          <div className="order-1 md:order-2 md:w-1/2 flex flex-col items-center justify-center space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl tracking-tight">
                Welcome to <span className="text-[#5DA9E9]">SmartPin</span>
              </h1>
              <p className="text-muted-foreground text-justify px-4">
                A moisture tracker where you can access real-time data from SmartPin-connected clothing. Stay informed. Stay smart.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Link
                href="/signup"
                className="flex h-12 items-center justify-center rounded-xl bg-[#5DA9E9] px-4 py-3 text-center text-lg font-medium text-white hover:bg-[#4A98D8] transition-colors w-48"
              >
                Signup
              </Link>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-xl bg-[#5DA9E9] px-4 py-3 text-center text-lg font-medium text-white hover:bg-[#4A98D8] transition-colors w-48"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

