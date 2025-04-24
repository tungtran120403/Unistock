import { createContext, useContext, useState, useEffect } from "react";
import { getUser, isAuthenticated, logout } from "../features/auth/login/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = getUser();
    console.log("🔍 Init: User from localStorage", storedUser);
    return storedUser || null;
  });

  const [isAuth, setIsAuth] = useState(() => isAuthenticated());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    console.log("🔍 Reload: User from localStorage after reload", storedUser);

    if (storedUser && isAuthenticated()) {
      setUser(storedUser);
      setIsAuth(true);
    } else {
      setUser(null);
      setIsAuth(false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      console.log("✅ Saving user to localStorage:", user);
      localStorage.setItem("user", JSON.stringify(user));
    }
    // else {
    //   console.log("⚠️ Removing user from localStorage");
    //   localStorage.removeItem("user");
    // }
  }, [user]);

  const handleLogout = () => {
    console.log("🚨 Logout function called! Xóa user khỏi localStorage!");
    logout();
    setUser(null);
    setIsAuth(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider
      value={{ user, isAuth, setUser, setIsAuth, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

