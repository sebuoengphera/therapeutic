"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Appointment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, CheckCircle, XCircle, CalendarIcon, Plus, User } from "lucide-react"

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  const [selectedTherapist, setSelectedTherapist] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [appointmentNotes, setAppointmentNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [showBookingDialog, setShowBookingDialog] = useState(false)

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

  useEffect(() => {
    if (user) {
      fetchAppointments()
      if (user.role === "client") {
        fetchTherapists()
      }
    }
  }, [user])

  const fetchAppointments = async () => {
    if (!user) return

    try {
      let appointmentsQuery

      if (user.role === "client") {
        appointmentsQuery = query(collection(db, "appointments"), where("clientId", "==", user.id))
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
    } catch (error) {
      console.error("Error fetching appointments:", error)
    }
  }

  const fetchTherapists = async () => {
    try {
      const therapistsQuery = query(collection(db, "users"), where("role", "==", "therapist"))
      const snapshot = await getDocs(therapistsQuery)
      const therapistsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setTherapists(therapistsData)
    } catch (error) {
      console.error("Error fetching therapists:", error)
    }
  }

  const bookAppointment = async () => {
    if (!user || !selectedDate || !selectedTime || (user.role === "client" && !selectedTherapist)) return

    setLoading(true)
    try {
      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(Number.parseInt(selectedTime.split(":")[0]))
      appointmentDate.setMinutes(Number.parseInt(selectedTime.split(":")[1]))

      await addDoc(collection(db, "appointments"), {
        clientId: user.role === "client" ? user.id : "",
        clientName: user.role === "client" ? user.name : "",
        therapistId: user.role === "client" ? selectedTherapist : user.id,
        therapistName:
          user.role === "client" ? therapists.find((t) => t.id === selectedTherapist)?.name || "" : user.name,
        date: appointmentDate,
        time: selectedTime,
        status: "pending",
        notes: appointmentNotes,
        createdAt: serverTimestamp(),
      })

      setSelectedTime("")
      setSelectedTherapist("")
      setAppointmentNotes("")
      setShowBookingDialog(false)
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
        updatedAt: serverTimestamp(),
      })
      fetchAppointments()
    } catch (error) {
      console.error("Error updating appointment:", error)
    }
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => apt.date.toDateString() === date.toDateString())
  }

  const upcomingAppointments = appointments
    .filter((apt) => apt.date >= new Date() && apt.status !== "cancelled")
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Appointments</h1>
        <p className="text-muted-foreground">
          {user?.role === "client" ? "Schedule and manage your therapy sessions" : "Manage your client appointments"}
        </p>
      </div>

      {/* Therapist View - Show Appointments List */}
      {user?.role === "therapist" && (
        <div className="space-y-6">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No appointments scheduled</h3>
                <p className="text-muted-foreground">Clients will be able to book appointments with you.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upcoming Appointments ({upcomingAppointments.length})</h2>
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.clientName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {appointment.date.toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {appointment.time}
                            </span>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground mt-2">Notes: {appointment.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
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

                        {appointment.status === "pending" && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Client View - Calendar and Booking */}
      {user?.role === "client" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Date</CardTitle>
                <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Book New Appointment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="therapist">Select Therapist</Label>
                        <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a therapist" />
                          </SelectTrigger>
                          <SelectContent>
                            {therapists.map((therapist) => (
                              <SelectItem key={therapist.id} value={therapist.id}>
                                {therapist.name} - {therapist.specialization}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      </div>

                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          value={appointmentNotes}
                          onChange={(e) => setAppointmentNotes(e.target.value)}
                          placeholder="Any specific concerns or topics you'd like to discuss..."
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={bookAppointment}
                          disabled={loading || !selectedTherapist || !selectedDate || !selectedTime}
                        >
                          {loading ? "Booking..." : "Book Appointment"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? `Appointments for ${selectedDate.toDateString()}` : "Your Appointments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(selectedDate ? getAppointmentsForDate(selectedDate) : upcomingAppointments).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{appointment.time}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.therapistName} • {appointment.date.toDateString()}
                        </p>
                        {appointment.notes && <p className="text-xs text-muted-foreground mt-1">{appointment.notes}</p>}
                      </div>
                    </div>

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
                  </div>
                ))}

                {(selectedDate ? getAppointmentsForDate(selectedDate) : upcomingAppointments).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No appointments {selectedDate ? "for this date" : "scheduled"}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
