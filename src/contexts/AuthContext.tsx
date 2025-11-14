import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  username: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, email: string, roles: string[]) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = "/api";

/** Safely decode a JWT payload (handles url-safe base64) */
function safeDecodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let payload = parts[1];
    // convert from base64url to base64
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    // pad with '='
    while (payload.length % 4) payload += "=";
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // if storedUser is corrupted, try to decode from token
          const payload = safeDecodeJwtPayload(storedToken);
          if (payload) {
            setUser({
              username: payload.sub || "",
              email: payload.email || "",
              roles: Array.isArray(payload.roles) ? payload.roles : [],
            });
          } else {
            setUser(null);
          }
        }
      } else {
        // derive user from token if possible
        const payload = safeDecodeJwtPayload(storedToken);
        if (payload) {
          setUser({
            username: payload.sub || "",
            email: payload.email || "",
            roles: Array.isArray(payload.roles) ? payload.roles : [],
          });
        }
      }
    }
  }, []);

  const signup = async (username: string, password: string, email: string, roles: string[]) => {
    try {
      const res = await fetch(`${BASE_URL}/public/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, roles }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Signup failed (${res.status})`);
      }
    } catch (err: any) {
      throw new Error(err?.message || "Signup failed");
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/public/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Login failed (${res.status})`);
      }

      const data = await res.json().catch(() => ({}));
      const jwtToken: unknown = data?.token ?? null;
      const rolesFromResponse: string[] = Array.isArray(data?.roles) ? data.roles : [];

      if (!jwtToken || typeof jwtToken !== "string") {
        throw new Error("No token received from server");
      }

      // decode jwt payload safely (optional)
      const payload = safeDecodeJwtPayload(jwtToken as string) || {};

      const userData: User = {
        username: payload.sub || username,
        email: payload.email || "",
        roles: rolesFromResponse.length ? rolesFromResponse : (Array.isArray(payload.roles) ? payload.roles : []),
      };

      setToken(jwtToken as string);
      setUser(userData);

      localStorage.setItem("token", jwtToken as string);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err: any) {
      throw new Error(err?.message || "Login failed");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
