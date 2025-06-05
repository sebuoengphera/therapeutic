"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, Users, Clock, MessageCircle } from "lucide-react"
import Link from "next/link"

interface Therapist {
  id: string
  name: string
  email: string
  specialization: string
  bio?: string
  yearsExperience?: number
  licenseNumber?: string
  profileImage?: string
  averageRating?: number
  clientCount?: number
  isOnline?: boolean
}

export default function TherapistsPage() {
  const { user } = useAuth()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialization, setSelectedSpecialization] = useState("all")
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    fetchTherapists()
  }, [])

  useEffect(() => {
    filterAndSortTherapists()
  }, [therapists, searchTerm, selectedSpecialization, sortBy])

  const fetchTherapists = async () => {
    try {
      const therapistsQuery = query(collection(db, "users"), where("role", "==", "therapist"))
      const snapshot = await getDocs(therapistsQuery)

      const therapistsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data()
          const therapist: Therapist = {
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "",
            specialization: data.specialization || "General Therapy",
            bio: data.bio,
            yearsExperience: data.yearsExperience || 0,
            licenseNumber: data.licenseNumber,
            profileImage: data.profileImage,
            averageRating: 0,
            clientCount: 0,
            isOnline: Math.random() > 0.5, // Mock online status
          }

          // Fetch stats for each therapist
          try {
            const sessionsQuery = query(collection(db, "chatSessions"), where("therapistId", "==", doc.id))
            const sessionsSnapshot = await getDocs(sessionsQuery)
            const uniqueClients = new Set()
            sessionsSnapshot.docs.forEach((sessionDoc) => {
              uniqueClients.add(sessionDoc.data().clientId)
            })
            therapist.clientCount = uniqueClients.size

            const ratingsQuery = query(collection(db, "progress"), where("therapistId", "==", doc.id))
            const ratingsSnapshot = await getDocs(ratingsQuery)
            const ratings = ratingsSnapshot.docs
              .map((ratingDoc) => ratingDoc.data().rating)
              .filter((rating) => typeof rating === "number")

            therapist.averageRating =
              ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
          } catch (error) {
            console.log("Could not fetch stats for therapist", doc.id)
          }

          return therapist
        }),
      )

      setTherapists(therapistsData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching therapists:", error)
      setLoading(false)
    }
  }

  const filterAndSortTherapists = () => {
    const filtered = therapists.filter((therapist) => {
      const matchesSearch =
        therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (therapist.bio && therapist.bio.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesSpecialization =
        selectedSpecialization === "all" ||
        therapist.specialization.toLowerCase().includes(selectedSpecialization.toLowerCase())

      return matchesSearch && matchesSpecialization
    })

    // Sort therapists
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0)
        case "experience":
          return (b.yearsExperience || 0) - (a.yearsExperience || 0)
        case "clients":
          return (b.clientCount || 0) - (a.clientCount || 0)
        case "name":
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredTherapists(filtered)
  }

  const specializations = [
    "all",
    "Anxiety Disorders",
    "Depression",
    "Trauma Therapy",
    "Couples Therapy",
    "Family Therapy",
    "Addiction",
    "PTSD",
    "Grief Counseling",
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading therapists...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Therapist</h1>
        <p className="text-muted-foreground">Connect with licensed mental health professionals</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search therapists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
              <SelectTrigger>
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec === "all" ? "All Specializations" : spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="clients">Client Count</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredTherapists.length} therapist{filteredTherapists.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Therapists Grid */}
      {filteredTherapists.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No therapists found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTherapists.map((therapist) => (
            <Card key={therapist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={therapist.profileImage || "/placeholder.svg"} alt={therapist.name} />
                      <AvatarFallback className="text-lg">{therapist.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {therapist.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                 <div className="flex-1">
  <CardTitle className="text-lg">{therapist.name}</CardTitle>
  <p className="text-sm text-muted-foreground">{therapist.specialization}</p>
  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
    {typeof therapist.averageRating === "number" && therapist.averageRating > 0 && (
      <div className="flex items-center space-x-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span>{therapist.averageRating.toFixed(1)}</span>
      </div>
    )}
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{therapist.clientCount || 0} clients</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{therapist.yearsExperience || 0} years</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {therapist.bio ||
                    "Experienced mental health professional dedicated to helping clients achieve their goals."}
                </p>
                <div className="flex space-x-2">
                  <Link href={`/therapists/${therapist.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  {user?.role === "client" && (
                    <Link href={`/therapists/${therapist.id}`}>
                      <Button size="icon">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
