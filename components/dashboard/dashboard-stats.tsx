"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Calendar, Users, TrendingUp } from "lucide-react"

interface DashboardStatsProps {
  onStatsLoad?: (stats: any) => void
}

export function DashboardStats({ onStatsLoad }: DashboardStatsProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    activeSessions: 0,
    upcomingAppointments: 0,
    totalClients: 0,
    averageRating: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    if (!user) return

    try {
      const newStats = {
        activeSessions: 0,
        upcomingAppointments: 0,
        totalClients: 0,
        averageRating: 0,
      }

      // Fetch active sessions with error handling
      try {
        const sessionsQuery = query(
          collection(db, "chatSessions"),
          user.role === "client" ? where("clientId", "==", user.id) : where("therapistId", "==", user.id),
        )
        const sessionsSnapshot = await getDocs(sessionsQuery)

        // Filter active sessions manually to avoid compound index issues
        const activeSessions = sessionsSnapshot.docs.filter((doc) => doc.data().status === "active")
        newStats.activeSessions = activeSessions.length

        if (user.role === "therapist") {
          // Count unique clients for therapists
          const uniqueClients = new Set(activeSessions.map((doc) => doc.data().clientId))
          newStats.totalClients = uniqueClients.size
        }
      } catch (error) {
        console.log("Could not fetch sessions data:", error)
      }

      // Fetch appointments with error handling
      try {
        const appointmentsQuery = query(
          collection(db, "appointments"),
          user.role === "client" ? where("clientId", "==", user.id) : where("therapistId", "==", user.id),
        )
        const appointmentsSnapshot = await getDocs(appointmentsQuery)

        // Filter confirmed appointments manually
        const confirmedAppointments = appointmentsSnapshot.docs.filter((doc) => doc.data().status === "confirmed")
        newStats.upcomingAppointments = confirmedAppointments.length
      } catch (error) {
        console.log("Could not fetch appointments data:", error)
      }

      // Fetch progress data for therapists
      if (user.role === "therapist") {
        try {
          const progressQuery = query(collection(db, "progress"), where("therapistId", "==", user.id))
          const progressSnapshot = await getDocs(progressQuery)

          const ratings = progressSnapshot.docs
            .map((doc) => doc.data().rating)
            .filter((rating) => typeof rating === "number" && rating > 0)

          newStats.averageRating =
            ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
        } catch (error) {
          console.log("Could not fetch progress data:", error)
        }
      }

      setStats(newStats)
      onStatsLoad?.(newStats)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSessions}</div>
          <p className="text-xs text-muted-foreground">
            {user?.role === "client" ? "Your active chats" : "Active client sessions"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
          <p className="text-xs text-muted-foreground">Confirmed appointments</p>
        </CardContent>
      </Card>

      {user?.role === "therapist" && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">Clients communicating with you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground">Client feedback</p>
            </CardContent>
          </Card>
        </>
      )}

      {user?.role === "client" && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress Sessions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Completed sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Therapist</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Find a therapist</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
