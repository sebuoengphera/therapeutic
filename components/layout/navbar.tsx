"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Calendar, BookOpen, Users, BarChart3, LogOut, Settings, User } from "lucide-react"

export function Navbar() {
  const { user, firebaseUser } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (!user) return null

  const clientNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/therapists", label: "Find Therapist", icon: Users },
    { href: "/appointments", label: "Appointments", icon: Calendar },
    { href: "/library", label: "Library", icon: BookOpen },
  ]

  const therapistNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/clients", label: "My Clients", icon: Users },
    { href: "/appointments", label: "Appointments", icon: Calendar },
    { href: "/library", label: "Library", icon: BookOpen },
  ]

  const navItems = user.role === "client" ? clientNavItems : therapistNavItems

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              TherapyConnect
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            {/* Email Verification Status */}
            {firebaseUser && !firebaseUser.emailVerified && (
              <Badge variant="destructive" className="text-xs">
                Email not verified
              </Badge>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.profileImage || firebaseUser?.photoURL || "/placeholder.svg"}
                      alt={user.name}
                    />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="w-fit text-xs mt-1">
                    {user.role === "client" ? "Client" : "Therapist"}
                  </Badge>
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>

                {user.role === "therapist" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/quiz-manager" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Quiz Manager</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
