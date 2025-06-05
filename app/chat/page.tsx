"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { ChatInterface } from "@/components/chat/chat-interface"
import type { ChatSession } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Clock } from "lucide-react"

export default function ChatPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Build the appropriate query based on user role
  const sessionsQuery = useMemo(() => {
    if (!user) return null
    
    // For therapists, we want to see all their sessions
    if (user.role === "therapist") {
      return query(
        collection(db, "chatSessions"),
        where("therapistId", "==", user.id),
        orderBy("lastMessageTime", "desc")
      )
    }
    
    // For clients, we only show their own sessions
    return query(
      collection(db, "chatSessions"),
      where("clientId", "==", user.id),
      orderBy("lastMessageTime", "desc")
    )
  }, [user])

  useEffect(() => {
    if (!user || !sessionsQuery) return

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        try {
          const allSessions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            lastMessageTime: doc.data().lastMessageTime?.toDate(),
          })) as ChatSession[]

          // For therapists, show all sessions without deduplication
          if (user.role === "therapist") {
            setSessions(allSessions)
          } else {
            // For clients, deduplicate to show only most recent per therapist
            const uniqueSessions = new Map<string, ChatSession>()
            allSessions.forEach((session) => {
              const therapistId = session.therapistId
              if (!uniqueSessions.has(therapistId)) {
                uniqueSessions.set(therapistId, session)
              } else {
                const existing = uniqueSessions.get(therapistId)!
                if ((session.lastMessageTime?.getTime() || 0) > (existing.lastMessageTime?.getTime() || 0)) {
                  uniqueSessions.set(therapistId, session)
                }
              }
            })
            setSessions(Array.from(uniqueSessions.values()))
          }

          // Auto-select first session if none selected or if selected session is no longer in the list
          if (!selectedSession || !allSessions.some(s => s.id === selectedSession.id)) {
            setSelectedSession(allSessions[0] || null)
          }

          setLoading(false)
          setError(null)
        } catch (err) {
          console.error("Error processing sessions:", err)
          setError("Failed to load conversations")
          setLoading(false)
        }
      },
      (error) => {
        console.error("Error fetching sessions:", error)
        setError("Failed to load conversations. Please try again.")
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, sessionsQuery, selectedSession])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to access chat.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading conversations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const getOtherParticipant = (session: ChatSession) => {
    return user.role === "client"
      ? { name: session.therapistName, id: session.therapistId }
      : { name: session.clientName, id: session.clientId }
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            {user.role === "therapist" ? "All Sessions" : "Conversations"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {sessions.length} {user.role === "therapist" ? "sessions" : "conversations"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {user.role === "therapist" ? "sessions" : "conversations"} yet</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {sessions.map((session) => {
                const otherParticipant = getOtherParticipant(session)
                const isActive = selectedSession?.id === session.id

                return (
                  <Card
                    key={session.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-100 ${
                      isActive ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {otherParticipant.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{otherParticipant.name}</h3>
                            <Badge variant={session.status === "active" ? "default" : "secondary"}>
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {session.lastMessage || "No messages yet"}
                          </p>
                          {session.lastMessageTime && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {session.lastMessageTime.toLocaleDateString()} at{" "}
                              {session.lastMessageTime.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <ChatInterface sessionId={selectedSession.id} session={selectedSession} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {sessions.length > 0 ? "Select a conversation" : "No conversations"}
              </h3>
              <p>
                {sessions.length > 0
                  ? "Choose a conversation from the sidebar to start chatting"
                  : user.role === "therapist"
                    ? "When clients message you, sessions will appear here"
                    : "Start a new conversation with your therapist"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}