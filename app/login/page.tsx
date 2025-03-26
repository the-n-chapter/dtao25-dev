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
import { login, getUsers } from "@/lib/api"

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

      // Get user data from API
      const users = await getUsers()
      const user = users.find(u => u.username === values.username)
      if (!user) {
        throw new Error("User not found")
      }

      // Store user data as a JSON object
      localStorage.setItem("currentUser", JSON.stringify({
        id: user.id,
        username: values.username
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

        <div className="flex w-full overflow-hidden rounded-xl border">
          <Link href="/signup" className="w-1/2 py-2 text-center text-gray-600 hover:bg-gray-100">
            Signup
          </Link>
          <div className="w-1/2 bg-[#5DA9E9] py-2 text-center text-white">Login</div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
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
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FormMessage className="text-xs text-destructive" />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full rounded-xl bg-[#5DA9E9] hover:bg-[#4A98D8] px-4 py-3 h-auto font-medium" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

