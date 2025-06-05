import { initializeApp } from "firebase/app"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyApx3LCKOYYbLH0Tpqa1hrPAeQnIGw5v_c",
  authDomain: "project-ecb50.firebaseapp.com",
  projectId: "project-ecb50",
  storageBucket: "project-ecb50.firebasestorage.app",
  messagingSenderId: "1086748097893",
  appId: "1:1086748097893:web:eae9523811fa82248ff58c",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Enable offline persistence when possible
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.")
    } else if (err.code === "unimplemented") {
      console.log("The current browser does not support all of the features required to enable persistence")
    }
  })
}

export default app
