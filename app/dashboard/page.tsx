"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DynamicQuiz } from "@/components/quiz/dynamic-quiz"
import { ProgressTracker } from "@/components/progress/progress-tracker"
import { MessageCircle, Calendar, BookOpen, Users, TrendingUp, AlertCircle, Brain, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, loading, error: authError } = useAuth()
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizData, setQuizData] = useState<any>(null)
  const [stats, setStats] = useState({
    activeSessions: 0,
    upcomingAppointments: 0,
    totalClients: 0,
    averageRating: 0,
  })
  const [recentBooks, setRecentBooks] = useState<any[]>([])
  const [savedBooks, setSavedBooks] = useState<string[]>([])
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      checkQuizStatus()
      fetchDashboardStats()
      loadRecentBooks()
      fetchSavedBooks()
      fetchActiveSessions()
    }
  }, [user])

  const checkQuizStatus = async () => {
    if (!user) return

    try {
      const quizQuery = query(collection(db, "quizzes"), where("clientId", "==", user.id))
      const snapshot = await getDocs(quizQuery)

      if (snapshot.empty && user.role === "client") {
        setShowQuiz(true)
      } else {
        if (!snapshot.empty) {
          const quizDoc = snapshot.docs[0]
          setQuizData({
            id: quizDoc.id,
            ...quizDoc.data(),
            completedAt: quizDoc.data().completedAt?.toDate(),
          })
        }
        setShowQuiz(false)
      }
    } catch (error) {
      console.error("Error checking quiz status:", error)
      if (user.role === "client") {
        setShowQuiz(true)
      }
    }
  }

  const fetchDashboardStats = async () => {
    if (!user) return

    try {
      const statsData = {
        activeSessions: 0,
        upcomingAppointments: 0,
        totalClients: 0,
        averageRating: 0,
      }

      // Fetch real active sessions
      try {
        const sessionsQuery = query(
          collection(db, "chatSessions"),
          user.role === "client" ? where("clientId", "==", user.id) : where("therapistId", "==", user.id),
          where("status", "==", "active"),
        )
        const sessionsSnapshot = await getDocs(sessionsQuery)
        statsData.activeSessions = sessionsSnapshot.size

        if (user.role === "therapist") {
          statsData.totalClients = new Set(sessionsSnapshot.docs.map((doc) => doc.data().clientId)).size
        }
      } catch (error) {
        console.log("Sessions data not available yet")
      }

      setStats(statsData)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const fetchActiveSessions = async () => {
    if (!user) return

    try {
      const sessionsQuery = query(
        collection(db, "chatSessions"),
        user.role === "client" ? where("clientId", "==", user.id) : where("therapistId", "==", user.id),
        where("status", "==", "active"),
      )
      const sessionsSnapshot = await getDocs(sessionsQuery)

      const sessionsWithMessages = []
      for (const doc of sessionsSnapshot.docs) {
        const sessionData = doc.data()

        // Check if this session has real messages
        const messagesQuery = query(collection(db, "messages"), where("sessionId", "==", doc.id))
        const messagesSnapshot = await getDocs(messagesQuery)

        const userMessages = messagesSnapshot.docs.filter((msgDoc) => {
          const msgData = msgDoc.data()
          return msgData.content !== "Payment successful - session started"
        })

        if (userMessages.length > 0) {
          const session = {
            id: doc.id,
            ...sessionData,
            createdAt: sessionData.createdAt?.toDate() || new Date(),
            lastMessageTime: sessionData.lastMessageTime?.toDate() || new Date(),
          }
          sessionsWithMessages.push(session)
        }
      }

      setActiveSessions(sessionsWithMessages)
    } catch (error) {
      console.error("Error fetching active sessions:", error)
    }
  }

  const loadRecentBooks = () => {
    const staticBooks = getSampleBooks()
    setRecentBooks(staticBooks)
  }

  const fetchSavedBooks = async () => {
    if (!user) return

    try {
      const savedBooksQuery = query(collection(db, "savedBooks"), where("userId", "==", user.id))
      const snapshot = await getDocs(savedBooksQuery)
      const savedBookIds = snapshot.docs.map((doc) => doc.data().bookId)
      setSavedBooks(savedBookIds)
    } catch (error) {
      console.error("Error fetching saved books:", error)
      setSavedBooks([])
    }
  }

  const getSampleBooks = () => [
    {
      id: "book-1",
      title: "The Anxiety and Worry Workbook",
      author: "David A. Clark",
      description:
        "A comprehensive guide to understanding and managing anxiety through cognitive behavioral techniques.",
      category: "anxiety",
      url: "https://www.google.co.ls/books/edition/Anxiety_and_Worry_Workbook/whSwEAAAQBAJ?hl=en&gbpv=1",
      coverImage: "/books/the enxiety and worry workbook.jpeg",
      downloadUrl: "chrome-extension://kdpelmjpfafjppnhbloffcjpeomlnpah/https://todaytelemedicine.com/wp-content/uploads/2023/12/THEANX1.pdf",
    },
    {
      id: "book-2",
      title: "Feeling Good: The New Mood Therapy",
      author: "David D. Burns",
      description: "The classic guide to overcoming depression using cognitive behavioral therapy techniques.",
      category: "depression",
      url: "https://www.goodreads.com/book/show/46674.Feeling_Good",
      coverImage: "/books/feeling good.jpg",
      downloadUrl: "https://example.com/download/feeling-good.pdf",
    },
    {
      id: "book-3",
      title: "The Seven Principles for Making Marriage Work",
      author: "John Gottman",
      description: "Research-based strategies for building stronger, more loving relationships.",
      category: "relationships",
      url: "https://relationshipinstitute.com.au/uploads/resources/the_seven_principles_for_making_marriage_work_summary.pdf",
      coverImage: "/books/the seven principles.jpg",
      downloadUrl: "https://example.com/download/marriage-work.pdf",
    },
    {
      id: "book-4",
      title: "Trauma and Recovery",
      author: "Judith Herman",
      description: "A groundbreaking work on understanding and healing from psychological trauma.",
      category: "trauma",
      url: "https://beyondthetemple.com/wp-content/uploads/2018/04/herman_trauma-and-recovery-1.pdf",
      coverImage: "/books/trauma and recovery.jpg",
      downloadUrl: "https://example.com/download/trauma-recovery.pdf",
    },
    {
      id: "book-5",
      title: "The Self-Compassion Workbook",
      author: "Kristin Neff",
      description: "Learn to treat yourself with kindness and develop emotional resilience.",
      category: "self-help",
      url: "https://self-compassion.org/books-by-kristin-neff/",
      coverImage: "/books/mindful for beginners.jpg",
      downloadUrl: "https://example.com/download/self-compassion.pdf",
    },
    {
      id: "book-6",
      title: "Mindfulness for Beginners",
      author: "Jon Kabat-Zinn",
      description: "An introduction to mindfulness meditation and its benefits for mental health.",
      category: "mindfulness",
      url: "https://thekeep.eiu.edu/cgi/viewcontent.cgi?article=1544&context=jcba",
      coverImage: "/books/mindful1.jpg",
      downloadUrl: "https://example.com/download/mindfulness-beginners.pdf",
    },
  ]

  const saveBook = async (book: any) => {
    if (!user) return

    try {
      setSavedBooks((prev) => [...prev, book.id])
    } catch (error) {
      console.error("Error saving book:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (authError || error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {authError || error || "There was an error loading your dashboard. Please try again."}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Logged In</AlertTitle>
          <AlertDescription>Please log in to access your dashboard.</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => router.push("/auth/login")}>Log In</Button>
        </div>
      </div>
    )
  }

  // Show quiz for clients who haven't completed it
  if (showQuiz && user.role === "client") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to TherapyConnect!</h1>
          <p className="text-muted-foreground">
            Please complete this brief assessment to personalize your therapy experience.
          </p>
        </div>
        <DynamicQuiz
          onComplete={() => {
            setShowQuiz(false)
            checkQuizStatus()
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">
          {user.role === "client" ? "Here's your mental health journey overview." : "Here's your practice overview."}
        </p>
      </div>

      {/* Quiz Results Summary for Clients */}
      {user.role === "client" && quizData && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <span>Your Assessment Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Primary Concerns:</h4>
                <div className="flex flex-wrap gap-2">
                  {quizData.recommendations?.primaryConcerns?.map((concern: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {concern}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Recommended Specializations:</h4>
                <div className="flex flex-wrap gap-2">
                  {quizData.recommendations?.therapistSpecializations
                    ?.slice(0, 3)
                    .map((spec: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/chat")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Click to view chats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
          </CardContent>
        </Card>

        {user.role === "therapist" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/10</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Active Sessions List */}
      {activeSessions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.slice(0, 3).map((session) => {
                const otherParticipant =
                  user.role === "client"
                    ? { name: session.therapistName, id: session.therapistId }
                    : { name: session.clientName, id: session.clientId }

                return (
                  <div
                    key={session.id}
                    onClick={() => router.push("/chat")}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <Avatar>
                      <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{otherParticipant.name}</p>
                      <p className="text-sm text-muted-foreground">{session.lastMessage}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{session.lastMessageTime.toLocaleDateString()}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/chat">
              <Button className="w-full justify-start">
                <MessageCircle className="mr-2 h-4 w-4" />
                {user.role === "client" ? "Message Therapist" : "View Messages"}
              </Button>
            </Link>

            <Link href="/appointments">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {user.role === "client" ? "Book Appointment" : "Manage Schedule"}
              </Button>
            </Link>

            <Link href="/library">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Full Library
              </Button>
            </Link>

            {user.role === "client" && (
              <Link href="/therapists">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Find Therapist
                </Button>
              </Link>
            )}

            {user.role === "therapist" && (
              <Link href="/clients">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View Clients
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recommended Books */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recommended Books</span>
              <Link href="/library">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBooks.slice(0, 3).map((book) => (
                <div key={book.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <img
                    src={book.coverImage || "/placeholder.svg"}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=64&width=48"
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{book.title}</h4>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{book.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(book.url, "_blank")}
                        className="text-xs h-6"
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        Read
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveBook(book)}
                        disabled={savedBooks.includes(book.id)}
                        className="text-xs h-6"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Tracker for Clients */}
      {user.role === "client" && (
        <div className="mt-8">
          <ProgressTracker clientId={user.id} />
        </div>
      )}
    </div>
  )
}
