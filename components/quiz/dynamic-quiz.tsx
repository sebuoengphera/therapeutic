"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from "lucide-react"

interface QuizQuestion {
  id: string
  question: string
  type: "multiple-choice" | "scale" | "text"
  options?: string[]
  scaleMin?: number
  scaleMax?: number
  scaleLabels?: { min: string; max: string }
  category: string
  weight: number
  isActive: boolean
}

interface DynamicQuizProps {
  onComplete: () => void
}

export function DynamicQuiz({ onComplete }: DynamicQuizProps) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)

      // First try with orderBy
      try {
        const questionsQuery = query(
          collection(db, "quizQuestions"),
          where("isActive", "==", true),
          orderBy("weight", "desc"),
        )
        const snapshot = await getDocs(questionsQuery)

        if (snapshot.empty) {
          setError("No quiz questions found. Please contact support.")
          return
        }

        const questionsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as QuizQuestion[]

        setQuestions(questionsList)
      } catch (indexError: any) {
        // Fallback to simple query without orderBy
        console.log("Index not available for quiz questions, using fallback")

        const questionsQuery = query(collection(db, "quizQuestions"), where("isActive", "==", true))
        const snapshot = await getDocs(questionsQuery)

        if (snapshot.empty) {
          setError("No quiz questions found. Please contact support.")
          return
        }

        const questionsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as QuizQuestion[]

        // Sort manually by weight (descending)
        questionsList.sort((a, b) => (b.weight || 0) - (a.weight || 0))
        setQuestions(questionsList)
      }
    } catch (error: any) {
      setError(`Error loading quiz: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = (questionId: string, answer: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: answer }))
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      submitQuiz()
    }
  }

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const calculateScores = () => {
    const scores: Record<string, number> = {
      anxiety: 0,
      depression: 0,
      trauma: 0,
      relationships: 0,
      addiction: 0,
      family: 0,
      career: 0,
      stress: 0,
      general: 0,
      overall_severity: 0,
    }

    // Calculate category scores based on responses
    Object.entries(responses).forEach(([questionId, answer]) => {
      const question = questions.find((q) => q.id === questionId)
      if (!question) return

      let score = 0

      if (question.type === "multiple-choice") {
        const optionIndex = question.options?.indexOf(answer) ?? 0
        score = ((optionIndex + 1) / (question.options?.length ?? 1)) * question.weight
      } else if (question.type === "scale") {
        const normalizedScore =
          (answer - (question.scaleMin ?? 1)) / ((question.scaleMax ?? 10) - (question.scaleMin ?? 1))
        score = normalizedScore * question.weight
      }

      // Add to appropriate category
      if (scores[question.category] !== undefined) {
        scores[question.category] += score
      } else {
        scores.general += score
      }

      // Add to overall severity
      scores.overall_severity += score
    })

    return scores
  }

  const generateRecommendations = (scores: Record<string, number>) => {
    const recommendations = {
      therapistSpecializations: [] as string[],
      bookCategories: [] as string[],
      urgencyLevel: "low" as "low" | "medium" | "high" | "urgent",
      primaryConcerns: [] as string[],
    }

    // Determine primary concerns based on highest scores
    const sortedScores = Object.entries(scores)
      .filter(([key]) => key !== "overall_severity" && key !== "general")
      .sort(([, a], [, b]) => b - a)

    // Get top 3 concerns
    const topConcerns = sortedScores.slice(0, 3).map(([category]) => category)

    // Map concerns to therapist specializations and book categories
    topConcerns.forEach((concern) => {
      switch (concern) {
        case "anxiety":
          recommendations.therapistSpecializations.push(
            "Anxiety Disorders",
            "Cognitive Behavioral Therapy",
            "Mindfulness-Based Therapy",
          )
          recommendations.bookCategories.push("anxiety", "mindfulness", "stress-management", "coping-skills")
          recommendations.primaryConcerns.push("Anxiety and Stress Management")
          break
        case "depression":
          recommendations.therapistSpecializations.push(
            "Depression Treatment",
            "Mood Disorders",
            "Cognitive Behavioral Therapy",
          )
          recommendations.bookCategories.push("depression", "mental-health", "self-help", "mood-disorders")
          recommendations.primaryConcerns.push("Depression and Mood Issues")
          break
        case "trauma":
          recommendations.therapistSpecializations.push("Trauma Therapy", "PTSD Treatment", "EMDR Therapy")
          recommendations.bookCategories.push("trauma", "healing", "recovery", "ptsd")
          recommendations.primaryConcerns.push("Trauma and Recovery")
          break
        case "relationships":
          recommendations.therapistSpecializations.push(
            "Couples Therapy",
            "Relationship Counseling",
            "Communication Skills",
          )
          recommendations.bookCategories.push("relationships", "communication", "love", "couples")
          recommendations.primaryConcerns.push("Relationship Issues")
          break
        case "addiction":
          recommendations.therapistSpecializations.push("Addiction Counseling", "Substance Abuse Treatment")
          recommendations.bookCategories.push("addiction", "recovery", "sobriety", "substance-abuse")
          recommendations.primaryConcerns.push("Addiction and Substance Use")
          break
        case "family":
          recommendations.therapistSpecializations.push("Family Therapy", "Child Psychology", "Parenting Support")
          recommendations.bookCategories.push("family", "parenting", "child-development", "family-dynamics")
          recommendations.primaryConcerns.push("Family and Parenting")
          break
        case "career":
          recommendations.therapistSpecializations.push("Life Coaching", "Career Counseling", "Life Transitions")
          recommendations.bookCategories.push("career", "life-transitions", "personal-growth", "work-life-balance")
          recommendations.primaryConcerns.push("Career and Life Transitions")
          break
        case "stress":
          recommendations.therapistSpecializations.push(
            "Stress Management",
            "Mindfulness-Based Therapy",
            "Cognitive Behavioral Therapy",
          )
          recommendations.bookCategories.push("stress-management", "mindfulness", "relaxation", "coping-skills")
          recommendations.primaryConcerns.push("Stress Management")
          break
      }
    })

    // Determine urgency level based on overall severity
    const overallSeverity = scores.overall_severity / questions.length

    if (overallSeverity > 0.8) {
      recommendations.urgencyLevel = "urgent"
    } else if (overallSeverity > 0.6) {
      recommendations.urgencyLevel = "high"
    } else if (overallSeverity > 0.4) {
      recommendations.urgencyLevel = "medium"
    } else {
      recommendations.urgencyLevel = "low"
    }

    // Remove duplicates
    recommendations.therapistSpecializations = [...new Set(recommendations.therapistSpecializations)]
    recommendations.bookCategories = [...new Set(recommendations.bookCategories)]
    recommendations.primaryConcerns = [...new Set(recommendations.primaryConcerns)]

    return recommendations
  }

  const submitQuiz = async () => {
    if (!user) return

    setSubmitting(true)
    try {
      // Calculate scores and generate recommendations
      const scores = calculateScores()
      const recommendations = generateRecommendations(scores)

      // Save quiz data
      await addDoc(collection(db, "quizzes"), {
        clientId: user.id,
        responses,
        scores,
        recommendations,
        completedAt: new Date(),
        version: "dynamic-1.0",
      })

      // Also save detailed responses for analysis
      await addDoc(collection(db, "quizResponses"), {
        clientId: user.id,
        responses,
        rawScores: scores,
        processedRecommendations: recommendations,
        completedAt: new Date(),
        quizVersion: "dynamic-1.0",
      })

      onComplete()
    } catch (error: any) {
      setError(`Error submitting quiz: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessment questions...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No assessment questions available. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  const currentQ = questions[currentQuestion]
  const currentResponse = responses[currentQ.id]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  const renderQuestionInput = () => {
    switch (currentQ.type) {
      case "multiple-choice":
        return (
          <RadioGroup
            value={currentResponse}
            onValueChange={(value) => handleResponse(currentQ.id, value)}
            className="space-y-3"
          >
            {currentQ.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={option} id={`${currentQ.id}-${index}`} />
                <Label htmlFor={`${currentQ.id}-${index}`} className="cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "scale":
        return (
          <div className="space-y-6">
            <div className="px-4">
              <Slider
                value={[currentResponse || currentQ.scaleMin || 1]}
                onValueChange={(value) => handleResponse(currentQ.id, value[0])}
                min={currentQ.scaleMin || 1}
                max={currentQ.scaleMax || 10}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground px-4">
              <span>{currentQ.scaleLabels?.min}</span>
              <span className="font-medium text-lg text-primary">{currentResponse || currentQ.scaleMin || 1}</span>
              <span>{currentQ.scaleLabels?.max}</span>
            </div>
          </div>
        )

      case "text":
        return (
          <Textarea
            value={currentResponse || ""}
            onChange={(e) => handleResponse(currentQ.id, e.target.value)}
            placeholder="Please share your thoughts..."
            rows={4}
            className="w-full"
          />
        )

      default:
        return null
    }
  }

  const canProceed = currentResponse !== undefined && currentResponse !== ""

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2">Mental Health Assessment</CardTitle>
          <p className="text-muted-foreground mb-4">
            This assessment will help us understand your needs and match you with the right therapist and resources.
          </p>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Question */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-6">{currentQ.question}</h3>
          </div>

          {/* Question Input */}
          <div className="min-h-[200px]">{renderQuestionInput()}</div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Category: {currentQ.category}</span>
            </div>

            <Button onClick={nextQuestion} disabled={!canProceed || submitting} className="flex items-center space-x-2">
              {currentQuestion === questions.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{submitting ? "Submitting..." : "Complete Assessment"}</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
