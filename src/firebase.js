import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBHLShPYOP_rfRHGa_j4uFaXbIQflWXUXU",
  authDomain: "miniprojectpsj.firebaseapp.com",
  databaseURL: "https://miniprojectpsj-default-rtdb.firebaseio.com",
  projectId: "miniprojectpsj",
  storageBucket: "miniprojectpsj.firebasestorage.app",
  messagingSenderId: "451391621088",
  appId: "1:451391621088:web:0fde9f1c9c365604c7cd85",
  measurementId: "G-7QTGFK8T4C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);

// Secondary app to create users without logging out the current super admin
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export { auth, rtdb, secondaryAuth };
