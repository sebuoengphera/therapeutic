export interface User {
  id: string
  email: string
  name: string
  role: "client" | "therapist"
  specialization?: string
  bio?: string
  licenseNumber?: string
  yearsExperience?: number
  rating?: number
  profileImage?: string
  isVerified?: boolean
  emailVerified?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ChatSession {
  id: string
  clientId: string
  clientName: string
  therapistId: string
  therapistName: string
  status: "active" | "expired" | "pending"
  createdAt: Date
  expiresAt: Date
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
}

export interface Message {
  id: string
  sessionId: string
  senderId: string
  senderName: string
  senderRole: "client" | "therapist"
  content: string
  timestamp: Date
  read: boolean
  type: "text" | "voice" | "image"
  duration?: number
  audioData?: string
}

export interface Call {
  id: string
  sessionId: string
  callerId: string
  callerName: string
  receiverId: string
  receiverName: string
  type: "voice" | "video"
  status: "calling" | "answered" | "ended" | "missed"
  timestamp: Date
  duration?: number
}

export interface Rating {
  id: string
  sessionId: string
  raterId: string
  raterName: string
  raterRole: "client" | "therapist"
  ratedId: string
  ratedName: string
  rating: number
  comment: string
  timestamp: Date
}

export interface Payment {
  id: string
  clientId: string
  therapistId: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed"
  sessionDuration: number // days
  createdAt: Date
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  therapistId: string
  therapistName: string
  date: Date
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  notes?: string
  createdAt: Date
}

export interface Book {
  id: string
  title: string
  author: string
  description: string
  category: string
  url: string
  coverImage: string
  downloadUrl?: string
}

export interface Quiz {
  id: string
  clientId: string
  responses: Record<string, any>
  scores: Record<string, number>
  recommendations: {
    therapistSpecializations: string[]
    bookCategories: string[]
    urgencyLevel: "low" | "medium" | "high" | "urgent"
    primaryConcerns: string[]
  }
  completedAt: Date
  version: string
}

export interface Progress {
  id: string
  clientId: string
  therapistId: string
  rating: number
  notes: string
  date: Date
}
