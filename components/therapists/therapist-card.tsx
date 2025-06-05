"use client"

import type { User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Users, Clock, MessageCircle, Calendar } from "lucide-react"
import Link from "next/link"

interface TherapistCardProps {
  therapist: User & {
    totalClients?: number
    averageRating?: number
    responseTime?: string
    isOnline?: boolean
  }
  onContact?: (therapistId: string) => void
  onBookAppointment?: (therapistId: string) => void
  showActions?: boolean
}

export function TherapistCard({ therapist, onContact, onBookAppointment, showActions = true }: TherapistCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg truncate">{therapist.name}</CardTitle>
              {therapist.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">{therapist.specialization}</p>

            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
              {therapist.averageRating && therapist.averageRating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{therapist.averageRating.toFixed(1)}</span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{therapist.totalClients || 0} clients</span>
              </div>

              {therapist.yearsExperience && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{therapist.yearsExperience}y exp</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Bio */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {therapist.bio || "Professional therapist dedicated to helping clients achieve their mental health goals."}
          </p>

          {/* Status */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${therapist.isOnline ? "bg-green-500" : "bg-gray-400"}`}></div>
              <span className="text-muted-foreground">{therapist.isOnline ? "Online now" : "Offline"}</span>
            </div>
            <span className="text-muted-foreground">Response: {therapist.responseTime || "< 24h"}</span>
          </div>

          {/* License Info */}
          {therapist.licenseNumber && (
            <div className="text-xs text-muted-foreground">License: {therapist.licenseNumber}</div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex space-x-2 pt-2">
              <Button size="sm" onClick={() => onContact?.(therapist.id)} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </Button>
              <Button size="sm" variant="outline" onClick={() => onBookAppointment?.(therapist.id)} className="flex-1">
                <Calendar className="h-4 w-4 mr-1" />
                Book
              </Button>
            </div>
          )}

          {/* View Profile Link */}
          <Link href={`/therapists/${therapist.id}`} className="block">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View Full Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
