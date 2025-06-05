"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Appointment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle } from "lucide-react"

interface AppointmentCalendarProps {
  therapistId?: string
}

export function AppointmentCalendar({ therapistId }: AppointmentCalendarProps) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [bookedDates, setBookedDates] = useState<Date[]>([])
  const [selectedTime, setSelectedTime] = useState("")
  const [loading, setLoading] = useState(false)

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

  useEffect(() => {
    fetchAppointments()
  }, [user, therapistId])

  const fetchAppointments = async () => {
    if (!user) return

    try {
      let appointmentsQuery

      if (user.role === "client") {
        appointmentsQuery = query(collection(db, "appointments"), where("clientId", "==", user.id))
        if (therapistId) {
          appointmentsQuery = query(
            collection(db, "appointments"),
            where("clientId", "==", user.id),
            where("therapistId", "==", therapistId),
          )
        }
      } else {
        appointmentsQuery = query(collection(db, "appointments"), where("therapistId", "==", user.id))
      }

      const snapshot = await getDocs(appointmentsQuery)
      const appointmentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Appointment[]

      setAppointments(appointmentsData)

      // Extract booked dates
      const booked = appointmentsData.filter((apt) => apt.status === "confirmed").map((apt) => apt.date)
      setBookedDates(booked)
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }

  const bookAppointment = async () => {
    if (!user || !selectedDate || !selectedTime || !therapistId) return

    setLoading(true)
    try {
      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(Number.parseInt(selectedTime.split(":")[0]))
      appointmentDate.setMinutes(Number.parseInt(selectedTime.split(":")[1]))

      await addDoc(collection(db, "appointments"), {
        clientId: user.id,
        therapistId,
        date: appointmentDate,
        time: selectedTime,
        status: "pending",
        createdAt: new Date(),
      })

      setSelectedTime("")
      fetchAppointments()
    } catch (error) {
      console.error("Error booking appointment:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: "confirmed" | "cancelled") => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        status,
        updatedAt: new Date(),
      })
      fetchAppointments()
    } catch (error) {
      console.error("Error updating appointment:", error)
    }
  }

  const isDateBooked = (date: Date) => {
    return bookedDates.some((bookedDate) => bookedDate.toDateString() === date.toDateString())
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => apt.date.toDateString() === date.toDateString())
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || isDateBooked(date)}
            className="rounded-md border"
          />

          {selectedDate && !isDateBooked(selectedDate) && user?.role === "client" && therapistId && (
            <div className="mt-4 space-y-4">
              <h4 className="font-medium">Available Times</h4>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>

              {selectedTime && (
                <Button onClick={bookAppointment} disabled={loading} className="w-full">
                  Book Appointment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedDate ? `Appointments for ${selectedDate.toDateString()}` : "All Appointments"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(selectedDate ? getAppointmentsForDate(selectedDate) : appointments).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{appointment.time}</p>
                    <p className="text-sm text-muted-foreground">{appointment.date.toDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      appointment.status === "confirmed"
                        ? "default"
                        : appointment.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {appointment.status}
                  </Badge>

                  {user?.role === "therapist" && appointment.status === "pending" && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
