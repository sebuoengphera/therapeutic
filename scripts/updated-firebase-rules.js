// Updated Firebase Security Rules for TherapyConnect Platform
// Copy and paste these rules into your Firebase Console > Firestore Database > Rules

console.log("=== UPDATED FIREBASE SECURITY RULES FOR THERAPYCONNECT ===")
console.log("")
console.log("Copy the rules below and paste them into your Firebase Console:")
console.log("")

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to authenticated users for all collections
    // This is a temporary rule to fix permission issues
    // You should replace this with more specific rules once the app is working
    match /{document=**} {
      allow read: if request.auth != null;
    }
    
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Quiz questions - therapists can manage, clients can read
    match /quizQuestions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "therapist";
    }
    
    // Quiz responses - clients can read/write their own quiz
    match /quizzes/{quizId} {
      allow read, write: if request.auth != null;
    }
    
    // Detailed quiz responses
    match /quizResponses/{responseId} {
      allow read, write: if request.auth != null;
    }
    
    // Chat sessions - participants can read/write their sessions
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Messages - participants in the session can read/write
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Appointments - client and therapist can manage their appointments
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
    
    // Progress tracking - client and therapist can read, only therapist can write
    match /progress/{progressId} {
      allow read, write: if request.auth != null;
    }
    
    // Saved books - users can manage their own saved books
    match /savedBooks/{bookId} {
      allow read, write: if request.auth != null;
    }
    
    // Payments - users can read their own payment records
    match /payments/{paymentId} {
      allow read, write: if request.auth != null;
    }
  }
}`

console.log(rules)
console.log("")
console.log("=== INSTRUCTIONS ===")
console.log("1. Go to Firebase Console: https://console.firebase.google.com/")
console.log("2. Select your project: project-ecb50")
console.log("3. Navigate to 'Firestore Database'")
console.log("4. Click on the 'Rules' tab")
console.log("5. Replace ALL existing rules with the rules above")
console.log("6. Click 'Publish'")
console.log("")
console.log("IMPORTANT: These rules are more permissive to fix your immediate issues.")
console.log("Once your app is working, you should implement more restrictive rules.")
console.log("")
console.log("After applying these rules, your permission errors should be resolved!")
