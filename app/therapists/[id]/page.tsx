"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MessageCircle, Star, Clock, Award, Briefcase, Languages } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TherapistData {
  id: string
  name: string
  profileImage?: string
  specialization?: string
  yearsExperience?: number
  licenseNumber?: string
  languages?: string
  bio?: string
  approaches?: string
  treatmentFocus?: string
  education?: string
  certifications?: string
  createdAt: Date
  updatedAt: Date
  clientCount?: number
  averageRating?: number
  ratingCount?: number
}

export default function TherapistProfilePage() {
  const { id } = useParams() as { id: string }
  const { user } = useAuth()
  const router = useRouter()
  const [therapist, setTherapist] = useState<TherapistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(true)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTherapist()
      checkQuizStatus()
    }
  }, [user, id])

  const checkQuizStatus = async () => {
    if (!user || user.role !== "client") return

    try {
      const quizQuery = query(collection(db, "quizzes"), where("clientId", "==", user.id))
      const snapshot = await getDocs(quizQuery)
      setHasCompletedQuiz(!snapshot.empty)
    } catch (error) {
      console.error("Error checking quiz status:", error)
    }
  }

  const fetchTherapist = async () => {
    try {
      const therapistDoc = await getDoc(doc(db, "users", id as string))

      if (!therapistDoc.exists()) {
        setError("Therapist not found")
        setLoading(false)
        return
      }

      const therapistData: TherapistData = {
        id: therapistDoc.id,
        ...therapistDoc.data(),
        createdAt: therapistDoc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: therapistDoc.data().updatedAt?.toDate?.() || new Date(),
      } as TherapistData

      // Fetch additional stats
      try {
        // Get client count
        const clientsQuery = query(collection(db, "chatSessions"), where("therapistId", "==", id))
        const clientsSnapshot = await getDocs(clientsQuery)
        const uniqueClients = new Set()
        clientsSnapshot.docs.forEach((doc) => {
          uniqueClients.add(doc.data().clientId)
        })

        // Get average rating
        const ratingsQuery = query(collection(db, "progress"), where("therapistId", "==", id))
        const ratingsSnapshot = await getDocs(ratingsQuery)
        const ratings = ratingsSnapshot.docs.map((doc) => doc.data().rating).filter((r) => typeof r === "number")

        // Add stats to therapist data
        therapistData.clientCount = uniqueClients.size
        therapistData.averageRating =
          ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
        therapistData.ratingCount = ratings.length
      } catch (error) {
        console.log("Could not fetch additional stats", error)
        therapistData.clientCount = 0
        therapistData.averageRating = 0
        therapistData.ratingCount = 0
      }

      setTherapist(therapistData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching therapist:", error)
      setError("Failed to load therapist profile")
      setLoading(false)
    }
  }

  const handleStartChat = async () => {
    if (!user || !therapist) return

    if (!hasCompletedQuiz) {
      router.push("/dashboard")
      return
    }

    setPaymentProcessing(true)

    try {
      // Create a payment record
      const paymentRef = await addDoc(collection(db, "payments"), {
        clientId: user.id,
        therapistId: therapist.id,
        amount: 260, // R260
        currency: "ZAR",
        status: "completed",
        sessionDuration: 7, // 7 days
        createdAt: serverTimestamp(),
      })

      // Calculate expiry date (7 days from now)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7)

      // Create chat session
      const chatSessionRef = await addDoc(collection(db, "chatSessions"), {
        clientId: user.id,
        clientName: user.name,
        therapistId: therapist.id,
        therapistName: therapist.name,
        status: "active",
        createdAt: serverTimestamp(),
        expiresAt: expiryDate,
        lastMessage: "Payment successful - session started",
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        paymentId: paymentRef.id,
      })

      // Navigate to chat
      router.push("/chat")
    } catch (error) {
      console.error("Error starting chat:", error)
      setError("Failed to process payment")
    } finally {
      setPaymentProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading therapist profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !therapist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Failed to load therapist profile"}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => router.push("/therapists")}>Back to Therapists</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={therapist.profileImage || "/placeholder.svg"} alt={therapist.name} />
                <AvatarFallback className="text-2xl">{therapist.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{therapist.name}</CardTitle>
              <CardDescription className="flex items-center justify-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{therapist.averageRating?.toFixed(1) || "New"}</span>
                <span className="text-muted-foreground">({therapist.ratingCount || 0} ratings)</span>
              </CardDescription>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {therapist.specialization?.split(",").map((spec: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {spec.trim()}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{therapist.yearsExperience || 0} years experience</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>License: {therapist.licenseNumber || "Not provided"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Member since {therapist.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span>Languages: {therapist.languages || "English"}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              {user?.role === "client" && (
                <>
                  <Button
                    className="w-full"
                    onClick={handleStartChat}
                    disabled={paymentProcessing || !hasCompletedQuiz}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {paymentProcessing ? "Processing..." : "Start Chat (R260 for 7 days)"}
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>

                  {!hasCompletedQuiz && (
                    <Alert className="mt-4">
                      <AlertTitle>Assessment Required</AlertTitle>
                      <AlertDescription>
                        You need to complete the initial assessment before starting a chat.
                        <Button
                          variant="link"
                          className="p-0 h-auto font-normal"
                          onClick={() => router.push("/dashboard")}
                        >
                          Take Assessment
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About {therapist.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bio">
                <TabsList className="mb-4">
                  <TabsTrigger value="bio">Bio</TabsTrigger>
                  <TabsTrigger value="approach">Approach</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                </TabsList>

                <TabsContent value="bio" className="space-y-4">
                  <p>{therapist.bio || "No bio provided."}</p>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {(therapist.specialization?.split(",") || ["General Therapy"]).map((spec: string, i: number) => (
                        <Badge key={i} variant="secondary">
                          {spec.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="approach">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Therapeutic Approaches</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {(
                        therapist.approaches?.split(",") || [
                          "Cognitive Behavioral Therapy (CBT)",
                          "Person-Centered Therapy",
                          "Solution-Focused Brief Therapy",
                        ]
                      ).map((approach: string, i: number) => (
                        <li key={i}>{approach.trim()}</li>
                      ))}
                    </ul>

                    <h3 className="font-semibold mt-6">Treatment Focus</h3>
                    <p>{therapist.treatmentFocus || "General mental health and wellbeing."}</p>
                  </div>
                </TabsContent>

                <TabsContent value="education">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Education</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {(
                        therapist.education?.split(",") || [
                          "Master's in Clinical Psychology",
                          "Licensed Professional Counselor",
                        ]
                      ).map((edu: string, i: number) => (
                        <li key={i}>{edu.trim()}</li>
                      ))}
                    </ul>

                    <h3 className="font-semibold mt-6">Certifications</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {(
                        therapist.certifications?.split(",") || [
                          "Certified in Trauma-Focused Therapy",
                          "Mindfulness-Based Stress Reduction",
                        ]
                      ).map((cert: string, i: number) => (
                        <li key={i}>{cert.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Client Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Practice Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{therapist.clientCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Clients Helped</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{therapist.averageRating?.toFixed(1) || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-600">{therapist.yearsExperience || 0}</p>
                  <p className="text-sm text-muted-foreground">Years Experience</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}