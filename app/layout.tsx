import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AppSidebar, MobileNavbar } from "@/components/layout/sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Therapeutic MindCare",
  description: "A therapeutic platform for mental health support",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SidebarProvider>
            <div className="flex h-screen w-full">
              <div className="hidden md:block">
                <AppSidebar />
              </div>
              <SidebarInset className="flex flex-col flex-1">
                <div className="md:hidden">
                  <MobileNavbar />
                </div>
                <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
