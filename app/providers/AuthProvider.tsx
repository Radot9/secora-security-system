"use client";

import { createContext, ReactNode, useState } from "react";
import { User } from "@supabase/supabase-js";

type AuthContextType = {};

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}
