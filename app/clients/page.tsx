"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import type { User, ChatSession } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Calendar, Star, Users } from "lucide-react"
import Link from "next/link"

interface ClientData extends User {
  totalSessions: number
  unreadMessages: number
  averageRating: number
  lastMessageTime?: Date
}

// Helper function to safely convert Firestore timestamps to Date objects
const convertToDate = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined
  if (timestamp instanceof Date) return timestamp
  if (typeof timestamp.toDate === 'function') return timestamp.toDate()
  return undefined
}

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === "therapist") {
      fetchClients()
    }
  }, [user])

  const fetchClients = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get all chat sessions where this therapist is involved
      const sessionsQuery = query(collection(db, "chatSessions"), where("therapistId", "==", user.id))
      const sessionsSnapshot = await getDocs(sessionsQuery)
      const sessions = sessionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatSession[]

      // Get unique client IDs
      const clientIds = [...new Set(sessions.map((session) => session.clientId))]

      // Fetch client data
      const clientsData: ClientData[] = []

      for (const clientId of clientIds) {
        try {
          // Get client user data
          const usersQuery = query(collection(db, "users"), where("id", "==", clientId))
          const userSnapshot = await getDocs(usersQuery)

          if (userSnapshot.empty) continue

          const clientUser = userSnapshot.docs[0].data() as User

          // Count total sessions for this client
          const clientSessions = sessions.filter((s) => s.clientId === clientId)

          // Count unread messages from this client
          let unreadMessages = 0
          try {
            const messagesQuery = query(
              collection(db, "messages"),
              where("senderId", "==", clientId),
              where("read", "==", false),
            )
            const messagesSnapshot = await getDocs(messagesQuery)
            unreadMessages = messagesSnapshot.size
          } catch (error) {
            console.error("Error fetching unread messages:", error)
            unreadMessages = 0
          }

          // Get average rating for this client
          let averageRating = 0
          try {
            const ratingsQuery = query(collection(db, "ratings"), where("ratedId", "==", clientId))
            const ratingsSnapshot = await getDocs(ratingsQuery)
            if (!ratingsSnapshot.empty) {
              const ratings = ratingsSnapshot.docs.map((doc) => doc.data().rating)
              averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            }
          } catch (error) {
            console.error("Error fetching ratings:", error)
            averageRating = 0
          }

          // Get last message time
          const lastSession = clientSessions.sort(
            (a, b) =>
              (convertToDate(b.lastMessageTime)?.getTime() || 0) -
              (convertToDate(a.lastMessageTime)?.getTime() || 0)
          )[0]

          clientsData.push({
            ...clientUser,
            totalSessions: clientSessions.length,
            unreadMessages,
            averageRating,
            lastMessageTime: convertToDate(lastSession?.lastMessageTime),
          })
        } catch (error) {
          console.error(`Error fetching data for client ${clientId}:`, error)
        }
      }

      // Sort by last message time (most recent first)
      clientsData.sort((a, b) => {
        const timeA = a.lastMessageTime?.getTime() || 0
        const timeB = b.lastMessageTime?.getTime() || 0
        return timeB - timeA
      })

      setClients(clientsData)
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== "therapist") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Access denied. This page is only available to therapists.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Clients</h1>
        <p className="text-muted-foreground">Manage your client relationships and communications</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{clients.reduce((sum, client) => sum + client.totalSessions, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Unread Messages</p>
                <p className="text-2xl font-bold">{clients.reduce((sum, client) => sum + client.unreadMessages, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {clients.length > 0
                    ? (clients.reduce((sum, client) => sum + client.averageRating, 0) / clients.length).toFixed(1)
                    : "0.0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {clients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
              <p className="text-muted-foreground">Clients will appear here once they start messaging you.</p>
            </CardContent>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg">{client.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        {client.unreadMessages > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {client.unreadMessages} unread
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{client.email}</p>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {client.totalSessions} session{client.totalSessions !== 1 ? "s" : ""}
                        </span>

                        {client.averageRating > 0 && (
                          <span className="flex items-center">
                            <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                            {client.averageRating.toFixed(1)}
                          </span>
                        )}

                        {client.lastMessageTime && (
                          <span>Last active: {client.lastMessageTime.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/chat">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Link>
                    </Button>

                    <Button asChild variant="outline" size="sm">
                      <Link href="/appointments">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}