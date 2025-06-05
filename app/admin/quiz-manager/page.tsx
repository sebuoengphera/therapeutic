"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash, Edit } from "lucide-react"

interface QuizQuestion {
  id?: string
  question: string
  type: "multiple-choice" | "scale" | "text"
  options?: string[]
  scaleMin?: number
  scaleMax?: number
  scaleLabels?: { min: string; max: string }
  category: string
  weight: number
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

const defaultQuestion: QuizQuestion = {
  question: "",
  type: "multiple-choice",
  options: [""],
  category: "general",
  weight: 1,
  isActive: true,
}

const categories = [
  "general",
  "anxiety",
  "depression",
  "trauma",
  "relationships",
  "addiction",
  "family",
  "career",
  "stress",
  "goals",
  "preferences",
  "severity",
]

export default function QuizManagerPage() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({ ...defaultQuestion })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchQuestions()
    }
  }, [user])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const questionsCollection = collection(db, "quizQuestions")
      const snapshot = await getDocs(questionsCollection)
      const questionsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as QuizQuestion[]

      setQuestions(questionsList)
    } catch (error: any) {
      setError(`Error fetching questions: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddOption = () => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }))
  }

  const handleOptionChange = (index: number, value: string) => {
    setCurrentQuestion((prev) => {
      const newOptions = [...(prev.options || [])]
      newOptions[index] = value
      return { ...prev, options: newOptions }
    })
  }

  const handleRemoveOption = (index: number) => {
    setCurrentQuestion((prev) => {
      const newOptions = [...(prev.options || [])]
      newOptions.splice(index, 1)
      return { ...prev, options: newOptions }
    })
  }

  const handleTypeChange = (type: "multiple-choice" | "scale" | "text") => {
    setCurrentQuestion((prev) => {
      const newQuestion = { ...prev, type }
      if (type === "multiple-choice" && (!prev.options || prev.options.length === 0)) {
        newQuestion.options = [""]
      } else if (type === "scale") {
        newQuestion.scaleMin = 1
        newQuestion.scaleMax = 10
        newQuestion.scaleLabels = { min: "Low", max: "High" }
      }
      return newQuestion
    })
  }

  const validateQuestion = (): boolean => {
    if (!currentQuestion.question.trim()) {
      setError("Question text is required")
      return false
    }

    if (currentQuestion.type === "multiple-choice") {
      if (!currentQuestion.options || currentQuestion.options.length < 2) {
        setError("Multiple choice questions require at least 2 options")
        return false
      }

      if (currentQuestion.options.some((option) => !option.trim())) {
        setError("All options must have text")
        return false
      }
    }

    if (currentQuestion.type === "scale") {
      if (
        !currentQuestion.scaleMin ||
        !currentQuestion.scaleMax ||
        currentQuestion.scaleMin >= currentQuestion.scaleMax
      ) {
        setError("Scale minimum must be less than maximum")
        return false
      }
    }

    return true
  }

  const handleSaveQuestion = async () => {
    if (!validateQuestion()) return

    try {
      setLoading(true)
      setError(null)

      const questionData = {
        ...currentQuestion,
        updatedAt: new Date(),
      }

      if (isEditing && currentQuestion.id) {
        // Update existing question
        await updateDoc(doc(db, "quizQuestions", currentQuestion.id), questionData)
        setSuccess("Question updated successfully")
      } else {
        // Add new question
        questionData.createdAt = new Date()
        await addDoc(collection(db, "quizQuestions"), questionData)
        setSuccess("Question added successfully")
      }

      // Reset form and refresh questions
      setCurrentQuestion({ ...defaultQuestion })
      setIsEditing(false)
      fetchQuestions()
    } catch (error: any) {
      setError(`Error saving question: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditQuestion = (question: QuizQuestion) => {
    setCurrentQuestion(question)
    setIsEditing(true)
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return

    try {
      setLoading(true)
      await deleteDoc(doc(db, "quizQuestions", id))
      setSuccess("Question deleted successfully")
      fetchQuestions()
    } catch (error: any) {
      setError(`Error deleting question: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setCurrentQuestion({ ...defaultQuestion })
    setIsEditing(false)
  }

  if (!user || user.role !== "therapist") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You don't have permission to access this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quiz Question Manager</h1>
        <p className="text-muted-foreground">Create and manage questions for the client assessment quiz.</p>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="mb-6">
          <TabsTrigger value="create">Create Question</TabsTrigger>
          <TabsTrigger value="manage">Manage Questions ({questions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Question" : "Create New Question"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Success</AlertTitle>
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question Text</Label>
                  <Textarea
                    id="question"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your question here..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Question Type</Label>
                    <Select
                      value={currentQuestion.type}
                      onValueChange={(value) => handleTypeChange(value as "multiple-choice" | "scale" | "text")}
                    >
                      <SelectTrigger id="type" className="mt-1">
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="scale">Scale (1-10)</SelectItem>
                        <SelectItem value="text">Text Response</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={currentQuestion.category}
                      onValueChange={(value) => setCurrentQuestion((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="weight">Weight (Importance)</Label>
                    <Select
                      value={currentQuestion.weight.toString()}
                      onValueChange={(value) =>
                        setCurrentQuestion((prev) => ({ ...prev, weight: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger id="weight" className="mt-1">
                        <SelectValue placeholder="Select weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Low</SelectItem>
                        <SelectItem value="2">2 - Medium</SelectItem>
                        <SelectItem value="3">3 - High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={currentQuestion.isActive}
                    onCheckedChange={(checked) => setCurrentQuestion((prev) => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Active (visible to clients)</Label>
                </div>

                {/* Multiple Choice Options */}
                {currentQuestion.type === "multiple-choice" && (
                  <div className="space-y-3">
                    <Label>Answer Options</Label>
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                          disabled={currentQuestion.options?.length === 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddOption} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Add Option
                    </Button>
                  </div>
                )}

                {/* Scale Settings */}
                {currentQuestion.type === "scale" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="scaleMin">Minimum Value</Label>
                        <Input
                          id="scaleMin"
                          type="number"
                          value={currentQuestion.scaleMin || 1}
                          onChange={(e) =>
                            setCurrentQuestion((prev) => ({ ...prev, scaleMin: Number.parseInt(e.target.value) }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="scaleMax">Maximum Value</Label>
                        <Input
                          id="scaleMax"
                          type="number"
                          value={currentQuestion.scaleMax || 10}
                          onChange={(e) =>
                            setCurrentQuestion((prev) => ({ ...prev, scaleMax: Number.parseInt(e.target.value) }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minLabel">Minimum Label</Label>
                       <Input
  id="minLabel"
  value={currentQuestion.scaleLabels?.min ?? "Low"}
  onChange={(e) =>
    setCurrentQuestion((prev) => ({
      ...prev,
      scaleLabels: {
        min: e.target.value,
        max: prev.scaleLabels?.max ?? "High",
      },
    }))
  }
  placeholder="e.g., Not at all"
  className="mt-1"
/>
                      </div>
                      <div>
                        <Label htmlFor="maxLabel">Maximum Label</Label>
                        <Input
  id="maxLabel"
  value={currentQuestion.scaleLabels?.max ?? "High"}
  onChange={(e) =>
    setCurrentQuestion((prev) => ({
      ...prev,
      scaleLabels: {
        min: prev.scaleLabels?.min ?? "Low",
        max: e.target.value,
      },
    }))
  }
  placeholder="e.g., Extremely"
  className="mt-1"
/>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                  <Button onClick={handleSaveQuestion} disabled={loading}>
                    {loading ? "Saving..." : isEditing ? "Update Question" : "Save Question"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Quiz Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-center py-4">Loading questions...</p>}

              {!loading && questions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No questions found. Create your first question.</p>
                </div>
              )}

              {!loading && questions.length > 0 && (
                <div className="space-y-4">
                  {questions.map((question) => (
                    <Card key={question.id} className={question.isActive ? "" : "opacity-60"}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge>{question.type}</Badge>
                              <Badge variant="outline">{question.category}</Badge>
                              <Badge variant="secondary">Weight: {question.weight}</Badge>
                              {!question.isActive && <Badge variant="destructive">Inactive</Badge>}
                            </div>
                            <p className="font-medium">{question.question}</p>

                            {question.type === "multiple-choice" && question.options && (
                              <div className="mt-2 space-y-1">
                                {question.options.map((option, index) => (
                                  <div key={index} className="text-sm text-muted-foreground pl-4">
                                    • {option}
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.type === "scale" && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                Scale: {question.scaleMin} ({question.scaleLabels?.min}) to {question.scaleMax} (
                                {question.scaleLabels?.max})
                              </div>
                            )}

                            <div className="mt-2 text-xs text-muted-foreground">
                              Created: {question.createdAt?.toLocaleString()}
                              {question.updatedAt && ` • Updated: ${question.updatedAt.toLocaleString()}`}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditQuestion(question)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => question.id && handleDeleteQuestion(question.id)}
                              title="Delete"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
