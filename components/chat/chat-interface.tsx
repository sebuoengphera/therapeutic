"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Message, ChatSession } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Send,
  Phone,
  Video,
  Mic,
  MicOff,
  PhoneOff,
  VideoOff,
  Star,
  MessageCircle,
  Play,
  Pause,
  CameraOff,
  PhoneIncoming,
  PhoneMissed,
} from "lucide-react"

interface ChatInterfaceProps {
  sessionId: string
  session: ChatSession
}

interface CallData {
  id: string
  callerId: string
  callerName: string
  receiverId: string
  receiverName: string
  type: "voice" | "video"
  status: "calling" | "answered" | "missed" | "ended"
  timestamp: Date
  duration?: number
}

export function ChatInterface({ sessionId, session }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [callType, setCallType] = useState<"voice" | "video" | null>(null)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState("")
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [callStatus, setCallStatus] = useState<"calling" | "ringing" | "connected" | "ended">("ended")
  const [playingVoiceNote, setPlayingVoiceNote] = useState<string | null>(null)
  const [callTimer, setCallTimer] = useState(0)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null)
  const [missedCallsCount, setMissedCallsCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!sessionId) return

    // Real-time listener for messages
    const messagesQuery = query(
      collection(db, "messages"),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "asc"),
    )

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          }
        }) as Message[]

        setMessages(messagesData)
      },
      (error) => {
        console.error("Error fetching messages:", error)
        // Fallback query without orderBy if index is missing
        const fallbackQuery = query(collection(db, "messages"), where("sessionId", "==", sessionId))

        const fallbackUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
          const messagesData = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
            }
          }) as Message[]

          // Sort manually by timestamp
          messagesData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          setMessages(messagesData)
        })

        return fallbackUnsubscribe
      },
    )

    return unsubscribe
  }, [sessionId, user?.id])

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return

    const callsQuery = query(
      collection(db, "calls"),
      where("receiverId", "==", user.id),
      where("sessionId", "==", sessionId),
    )

    const unsubscribe = onSnapshot(
      callsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const callData = change.doc.data()

            if (callData.status === "calling") {
              // Incoming call
              setIncomingCall({
                id: change.doc.id,
                callerId: callData.callerId,
                callerName: callData.callerName,
                receiverId: callData.receiverId,
                receiverName: callData.receiverName,
                type: callData.type,
                status: callData.status,
                timestamp: callData.timestamp?.toDate() || new Date(),
              })

              setCallType(callData.type)
              setCallStatus("ringing")
              setInCall(true)

              // Start vibration
              startVibration()

              // Auto-mark as missed after 30 seconds if not answered
              callTimeoutRef.current = setTimeout(async () => {
                await markCallAsMissed(change.doc.id)
              }, 30000)
            }
          } else if (change.type === "modified") {
            const callData = change.doc.data()

            if (callData.status === "answered" && currentCallId === change.doc.id) {
              // Call was answered by receiver
              setCallStatus("connected")
              setCallTimer(0)
              stopVibration()

              // Start call timer
              callTimerRef.current = setInterval(() => {
                setCallTimer((prev) => prev + 1)
              }, 1000)

              if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current)
              }
            } else if (callData.status === "ended") {
              // Call was ended
              await endCall()
            }
          }
        })
      },
      (error) => {
        console.error("Error listening for calls:", error)
      },
    )

    return unsubscribe
  }, [user, sessionId, currentCallId])

  // Fetch missed calls count
  useEffect(() => {
    if (!user) return

    const fetchMissedCalls = async () => {
      try {
        const missedCallsQuery = query(
          collection(db, "calls"),
          where("receiverId", "==", user.id),
          where("sessionId", "==", sessionId),
          where("status", "==", "missed"),
        )
        const snapshot = await getDocs(missedCallsQuery)
        setMissedCallsCount(snapshot.size)
      } catch (error) {
        console.error("Error fetching missed calls:", error)
      }
    }

    fetchMissedCalls()
  }, [user, sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupCall()
    }
  }, [])

  const startVibration = () => {
    if ("vibrate" in navigator) {
      vibrationIntervalRef.current = setInterval(() => {
        navigator.vibrate([500, 200, 500, 200, 500])
      }, 2000)
    }
  }

  const stopVibration = () => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current)
      vibrationIntervalRef.current = null
    }
    if ("vibrate" in navigator) {
      navigator.vibrate(0)
    }
  }

  const cleanupCall = () => {
    // Stop all media streams
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      setLocalStream(null)
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }

    // Clear timers
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }

    stopVibration()
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    setLoading(true)
    try {
      await addDoc(collection(db, "messages"), {
        sessionId,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
        type: "text",
      })

      try {
        await updateDoc(doc(db, "chatSessions", sessionId), {
          lastMessage: newMessage.trim(),
          lastMessageTime: serverTimestamp(),
        })
      } catch (updateError) {
        console.log("Could not update session, but message sent successfully")
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        await sendVoiceNote(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendVoiceNote = async (audioBlob: Blob) => {
    if (!user) return

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = reader.result as string

        await addDoc(collection(db, "messages"), {
          sessionId,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          content: "Voice message",
          timestamp: serverTimestamp(),
          read: false,
          type: "voice",
          audioData: base64Audio,
          duration: Math.floor(Math.random() * 30) + 5,
        })

        try {
          await updateDoc(doc(db, "chatSessions", sessionId), {
            lastMessage: "🎵 Voice message",
            lastMessageTime: serverTimestamp(),
          })
        } catch (updateError) {
          console.log("Could not update session, but voice message sent successfully")
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error("Error sending voice note:", error)
    }
  }

  const playVoiceNote = (messageId: string, audioData: string) => {
    if (playingVoiceNote === messageId) {
      setPlayingVoiceNote(null)
      return
    }

    try {
      const audio = new Audio(audioData)
      audio.play()
      setPlayingVoiceNote(messageId)

      audio.onended = () => {
        setPlayingVoiceNote(null)
      }
    } catch (error) {
      console.error("Error playing voice note:", error)
    }
  }

  const startCall = async (type: "voice" | "video") => {
    if (!user) return

    try {
      // Get user media first to show camera preview
      const constraints = {
        audio: true,
        video: type === "video",
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)

      if (localVideoRef.current && type === "video") {
        localVideoRef.current.srcObject = stream
      }

      // Create call document in database
      const callDoc = await addDoc(collection(db, "calls"), {
        sessionId,
        callerId: user.id,
        callerName: user.name,
        receiverId: otherParticipant.id,
        receiverName: otherParticipant.name,
        type,
        status: "calling",
        timestamp: serverTimestamp(),
      })

      setCurrentCallId(callDoc.id)
      setCallType(type)
      setCallStatus("calling")
      setInCall(true)

      // Set timeout for missed call (30 seconds)
      callTimeoutRef.current = setTimeout(async () => {
        await markCallAsMissed(callDoc.id)
      }, 30000)
    } catch (error) {
      console.error("Error starting call:", error)
      alert("Could not access camera/microphone. Please check permissions and try again.")
    }
  }

  const answerCall = async () => {
    if (!incomingCall) return

    try {
      const constraints = {
        audio: true,
        video: callType === "video",
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)

      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream
      }

      // Update call status to answered
      await updateDoc(doc(db, "calls", incomingCall.id), {
        status: "answered",
        answeredAt: serverTimestamp(),
      })

      setCallStatus("connected")
      setCallTimer(0)
      stopVibration()

      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1)
      }, 1000)

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current)
      }

      setIncomingCall(null)
    } catch (error) {
      console.error("Error answering call:", error)
      alert("Could not access camera/microphone. Please check permissions.")
      await rejectCall(incomingCall.id)
    }
  }

  const rejectCall = async (callId?: string) => {
    const id = callId || incomingCall?.id || currentCallId
    if (!id) return

    try {
      await updateDoc(doc(db, "calls", id), {
        status: "ended",
        endedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error rejecting call:", error)
    }

    await endCall()
  }

  const markCallAsMissed = async (callId: string) => {
    try {
      await updateDoc(doc(db, "calls", callId), {
        status: "missed",
        missedAt: serverTimestamp(),
      })

      // Send missed call message
      if (user) {
        await addDoc(collection(db, "messages"), {
          sessionId,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          content: `📞 Missed ${callType} call`,
          timestamp: serverTimestamp(),
          read: false,
          type: "text",
        })
      }

      // Increment missed calls count locally
      setMissedCallsCount((prev) => prev + 1)
    } catch (error) {
      console.error("Error marking call as missed:", error)
      // Still increment locally even if database update fails
      setMissedCallsCount((prev) => prev + 1)
    }

    await endCall()
  }

  const endCall = async () => {
    try {
      // Update current call status if exists
      if (currentCallId) {
        await updateDoc(doc(db, "calls", currentCallId), {
          status: "ended",
          endedAt: serverTimestamp(),
          duration: callTimer,
        })

        // Send call end message
        if (user) {
          await addDoc(collection(db, "messages"), {
            sessionId,
            senderId: user.id,
            senderName: user.name,
            senderRole: user.role,
            content: `📞 Call ended • Duration: ${formatCallTime(callTimer)}`,
            timestamp: serverTimestamp(),
            read: false,
            type: "text",
          })
        }
      }

      // Clean up call state
      cleanupCall()

      setInCall(false)
      setCallType(null)
      setCallStatus("ended")
      setCallTimer(0)
      setCurrentCallId(null)
      setIncomingCall(null)
      setIsVideoEnabled(true)
      setIsAudioEnabled(true)
    } catch (error) {
      console.error("Error ending call:", error)
      // Still clean up even if database update fails
      cleanupCall()
      setInCall(false)
      setCallType(null)
      setCallStatus("ended")
      setCallTimer(0)
      setCurrentCallId(null)
      setIncomingCall(null)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const submitRating = async () => {
    if (!user || rating === 0) return

    try {
      await addDoc(collection(db, "ratings"), {
        sessionId,
        raterId: user.id,
        raterName: user.name,
        raterRole: user.role,
        ratedId: otherParticipant.id,
        ratedName: otherParticipant.name,
        rating,
        comment: ratingComment,
        timestamp: serverTimestamp(),
      })

      setShowRatingDialog(false)
      setRating(0)
      setRatingComment("")
    } catch (error) {
      console.error("Error submitting rating:", error)
      setShowRatingDialog(false)
      setRating(0)
      setRatingComment("")
    }
  }

  const dismissMissedCalls = () => {
    setMissedCallsCount(0)
  }

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const otherParticipant =
    user?.role === "client"
      ? { name: session.therapistName, id: session.therapistId }
      : { name: session.clientName, id: session.clientId }

  const unreadCount = messages.filter((msg) => !msg.read && msg.senderId !== user?.id).length

  return (
    <div className="h-full flex flex-col">
      {/* Missed Calls Alert */}
      {missedCallsCount > 0 && (
        <Alert className="mb-4 border-yellow-400 bg-yellow-50">
          <PhoneMissed className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-yellow-800">
              You have {missedCallsCount} missed call{missedCallsCount > 1 ? "s" : ""} from {otherParticipant.name}
            </span>
            <Button variant="ghost" size="sm" onClick={dismissMissedCalls} className="text-yellow-700">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Unread Messages Info */}
      {unreadCount > 0 && (
        <Alert className="mb-4 border-blue-400 bg-blue-50">
          <MessageCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {unreadCount} unread message{unreadCount > 1 ? "s" : ""} (viewing will mark as read)
          </AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{otherParticipant.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {session.status === "active" ? "Session Active" : "Session Expired"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {session.status === "active" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startCall("voice")}
                    disabled={inCall}
                    title="Voice call"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startCall("video")}
                    disabled={inCall}
                    title="Video call"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowRatingDialog(true)}>
                    <Star className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4">
          {/* Call Interface */}
          {inCall && (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold mb-2">
                    {callStatus === "ringing" ? incomingCall?.callerName : otherParticipant.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {callStatus === "calling" && "Calling... Waiting for answer"}
                    {callStatus === "ringing" && (
                      <span className="flex items-center justify-center space-x-2">
                        <PhoneIncoming className="h-4 w-4" />
                        <span>Incoming {callType} call</span>
                      </span>
                    )}
                    {callStatus === "connected" && (
                      <span>
                        {callType === "video" ? "Video" : "Voice"} call • {formatCallTime(callTimer)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Video Area */}
                {callType === "video" && (
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="relative">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                      />
                      <p className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                        You {!isVideoEnabled && "(Camera Off)"}
                      </p>
                      {!isVideoEnabled && (
                        <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center">
                          <CameraOff className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Voice Call Indicator */}
                {callType === "voice" && (
                  <div className="text-center mb-6">
                    <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="h-16 w-16 text-blue-600" />
                    </div>
                    <p className="text-lg font-medium">
                      {callStatus === "calling" && "Calling..."}
                      {callStatus === "ringing" && "Incoming Call"}
                      {callStatus === "connected" && "Voice Call"}
                    </p>
                  </div>
                )}

                {/* Call Controls */}
                <div className="flex justify-center space-x-4">
                  {callStatus === "ringing" ? (
                    <>
                      <Button variant="default" onClick={answerCall} className="bg-green-500 hover:bg-green-600">
                        <Phone className="h-4 w-4 mr-2" />
                        Answer
                      </Button>
                      <Button variant="destructive" onClick={() => rejectCall()}>
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  ) : (
                    <>
                      {callType === "video" && callStatus === "connected" && (
                        <Button variant="outline" onClick={toggleVideo}>
                          {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>
                      )}
                      {callStatus === "connected" && (
                        <Button variant="outline" onClick={toggleAudio}>
                          {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button variant="destructive" onClick={() => endCall()}>
                        <PhoneOff className="h-4 w-4 mr-2" />
                        {callStatus === "calling" ? "Cancel" : "End Call"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.senderId === user?.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.type === "voice" ? (
                      <div className="flex items-center space-x-2">
                        <Button
  variant="ghost"
  size="sm"
  onClick={message.audioData ? () => playVoiceNote(message.id, message.audioData!) : undefined}
  disabled={!message.audioData}
  className="p-1 h-8 w-8"
>
  {playingVoiceNote === message.id ? (
    <Pause className="h-4 w-4" />
  ) : (
    <Play className="h-4 w-4" />
  )}
</Button>
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <div className="w-full bg-gray-300 rounded-full h-1 mt-1">
                            <div className="bg-blue-600 h-1 rounded-full w-1/3"></div>
                          </div>
                        </div>
                        <span className="text-xs opacity-70">{message.duration}s</span>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</p>
                      {message.senderId === user?.id && <span className="text-xs opacity-70">Sent</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {session.status === "active" && (
            <div className="border-t pt-4">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onMouseDown={startVoiceRecording}
                  onMouseUp={stopVoiceRecording}
                  onMouseLeave={stopVoiceRecording}
                  className={isRecording ? "bg-red-500 text-white" : ""}
                  title="Hold to record voice message"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button type="submit" disabled={loading || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {isRecording && <p className="text-sm text-red-500 mt-2">Recording... Release to send</p>}
            </div>
          )}

          {session.status === "expired" && (
            <div className="text-center py-4 text-muted-foreground border-t">
              <p>This session has expired. Please make a new payment to continue.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {otherParticipant.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button key={star} variant="ghost" size="sm" onClick={() => setRating(star)} className="p-1">
                    <Star
                      className={`h-6 w-6 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitRating} disabled={rating === 0}>
                Submit Rating
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
