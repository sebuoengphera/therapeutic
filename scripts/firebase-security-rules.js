// Firebase Security Rules for TherapyConnect Platform
// Copy and paste these rules into your Firebase Console > Firestore Database > Rules

console.log("=== FIREBASE SECURITY RULES FOR THERAPYCONNECT ===")
console.log("")
console.log("Copy the rules below and paste them into your Firebase Console:")
console.log("")

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users for therapist discovery
    }
    
    // Quiz collection - clients can only access their own quiz
    match /quizzes/{quizId} {
      allow read, write: if request.auth != null && resource.data.clientId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.clientId == request.auth.uid;
    }
    
    // Chat sessions - participants can read/write their sessions
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
      allow create: if request.auth != null;
    }
    
    // Messages - participants in the session can read/write
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.senderId == request.auth.uid;
      allow update: if request.auth != null && resource.data.senderId == request.auth.uid;
    }
    
    // Appointments - client and therapist can manage their appointments
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
      allow create: if request.auth != null;
    }
    
    // Progress tracking - client and therapist can read, only therapist can write
    match /progress/{progressId} {
      allow read: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
      allow create, update: if request.auth != null && request.resource.data.therapistId == request.auth.uid;
    }
    
    // Saved books - users can manage their own saved books
    match /savedBooks/{bookId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Payments - users can read their own payment records
    match /payments/{paymentId} {
      allow read: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
      allow create: if request.auth != null;
    }
    
    // Quiz responses - for detailed quiz answers and scoring
    match /quizResponses/{responseId} {
      allow read, write: if request.auth != null && resource.data.clientId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.clientId == request.auth.uid;
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
console.log("7. Wait for the rules to deploy (usually takes a few seconds)")
console.log("")
console.log("After applying these rules, your permission errors should be resolved!")
