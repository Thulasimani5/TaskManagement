import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("pp_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("pp_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("pp_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        // If token invalid, clear it
        setUser(null);
        setToken(null);
        localStorage.removeItem("pp_user");
        localStorage.removeItem("pp_token");
      });
  }, [token]);

  const handleAuthSuccess = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("pp_user", JSON.stringify(data.user));
    localStorage.setItem("pp_token", data.token);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      handleAuthSuccess(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || "Login failed"
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      handleAuthSuccess(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.message || "Registration failed"
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pp_user");
    localStorage.removeItem("pp_token");
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

