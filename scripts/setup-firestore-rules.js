// This script demonstrates the Firebase security rules you should set up
// to fix the permissions error

console.log("Firebase Security Rules to implement:")
console.log(`
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat sessions rules
    match /chatSessions/{sessionId} {
      allow read: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
    }
    
    // Messages rules
    match /messages/{messageId} {
      allow read: if request.auth != null && get(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)).data.clientId == request.auth.uid || 
                                             get(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)).data.therapistId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.senderId == request.auth.uid;
    }
    
    // Appointments rules
    match /appointments/{appointmentId} {
      allow read: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
      allow create: if request.auth != null && (
        request.resource.data.clientId == request.auth.uid || 
        request.resource.data.therapistId == request.auth.uid
      );
      allow update: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
    }
    
    // Progress tracking rules
    match /progress/{progressId} {
      allow read: if request.auth != null && (
        resource.data.clientId == request.auth.uid || 
        resource.data.therapistId == request.auth.uid
      );
      allow create: if request.auth != null && (
        request.resource.data.therapistId == request.auth.uid
      );
    }
    
    // Quiz rules
    match /quizzes/{quizId} {
      allow read: if request.auth != null && resource.data.clientId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.clientId == request.auth.uid;
    }
    
    // Saved books rules
    match /savedBooks/{bookId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
`)

console.log("\nTo implement these rules:")
console.log("1. Go to the Firebase Console: https://console.firebase.google.com/")
console.log("2. Select your project")
console.log("3. Navigate to Firestore Database")
console.log("4. Click on the 'Rules' tab")
console.log("5. Replace the existing rules with the ones above")
console.log("6. Click 'Publish'")
