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
import { createUser } from "@/lib/api"

// Define the validation schema with Zod
const signupSchema = z
  .object({
    username: z.string().min(5, "Username must be at least 5 characters"),
    password: z.string().min(4, "Password must be at least 4 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with React Hook Form and Zod resolver
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  })

  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true)

    try {
      // Call the createUser API
      const user = await createUser({
        username: values.username,
        password: values.password,
      })

      // Store user data in local storage
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      users.push({
        id: user.id,
        username: values.username,
        password: values.password
      })
      localStorage.setItem("users", JSON.stringify(users))
      
      toast.success("Signup successful! Redirecting to Login...")

      // Redirect to login after a delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      const message = err.response?.data?.message || "Error: Username already in use."
      toast.error(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Signup Form</h1>
        </div>

        <div className="flex w-full overflow-hidden rounded-xl border">
          <div className="w-1/2 bg-[#5DA9E9] py-2 text-center text-white">Signup</div>
          <Link href="/login" className="w-1/2 py-2 text-center text-gray-600 hover:bg-gray-100">
            Login
          </Link>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignup)} className="flex flex-col">
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          className="rounded-xl border px-4 py-3 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

