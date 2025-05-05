"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { login, getMyProfile } from "@/lib/front_end_api_service"

// Define the validation schema with Zod
const loginSchema = z.object({
  username: z.string().min(5, "Username must be at least 5 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true)

    try {
      // Call the login API
      const token = await login(values)
      
      // Save the token to localStorage for future authenticated requests
      localStorage.setItem("authToken", token)

      // Get user profile data
      const userProfile = await getMyProfile(token)
      
      // Store user data as a JSON object
      localStorage.setItem("currentUser", JSON.stringify({
        id: userProfile.id,
        username: userProfile.username
      }))

      toast.success("Login successful! Redirecting to Dashboard...")

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      // Type assertion for the error object
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || "Error: Invalid username or password."
      toast.error(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login Form</h1>
        </div>

        <div className="flex w-full max-w-xs mx-auto mt-4">
          <Link
            href="/signup"
            className="flex-1 py-2 text-center rounded-l-xl transition-colors bg-gray-50 text-gray-600 hover:bg-gray-100 text-base"
          >
            Signup
          </Link>
          <Link
            href="/login"
            className="flex-1 py-2 text-center rounded-r-xl transition-colors bg-[#5DA9E9] text-white pointer-events-none text-base"
            tabIndex={-1}
            aria-disabled="true"
          >
            Login
          </Link>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="flex flex-col">
            {/* Add spacing above the inputs */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input id="username" placeholder="Username" className="rounded-xl border px-4 py-3" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className="rounded-xl border px-4 py-3 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>
                    </div>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                )}
              />
            </div>

            {/* Add spacing below the inputs */}
            <div className="mt-6">
              <Button 
                type="submit" 
                className="w-full rounded-xl bg-[#5DA9E9] hover:bg-[#4A98D8] px-4 py-3 h-auto font-medium" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}