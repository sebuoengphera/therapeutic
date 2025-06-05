// Simplified Firebase Security Rules for TherapyConnect Platform
// Copy and paste these rules into your Firebase Console > Firestore Database > Rules

console.log("=== SIMPLIFIED FIREBASE SECURITY RULES FOR THERAPYCONNECT ===")
console.log("")
console.log("Copy the rules below and paste them into your Firebase Console:")
console.log("")

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users to read and write to all collections
    // This is a permissive rule to ensure the app works without permission issues
    match /{document=**} {
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
console.log("5. Replace ALL existing rules with the simple rules above")
console.log("6. Click 'Publish'")
console.log("")
console.log("IMPORTANT: These are simplified rules that allow all authenticated users")
console.log("to read and write to all collections. This will fix permission errors.")
console.log("")
console.log("After applying these rules, your app should work without permission errors!")
