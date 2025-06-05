export interface QuizQuestion {
  id: string
  question: string
  type: "multiple-choice" | "scale" | "text"
  options?: string[]
  scaleMin?: number
  scaleMax?: number
  scaleLabels?: { min: string; max: string }
  category: string
  weight: number
}

export const quizQuestions: QuizQuestion[] = [
  // Mental Health Assessment
  {
    id: "anxiety_level",
    question: "How often do you feel anxious or worried?",
    type: "multiple-choice",
    options: [
      "Never or rarely",
      "Sometimes (1-2 times per week)",
      "Often (3-4 times per week)",
      "Very often (daily)",
      "Almost constantly",
    ],
    category: "anxiety",
    weight: 3,
  },
  {
    id: "depression_symptoms",
    question: "How often do you feel sad, hopeless, or lose interest in activities?",
    type: "multiple-choice",
    options: [
      "Never or rarely",
      "Sometimes (1-2 times per week)",
      "Often (3-4 times per week)",
      "Very often (daily)",
      "Almost constantly",
    ],
    category: "depression",
    weight: 3,
  },
  {
    id: "sleep_quality",
    question: "How would you rate your sleep quality?",
    type: "scale",
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: { min: "Very Poor", max: "Excellent" },
    category: "general",
    weight: 2,
  },
  {
    id: "stress_level",
    question: "On a scale of 1-10, how stressed do you feel in your daily life?",
    type: "scale",
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: { min: "Not Stressed", max: "Extremely Stressed" },
    category: "stress",
    weight: 3,
  },
  {
    id: "relationship_satisfaction",
    question: "How satisfied are you with your current relationships?",
    type: "scale",
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: { min: "Very Unsatisfied", max: "Very Satisfied" },
    category: "relationships",
    weight: 2,
  },
  {
    id: "trauma_history",
    question: "Have you experienced any traumatic events that still affect you?",
    type: "multiple-choice",
    options: [
      "No traumatic experiences",
      "Minor traumatic experiences, minimal impact",
      "Moderate traumatic experiences, some impact",
      "Significant traumatic experiences, major impact",
      "Severe traumatic experiences, overwhelming impact",
    ],
    category: "trauma",
    weight: 3,
  },
  {
    id: "substance_use",
    question: "How often do you use alcohol or other substances to cope with problems?",
    type: "multiple-choice",
    options: [
      "Never",
      "Rarely (once a month or less)",
      "Sometimes (2-3 times per month)",
      "Often (weekly)",
      "Very often (daily or almost daily)",
    ],
    category: "addiction",
    weight: 2,
  },
  {
    id: "family_issues",
    question: "Are you currently experiencing significant family or parenting challenges?",
    type: "multiple-choice",
    options: [
      "No significant challenges",
      "Minor challenges, manageable",
      "Moderate challenges, some difficulty",
      "Major challenges, significant difficulty",
      "Severe challenges, overwhelming",
    ],
    category: "family",
    weight: 2,
  },
  {
    id: "work_life_balance",
    question: "How satisfied are you with your work-life balance and career?",
    type: "scale",
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: { min: "Very Unsatisfied", max: "Very Satisfied" },
    category: "career",
    weight: 2,
  },
  {
    id: "therapy_goals",
    question: "What is your primary goal for therapy?",
    type: "multiple-choice",
    options: [
      "Reduce anxiety and stress",
      "Overcome depression and improve mood",
      "Improve relationships and communication",
      "Process trauma and heal from past experiences",
      "Address addiction or substance use",
      "Improve family dynamics and parenting",
      "Navigate career changes and life transitions",
      "General personal growth and self-improvement",
    ],
    category: "goals",
    weight: 3,
  },
  {
    id: "therapy_preference",
    question: "What type of therapy approach appeals to you most?",
    type: "multiple-choice",
    options: [
      "Cognitive Behavioral Therapy (CBT) - practical, solution-focused",
      "Psychodynamic Therapy - exploring unconscious patterns",
      "Humanistic Therapy - person-centered, empathetic approach",
      "Family/Couples Therapy - relationship-focused",
      "Trauma-Informed Therapy - specialized trauma treatment",
      "I'm not sure, I'd like guidance",
    ],
    category: "preferences",
    weight: 2,
  },
  {
    id: "severity_impact",
    question: "How much do your mental health concerns impact your daily functioning?",
    type: "multiple-choice",
    options: [
      "Minimal impact - I function well most of the time",
      "Mild impact - Some difficulties but manageable",
      "Moderate impact - Regular interference with daily activities",
      "Significant impact - Major difficulties with work/relationships",
      "Severe impact - Unable to function normally most days",
    ],
    category: "severity",
    weight: 3,
  },
]

export const calculateQuizScore = (responses: Record<string, any>) => {
  const scores = {
    anxiety: 0,
    depression: 0,
    trauma: 0,
    relationships: 0,
    addiction: 0,
    family: 0,
    career: 0,
    stress: 0,
    overall_severity: 0,
  }

  // Calculate category scores based on responses
  Object.entries(responses).forEach(([questionId, answer]) => {
    const question = quizQuestions.find((q) => q.id === questionId)
    if (!question) return

    let score = 0

    if (question.type === "multiple-choice") {
      const optionIndex = question.options?.indexOf(answer) ?? 0
      score = (optionIndex / (question.options?.length ?? 1)) * question.weight
    } else if (question.type === "scale") {
      const normalizedScore =
        (answer - (question.scaleMin ?? 1)) / ((question.scaleMax ?? 10) - (question.scaleMin ?? 1))
      score = normalizedScore * question.weight
    }

    // Map to appropriate category
    switch (question.category) {
      case "anxiety":
        scores.anxiety += score
        break
      case "depression":
        scores.depression += score
        break
      case "trauma":
        scores.trauma += score
        break
      case "relationships":
        scores.relationships += score
        break
      case "addiction":
        scores.addiction += score
        break
      case "family":
        scores.family += score
        break
      case "career":
        scores.career += score
        break
      case "stress":
        scores.stress += score
        break
      case "severity":
        scores.overall_severity += score
        break
    }
  })

  return scores
}

export const generateRecommendations = (scores: any, responses: Record<string, any>) => {
  const recommendations = {
    therapistSpecializations: [] as string[],
    bookCategories: [] as string[],
    urgencyLevel: "low" as "low" | "medium" | "high" | "urgent",
    primaryConcerns: [] as string[],
  }

  // Determine primary concerns based on highest scores
  const sortedScores = Object.entries(scores)
    .filter(([key]) => key !== "overall_severity")
    .sort(([, a], [, b]) => (b as number) - (a as number))

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

  // Determine urgency level based on overall severity and specific responses
  const severityResponse = responses.severity_impact
  const overallSeverity = scores.overall_severity

  if (severityResponse === "Severe impact - Unable to function normally most days" || overallSeverity > 2.5) {
    recommendations.urgencyLevel = "urgent"
  } else if (
    severityResponse === "Significant impact - Major difficulties with work/relationships" ||
    overallSeverity > 2
  ) {
    recommendations.urgencyLevel = "high"
  } else if (overallSeverity > 1.5) {
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
