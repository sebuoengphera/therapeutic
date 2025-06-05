"use client"

import { BookLibrary } from "@/components/library/book-library"

export default function LibraryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
        <p className="text-muted-foreground">
          Discover books, articles, and journals to support your mental health journey.
        </p>
      </div>

      <BookLibrary />
    </div>
  )
}
