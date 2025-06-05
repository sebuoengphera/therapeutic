"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Progress } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ProgressTrackerProps {
  clientId: string
}

export function ProgressTracker({ clientId }: ProgressTrackerProps) {
  const [progressData, setProgressData] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgressData()
  }, [clientId])

  const fetchProgressData = async () => {
    try {
      // First try the optimized query with orderBy
      try {
        const progressQuery = query(
          collection(db, "progress"),
          where("clientId", "==", clientId),
          orderBy("date", "asc"),
        )
        const snapshot = await getDocs(progressQuery)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
        })) as Progress[]

        setProgressData(data)
      } catch (indexError: any) {
        // If index doesn't exist, fall back to simple query without orderBy
        console.log("Index not available, using fallback query")

        const progressQuery = query(collection(db, "progress"), where("clientId", "==", clientId))
        const snapshot = await getDocs(progressQuery)
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
        })) as Progress[]

        // Sort the data manually on the client side
        data.sort((a, b) => a.date.getTime() - b.date.getTime())
        setProgressData(data)
      }
    } catch (error) {
      console.error("Error fetching progress data:", error)
      // Set empty array if there's any error
      setProgressData([])
    } finally {
      setLoading(false)
    }
  }

  const chartData = progressData.map((progress, index) => ({
    session: index + 1,
    rating: progress.rating,
    date: progress.date.toLocaleDateString(),
  }))

  const averageRating =
    progressData.length > 0 ? progressData.reduce((sum, p) => sum + p.rating, 0) / progressData.length : 0

  const latestRating = progressData.length > 0 ? progressData[progressData.length - 1].rating : 0

  const trend = progressData.length >= 2 ? latestRating - progressData[progressData.length - 2].rating : 0

  if (loading) {
    return <div>Loading progress data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}/10</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestRating}/10</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600"}`}
            >
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis domain={[0, 10]} />
                <Tooltip
                  labelFormatter={(value) => `Session ${value}`}
                  formatter={(value: any, name) => [value, "Rating"]}
                />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No progress data available yet</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressData.map((progress, index) => (
              <div key={progress.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Session {index + 1}</p>
                    <p className="text-sm text-muted-foreground">{progress.date.toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Rating: {progress.rating}/10</p>
                  </div>
                </div>
                <p className="mt-2 text-sm">{progress.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
