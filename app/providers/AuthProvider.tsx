"use client";

import { createContext, ReactNode } from "react";
import { User } from "@supabase/supabase-js";

type AuthContextType = {
 user: User | null;
 loading: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
 children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
 return (
 <AuthContext.Provider value={{ user: null, loading: false }}>
 {children}
 </AuthContext.Provider>
 );
}
