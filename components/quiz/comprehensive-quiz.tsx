"use client"

import { useState } from "react"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { quizQuestions, calculateQuizScore, generateRecommendations } from "@/lib/quiz-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"

interface ComprehensiveQuizProps {
  onComplete: () => void
}

export function ComprehensiveQuiz({ onComplete }: ComprehensiveQuizProps) {
  const { user } = useAuth()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const handleResponse = (questionId: string, answer: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: answer }))
  }

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
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

  const submitQuiz = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Calculate scores and generate recommendations
      const scores = calculateQuizScore(responses)
      const recommendations = generateRecommendations(scores, responses)

      // Save comprehensive quiz data
      await addDoc(collection(db, "quizzes"), {
        clientId: user.id,
        responses,
        scores,
        recommendations,
        completedAt: new Date(),
        version: "1.0",
      })

      // Also save detailed responses for analysis
      await addDoc(collection(db, "quizResponses"), {
        clientId: user.id,
        responses,
        rawScores: scores,
        processedRecommendations: recommendations,
        completedAt: new Date(),
        quizVersion: "comprehensive-v1.0",
      })

      onComplete()
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentQ = quizQuestions[currentQuestion]
  const currentResponse = responses[currentQ.id]
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

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
            This comprehensive assessment will help us understand your needs and match you with the right therapist and
            resources.
          </p>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestion + 1} of {quizQuestions.length}
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
              <span>•</span>
              <span>Weight: {currentQ.weight}</span>
            </div>

            <Button onClick={nextQuestion} disabled={!canProceed || loading} className="flex items-center space-x-2">
              {currentQuestion === quizQuestions.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{loading ? "Submitting..." : "Complete Assessment"}</span>
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

      {/* Quiz Information */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <h4 className="font-semibold text-lg">Comprehensive</h4>
              <p className="text-sm text-muted-foreground">
                12 detailed questions covering all aspects of mental health
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">Personalized</h4>
              <p className="text-sm text-muted-foreground">Results tailored to your specific needs and concerns</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg">Secure</h4>
              <p className="text-sm text-muted-foreground">Your responses are confidential and encrypted</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
