"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Calendar, BookOpen, Users, Shield, Clock } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-blue-600">Therapeutic MindCare</div>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => router.push("/auth/login")}>
                Login
              </Button>
              <Button onClick={() => router.push("/auth/register")}>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">Connect with Professional Therapists</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get personalized mental health support through secure messaging, video sessions, and access to therapeutic
            resources. Start your journey to better mental health today.
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={() => router.push("/auth/register")}>
              Start Your Journey
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Secure Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Communicate with licensed therapists through encrypted messaging. Pay R260 for 7 days of unlimited
                  messaging support.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Easy Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Book video sessions with your therapist using our integrated calendar. Get confirmation and reminders
                  for all appointments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Resource Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access thousands of books, articles, and journals. Save resources and download them for offline
                  reading.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Personalized Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Take our initial assessment to get matched with therapists who specialize in your specific needs and
                  concerns.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Your conversations and data are protected with end-to-end encryption and HIPAA-compliant security
                  measures.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Monitor your mental health journey with progress tracking, mood assessments, and personalized
                  insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Mental Health Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of people who have found support and healing through our platform.
          </p>
          <Button size="lg" variant="secondary" onClick={() => router.push("/auth/register")}>
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Therapeutic MindCare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
