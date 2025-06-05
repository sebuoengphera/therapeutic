"use client"

import { useState } from "react"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const questions = [
  {
    id: "main_concern",
    question: "What is your main area of concern?",
    options: [
      { value: "anxiety", label: "Anxiety and Stress" },
      { value: "depression", label: "Depression and Mood" },
      { value: "relationships", label: "Relationship Issues" },
      { value: "trauma", label: "Trauma and PTSD" },
      { value: "addiction", label: "Addiction and Substance Abuse" },
      { value: "family", label: "Family and Parenting" },
      { value: "career", label: "Career and Life Transitions" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "severity",
    question: "How would you rate the severity of your concerns?",
    options: [
      { value: "mild", label: "Mild - Occasional difficulties" },
      { value: "moderate", label: "Moderate - Regular impact on daily life" },
      { value: "severe", label: "Severe - Significant impact on functioning" },
    ],
  },
  {
    id: "therapy_experience",
    question: "Have you had therapy before?",
    options: [
      { value: "never", label: "Never had therapy" },
      { value: "some", label: "Some experience with therapy" },
      { value: "extensive", label: "Extensive therapy experience" },
    ],
  },
  {
    id: "preferred_approach",
    question: "What type of therapeutic approach interests you most?",
    options: [
      { value: "cbt", label: "Cognitive Behavioral Therapy (CBT)" },
      { value: "psychodynamic", label: "Psychodynamic Therapy" },
      { value: "humanistic", label: "Humanistic/Person-Centered" },
      { value: "family", label: "Family/Couples Therapy" },
      { value: "unsure", label: "Not sure" },
    ],
  },
]

interface InitialQuizProps {
  onComplete: () => void
}

export function InitialQuiz({ onComplete }: InitialQuizProps) {
  const { user } = useAuth()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Generate recommendations based on answers
      const recommendations = generateRecommendations(answers)

      await addDoc(collection(db, "quizzes"), {
        clientId: user.id,
        answers,
        recommendations,
        completedAt: new Date(),
      })

      onComplete()
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = (answers: Record<string, string>) => {
    const therapistSpecializations: string[] = []
    const bookCategories: string[] = []

    // Map answers to specializations and book categories
    switch (answers.main_concern) {
      case "anxiety":
        therapistSpecializations.push("Anxiety Disorders", "Cognitive Behavioral Therapy")
        bookCategories.push("anxiety", "mindfulness", "stress-management")
        break
      case "depression":
        therapistSpecializations.push("Depression", "Mood Disorders")
        bookCategories.push("depression", "mental-health", "self-help")
        break
      case "relationships":
        therapistSpecializations.push("Couples Therapy", "Relationship Counseling")
        bookCategories.push("relationships", "communication", "love")
        break
      case "trauma":
        therapistSpecializations.push("Trauma Therapy", "PTSD Treatment")
        bookCategories.push("trauma", "healing", "recovery")
        break
      case "addiction":
        therapistSpecializations.push("Addiction Counseling", "Substance Abuse")
        bookCategories.push("addiction", "recovery", "sobriety")
        break
      case "family":
        therapistSpecializations.push("Family Therapy", "Child Psychology")
        bookCategories.push("family", "parenting", "child-development")
        break
      case "career":
        therapistSpecializations.push("Life Coaching", "Career Counseling")
        bookCategories.push("career", "life-transitions", "personal-growth")
        break
    }

    return { therapistSpecializations, bookCategories }
  }

  const currentQ = questions[currentQuestion]
  const currentAnswer = answers[currentQ.id]

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          Initial Assessment ({currentQuestion + 1} of {questions.length})
        </CardTitle>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <h3 className="text-lg font-medium">{currentQ.question}</h3>

        <RadioGroup value={currentAnswer} onValueChange={(value) => handleAnswer(currentQ.id, value)}>
          {currentQ.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => prev - 1)}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <Button onClick={nextQuestion} disabled={!currentAnswer || loading}>
            {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
