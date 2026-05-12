import { createContext, useContext, useEffect, useState } from 'react';
import { auth, rtdb } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user role from Realtime Database
        try {
          const userRef = ref(rtdb, 'admins/' + user.uid);
          const userSnap = await get(userRef);
          
          if (userSnap.exists()) {
            setUserRole(userSnap.val().role);
          } else {
            // Bootstrap: If no admins exist yet, make this user the first super admin
            const allAdminsSnap = await get(ref(rtdb, 'admins'));
            if (!allAdminsSnap.exists() || allAdminsSnap.size === 0) {
              await set(userRef, { role: 'super_admin', email: user.email || 'admin@admin.com' });
              setUserRole('super_admin');
              return;
            }

            alert(`Debug: No document found in the 'admins' node for UID: ${user.uid}\n\nPlease make sure the Realtime Database has this UID under the 'admins' node.`);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          alert(`Debug Error: Could not read from Realtime Database.\n\nReason: ${error.message}`);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userRole,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
