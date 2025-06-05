"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "client" as "client" | "therapist",
    specialization: "",
    bio: "",
    licenseNumber: "",
    yearsExperience: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Please enter your full name.")
      return false
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return false
    }

    if (formData.role === "therapist") {
      if (!formData.specialization.trim()) {
        setError("Please enter your specialization.")
        return false
      }
      if (!formData.licenseNumber.trim()) {
        setError("Please enter your license number.")
        return false
      }
    }

    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      // Send email verification
      await sendEmailVerification(user)

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        role: formData.role,
        specialization: formData.role === "therapist" ? formData.specialization.trim() : "",
        bio: formData.role === "therapist" ? formData.bio.trim() : "",
        licenseNumber: formData.role === "therapist" ? formData.licenseNumber.trim() : "",
        yearsExperience: formData.role === "therapist" ? Number(formData.yearsExperience) || 0 : 0,
        rating: formData.role === "therapist" ? 0 : undefined,
        isVerified: false,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setSuccess("Account created successfully! Please check your email to verify your account before signing in.")

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: any) {
      console.error("Registration error:", error)

      switch (error.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists. Please sign in instead.")
          break
        case "auth/invalid-email":
          setError("Please enter a valid email address.")
          break
        case "auth/weak-password":
          setError("Password is too weak. Please choose a stronger password.")
          break
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection and try again.")
          break
        default:
          setError("Failed to create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError("")
    if (success) setSuccess("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Create Your Account</CardTitle>
          <p className="text-gray-600">Join Therapeutic MindCare today</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      placeholder="Enter your full name"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      placeholder="Enter your email"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Account Type</h3>
              <RadioGroup
                value={formData.role}
                onValueChange={(value: "client" | "therapist") => handleInputChange("role", value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="client" id="client" />
                  <div className="flex-1">
                    <Label htmlFor="client" className="cursor-pointer font-medium">
                      I'm seeking therapy
                    </Label>
                    <p className="text-sm text-gray-500">Looking for mental health support</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="therapist" id="therapist" />
                  <div className="flex-1">
                    <Label htmlFor="therapist" className="cursor-pointer font-medium">
                      I'm a licensed therapist
                    </Label>
                    <p className="text-sm text-gray-500">Providing mental health services</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Therapist Information */}
            {formData.role === "therapist" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="text-sm font-medium text-gray-700">
                        Specialization *
                      </Label>
                      <Input
                        id="specialization"
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => handleInputChange("specialization", e.target.value)}
                        placeholder="e.g., Anxiety, Depression, Couples Therapy"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700">
                        License Number *
                      </Label>
                      <Input
                        id="licenseNumber"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                        placeholder="Enter your license number"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience" className="text-sm font-medium text-gray-700">
                      Years of Experience
                    </Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      value={formData.yearsExperience}
                      onChange={(e) => handleInputChange("yearsExperience", e.target.value)}
                      placeholder="Enter years of experience"
                      disabled={loading}
                      min="0"
                      max="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                      Professional Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell clients about your experience, approach, and specialties..."
                      rows={4}
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <Separator />

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
