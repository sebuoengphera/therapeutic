"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import type { Book } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Download, Save, Search } from "lucide-react"

export function BookLibrary() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [savedBooks, setSavedBooks] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(false)

  const categories = [
    "all",
    "anxiety",
    "depression",
    "relationships",
    "trauma",
    "addiction",
    "family",
    "career",
    "mindfulness",
    "self-help",
    "cultural",
  ]

  useEffect(() => {
    loadBooks()
    fetchSavedBooks()
  }, [selectedCategory, searchTerm])

  const loadBooks = () => {
    setLoading(true)

    // Use static book data with real book covers
    const staticBooks = getStaticBooks()

    // Filter books based on search and category
    const filtered = staticBooks.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === "all" || book.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    setBooks(filtered)
    setLoading(false)
  }

  const getStaticBooks = (): Book[] => [
    {
      id: "book-1",
      title: "The Anxiety and Worry Workbook",
      author: "David A. Clark",
      description:
        "A comprehensive guide to understanding and managing anxiety through cognitive behavioral techniques.",
      category: "anxiety",
      url: "https://www.google.co.ls/books/edition/Anxiety_and_Worry_Workbook/whSwEAAAQBAJ?hl=en&gbpv=1",
      coverImage: "/books/the enxiety and worry workbook.jpeg",
      downloadUrl: "chrome-extension://kdpelmjpfafjppnhbloffcjpeomlnpah/https://todaytelemedicine.com/wp-content/uploads/2023/12/THEANX1.pdf",
    },
    {
      id: "book-2",
      title: "Feeling Good: The New Mood Therapy",
      author: "David D. Burns",
      description: "The classic guide to overcoming depression using cognitive behavioral therapy techniques.",
      category: "depression",
      url: "https://www.goodreads.com/book/show/46674.Feeling_Good",
      coverImage: "/books/feeling good.jpg",
      downloadUrl: "https://example.com/download/feeling-good.pdf",
    },
    {
      id: "book-3",
      title: "The Seven Principles for Making Marriage Work",
      author: "John Gottman",
      description: "Research-based strategies for building stronger, more loving relationships.",
      category: "relationships",
      url: "https://relationshipinstitute.com.au/uploads/resources/the_seven_principles_for_making_marriage_work_summary.pdf",
      coverImage: "/books/the seven principles.jpg",
      downloadUrl: "https://example.com/download/marriage-work.pdf",
    },
    {
      id: "book-4",
      title: "Trauma and Recovery",
      author: "Judith Herman",
      description: "A groundbreaking work on understanding and healing from psychological trauma.",
      category: "trauma",
      url: "https://beyondthetemple.com/wp-content/uploads/2018/04/herman_trauma-and-recovery-1.pdf",
      coverImage: "/books/trauma and recovery.jpg",
      downloadUrl: "https://example.com/download/trauma-recovery.pdf",
    },
    {
      id: "book-5",
      title: "The Self-Compassion Workbook",
      author: "Kristin Neff",
      description: "Learn to treat yourself with kindness and develop emotional resilience.",
      category: "self-help",
      url: "https://self-compassion.org/books-by-kristin-neff/",
      coverImage: "/books/mindful for beginners.jpg",
      downloadUrl: "https://example.com/download/self-compassion.pdf",
    },
    {
      id: "book-6",
      title: "Mindfulness for Beginners",
      author: "Jon Kabat-Zinn",
      description: "An introduction to mindfulness meditation and its benefits for mental health.",
      category: "mindfulness",
      url: "https://thekeep.eiu.edu/cgi/viewcontent.cgi?article=1544&context=jcba",
      coverImage: "/books/mindful1.jpg",
      downloadUrl: "https://example.com/download/mindfulness-beginners.pdf",
    },
    {
      id: "book-7",
      title: "The Body Keeps the Score",
      author: "Bessel van der Kolk",
      description: "Revolutionary understanding of how trauma affects the body and brain, and how it can be healed.",
      category: "trauma",
      url: "https://therapyinanutshell.com/the-body-keeps-the-score/",
      coverImage: "/books/the body keeps the score.jpg",
      downloadUrl: "https://example.com/download/body-keeps-score.pdf",
    },
    {
      id: "book-8",
      title: "Attached",
      author: "Amir Levine",
      description: "The new science of adult attachment and how it can help you find and keep love.",
      category: "relationships",
      url: "https://archive.org/details/AttachementTheory/page/n7/mode/2up",
      coverImage: "/books/Attached.jpg",
      downloadUrl: "https://example.com/download/attached.pdf",
    },
    {
      id: "book-9",
      title: "The Gifts of Imperfection",
      author: "Brené Brown",
      description: "Let go of who you think you're supposed to be and embrace who you are.",
      category: "self-help",
      url: "https://www.amazon.com/Gifts-Imperfection-Think-Supposed-Embrace/dp/159285849X",
      coverImage: "/books/The Gifts of Imperfection.jpg",
      downloadUrl: "https://example.com/download/gifts-imperfection.pdf",
    },
    {
      id: "book-10",
      title: "Maybe You Should Talk to Someone",
      author: "Lori Gottlieb",
      description: "A therapist, her therapist, and our lives revealed through the lens of therapy.",
      category: "self-help",
      url: "https://www.amazon.com/Maybe-You-Should-Talk-Someone/dp/1328662055",
      coverImage: "/books/Maybe You Should Talk to Someone.jpg",
      downloadUrl: "https://example.com/download/maybe-you-should-talk.pdf",
    },
  ]

  const fetchSavedBooks = async () => {
    if (!user) return

    try {
      const savedBooksQuery = query(collection(db, "savedBooks"), where("userId", "==", user.id))
      const snapshot = await getDocs(savedBooksQuery)
      const savedBookIds = snapshot.docs.map((doc) => doc.data().bookId)
      setSavedBooks(savedBookIds)
    } catch (error) {
      console.error("Error fetching saved books:", error)
      setSavedBooks([])
    }
  }

  const saveBook = async (book: Book) => {
    if (!user) return

    try {
      setSavedBooks((prev) => [...prev, book.id])
    } catch (error) {
      console.error("Error saving book:", error)
    }
  }

  const downloadBook = (book: Book) => {
    if (book.downloadUrl) {
      window.open(book.downloadUrl, "_blank")
    } else {
      window.open(book.url, "_blank")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading books...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col items-center space-y-3">
                  <img
                    src={book.coverImage || "/placeholder.svg"}
                    alt={book.title}
                    className="w-24 h-32 object-cover rounded shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=128&width=96"
                    }}
                  />
                  <div className="text-center">
                    <CardTitle className="text-sm line-clamp-2 mb-1">{book.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {book.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{book.description}</p>

                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(book.url, "_blank")}
                    className="w-full"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    View Book
                  </Button>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveBook(book)}
                      disabled={savedBooks.includes(book.id)}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => downloadBook(book)} className="flex-1">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {books.length === 0 && !loading && (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No books found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
