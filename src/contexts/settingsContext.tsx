import React, { createContext, useState, useContext, ReactNode } from "react";


interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "analyst";
  status: "active" | "inactive";
  lastLogin: string;
}

interface Integration {
  id: number;
  name: string;
  type: string;
  status: "connected" | "disconnected";
  description: string;
}

interface SettingsContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  userProfile: User | null;
  setUserProfile: (profile: User) => void;
  integrations: Integration[];
  addIntegration: (integration: Integration) => void;
  removeIntegration: (integrationId: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userProfile, setUserProfileState] = useState<User | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === "light" ? "dark" : "light"));
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const setUserProfile = (profile: User) => {
    setUserProfileState(profile);
  };

  const addIntegration = (integration: Integration) => {
    setIntegrations(prev => [...prev, integration]);
  };

  const removeIntegration = (integrationId: number) => {
    setIntegrations(prev => prev.filter(int => int.id !== integrationId));
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        toggleTheme,
        notificationsEnabled,
        toggleNotifications,
        userProfile,
        setUserProfile,
        integrations,
        addIntegration,
        removeIntegration,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
