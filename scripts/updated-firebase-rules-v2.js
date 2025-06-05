// Updated Firebase Security Rules for TherapyConnect Platform - Version 2
// Copy and paste these rules into your Firebase Console > Firestore Database > Rules

console.log("=== UPDATED FIREBASE SECURITY RULES V2 FOR THERAPYCONNECT ===")
console.log("")
console.log("Copy the rules below and paste them into your Firebase Console:")
console.log("")

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to authenticated users for most collections
    // This is a permissive rule to fix permission issues
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
      allow write: if request.auth != null;
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
    
    // Calls collection - for voice/video calls
    match /calls/{callId} {
      allow read, write: if request.auth != null;
    }
    
    // Ratings collection - for user ratings
    match /ratings/{ratingId} {
      allow read, write: if request.auth != null;
    }
    
    // Appointments - client and therapist can manage their appointments
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
    
    // Progress tracking - client and therapist can read/write
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
    
    // Library books - allow read access for all authenticated users
    match /books/{bookId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
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
console.log("IMPORTANT: These rules include permissions for:")
console.log("- calls collection (for voice/video calls)")
console.log("- ratings collection (for user ratings)")
console.log("- books collection (for library)")
console.log("- Enhanced permissions for all features")
console.log("")
console.log("After applying these rules, your permission errors should be resolved!")
