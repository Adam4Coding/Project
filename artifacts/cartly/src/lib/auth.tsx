import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import type { UserProfile, VendorSummary } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  vendorProfile: VendorSummary | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: UserProfile, vendorProfile?: VendorSummary) => void;
  logout: () => void;
  updateVendorProfile: (profile: VendorSummary) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    vendorProfile: undefined,
    isAuthenticated: false,
    isLoading: true, // starts loading until we figure out if we have a session (in a real app, we'd check cookies/localstorage, but here it's in memory. Wait, instructions say: JWT token stored in React Context ONLY. So it's lost on refresh. Okay.)
  });

  useEffect(() => {
    // Since token is context only, we just set loading to false immediately.
    setState(s => ({ ...s, isLoading: false }));
    
    // Configure the api-client to use our token
    setAuthTokenGetter(() => {
      // In a real app we'd use a ref or something to get the latest token, 
      // but here we can just return the token from state if it's accessible, 
      // wait, `setAuthTokenGetter` takes a function. We need a ref to the latest token.
      return currentToken;
    });
  }, []);

  // Use a global variable or ref to keep the token available to the getter
  useEffect(() => {
    currentToken = state.token;
  }, [state.token]);

  const login = (token: string, user: UserProfile, vendorProfile?: VendorSummary) => {
    setState({
      user,
      token,
      vendorProfile,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    setState({
      user: null,
      token: null,
      vendorProfile: undefined,
      isAuthenticated: false,
      isLoading: false,
    });
    setLocation("/");
  };

  const updateVendorProfile = (profile: VendorSummary) => {
    setState(s => ({
      ...s,
      vendorProfile: profile,
    }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateVendorProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

let currentToken: string | null = null;

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
