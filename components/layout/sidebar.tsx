"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, BookOpen, Calendar, LogOut, MessageCircle, Settings, User, Users, Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppSidebar() {
  const { user, firebaseUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

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
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="bg-blue-600 text-white p-1 rounded">
            <MessageCircle size={20} />
          </div>
          <span className="text-xl font-bold">Therapeutic MindCare</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>

        <SidebarSeparator />

        {user.role === "therapist" && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/admin/quiz-manager"}>
                <Link href="/admin/quiz-manager">
                  <BarChart3 className="h-4 w-4" />
                  <span>Quiz Manager</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profileImage || firebaseUser?.photoURL || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <Badge variant="outline" className="text-xs">
                {user.role === "client" ? "Client" : "Therapist"}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export function MobileNavbar() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <div className="bg-blue-600 text-white p-1 rounded">
          <MessageCircle size={20} />
        </div>
        <span className="text-xl font-bold">TherapyConnect</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/chat" className="cursor-pointer">
              <MessageCircle className="mr-2 h-4 w-4" />
              <span>Chat</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/therapists" className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>Find Therapist</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/appointments" className="cursor-pointer">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Appointments</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/library" className="cursor-pointer">
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Library</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
