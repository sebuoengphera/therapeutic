// Script to seed sample data including therapist with provided image

console.log("=== SEEDING SAMPLE DATA ===")
console.log("")

// Sample therapist data including Sebuoeng Phera with the provided image
const sampleTherapists = [
  {
    name: "Sebuoeng Phera",
    email: "sebuoeng.phera@example.com",
    password: "password123",
    role: "therapist",
    specialization: "Anxiety Disorders, Depression, Trauma Therapy",
    bio: "I am a compassionate and experienced therapist specializing in anxiety, depression, and trauma recovery. My approach combines evidence-based techniques with cultural sensitivity to provide personalized care for each client.",
    licenseNumber: "PSY-2024-001",
    yearsExperience: 7,
    profileImage: "/images/therapist-sebuoeng.jpg", // Using the provided image
    approaches: "Cognitive Behavioral Therapy (CBT), Trauma-Focused CBT, Mindfulness-Based Therapy",
    education: "M.A. in Clinical Psychology, University of the Witwatersrand",
    certifications: "Licensed Clinical Psychologist, Trauma-Informed Care Specialist",
    languages: "English, Sesotho, Zulu",
    treatmentFocus:
      "I help clients overcome anxiety, depression, and trauma through culturally-sensitive, evidence-based approaches.",
    isVerified: true,
  },
  {
    name: "Dr. Thabo Mthembu",
    email: "thabo.mthembu@example.com",
    password: "password123",
    role: "therapist",
    specialization: "Couples Therapy, Family Counseling, Relationship Issues",
    bio: "With over 10 years of experience, I help couples and families strengthen their relationships and improve communication.",
    licenseNumber: "MFT-2024-002",
    yearsExperience: 10,
    approaches: "Emotionally Focused Therapy, Family Systems Therapy, Gottman Method",
    education: "Ph.D. in Marriage and Family Therapy, University of Cape Town",
    certifications: "Licensed Marriage and Family Therapist, EFT Certified",
    languages: "English, Zulu, Xhosa",
    treatmentFocus: "Helping couples rebuild trust and families improve their dynamics.",
    isVerified: true,
  },
  {
    name: "Dr. Nomsa Dlamini",
    email: "nomsa.dlamini@example.com",
    password: "password123",
    role: "therapist",
    specialization: "Child Psychology, Adolescent Therapy, ADHD",
    bio: "I specialize in working with children and adolescents, helping them navigate developmental challenges and mental health concerns.",
    licenseNumber: "CP-2024-003",
    yearsExperience: 8,
    approaches: "Play Therapy, Cognitive Behavioral Therapy, Family Therapy",
    education: "M.A. in Child Psychology, Stellenbosch University",
    certifications: "Licensed Child Psychologist, Play Therapy Certified",
    languages: "English, Afrikaans, Zulu",
    treatmentFocus: "Supporting children and teens through developmental and emotional challenges.",
    isVerified: true,
  },
]

// Sample books for the library
const sampleBooks = [
  {
    title: "Understanding Anxiety in South African Context",
    author: "Dr. Sarah Mokwena",
    description:
      "A comprehensive guide to understanding and managing anxiety with cultural considerations for South African communities.",
    category: "anxiety",
    coverImage: "/placeholder.svg?height=200&width=150",
    url: "https://example.com/anxiety-sa",
    downloadUrl: "https://example.com/download/anxiety-sa.pdf",
  },
  {
    title: "Ubuntu and Mental Health",
    author: "Prof. Mandla Ngcobo",
    description: "Exploring traditional African philosophies and their application in modern mental health practices.",
    category: "cultural",
    coverImage: "/placeholder.svg?height=200&width=150",
    url: "https://example.com/ubuntu-mental-health",
    downloadUrl: "https://example.com/download/ubuntu-mental-health.pdf",
  },
  {
    title: "Trauma Recovery in Post-Apartheid South Africa",
    author: "Dr. Lindiwe Sibeko",
    description: "Understanding and healing from historical and personal trauma in the South African context.",
    category: "trauma",
    coverImage: "/placeholder.svg?height=200&width=150",
    url: "https://example.com/trauma-recovery-sa",
    downloadUrl: "https://example.com/download/trauma-recovery-sa.pdf",
  },
  {
    title: "Family Dynamics in African Communities",
    author: "Dr. Sipho Radebe",
    description: "Exploring family structures, relationships, and therapeutic approaches in African communities.",
    category: "family",
    coverImage: "/placeholder.svg?height=200&width=150",
    url: "https://example.com/family-dynamics",
    downloadUrl: "https://example.com/download/family-dynamics.pdf",
  },
  {
    title: "Depression and Hope: A South African Perspective",
    author: "Dr. Zanele Khumalo",
    description: "Understanding depression and finding pathways to healing within South African cultural contexts.",
    category: "depression",
    coverImage: "/placeholder.svg?height=200&width=150",
    url: "https://example.com/depression-hope",
    downloadUrl: "https://example.com/download/depression-hope.pdf",
  },
  {
    title: "Mindfulness and Traditional Healing",
    author: "Dr. Mpho Setlhare",
    description: "Integrating mindfulness practices with traditional African healing approaches.",
    category: "mindfulness",
    coverImage: "/placeholder.svg?height=200&width=150",
    url: "https://example.com/mindfulness-traditional",
    downloadUrl: "https://example.com/download/mindfulness-traditional.pdf",
  },
]

console.log("SAMPLE THERAPISTS TO CREATE:")
console.log("=============================")
sampleTherapists.forEach((therapist, index) => {
  console.log(`${index + 1}. ${therapist.name}`)
  console.log(`   Email: ${therapist.email}`)
  console.log(`   Specialization: ${therapist.specialization}`)
  console.log(`   License: ${therapist.licenseNumber}`)
  console.log(`   Experience: ${therapist.yearsExperience} years`)
  console.log(`   Profile Image: ${therapist.profileImage || "Default"}`)
  console.log(`   Bio: ${therapist.bio.substring(0, 100)}...`)
  console.log("")
})

console.log("SAMPLE BOOKS FOR LIBRARY:")
console.log("=========================")
sampleBooks.forEach((book, index) => {
  console.log(`${index + 1}. ${book.title}`)
  console.log(`   Author: ${book.author}`)
  console.log(`   Category: ${book.category}`)
  console.log(`   Description: ${book.description.substring(0, 80)}...`)
  console.log("")
})

console.log("IMPLEMENTATION STEPS:")
console.log("====================")
console.log("1. Register therapist accounts using the data above")
console.log("2. The image for Sebuoeng Phera is already included in the project")
console.log("3. Books will be automatically seeded when first accessing the dashboard")
console.log("4. All chat messages are now saved to the database in real-time")
console.log("5. Only real chat sessions (with actual messages) will appear")
console.log("6. Clients must complete quiz immediately after login")
console.log("7. Library books appear on dashboard and are stored in database")
console.log("")

console.log("FEATURES IMPLEMENTED:")
console.log("====================")
console.log("✓ Real chat sessions only (no mock data)")
console.log("✓ Therapists see only clients who have messaged them")
console.log("✓ All messages saved to database with real-time updates")
console.log("✓ Library books displayed on dashboard")
console.log("✓ Books stored in database (auto-seeded)")
console.log("✓ Quiz required immediately after client login")
console.log("✓ Profile image for Sebuoeng Phera included")
console.log("✓ Duplicate session prevention")
console.log("✓ Payment system (R260 for 7 days)")
console.log("")

console.log("Ready to test the complete system!")
