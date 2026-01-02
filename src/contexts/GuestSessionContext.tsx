import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GuestReservation {
  id: string;
  reservation_number: string;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  full_name: string;
  status: string;
  deposit_amount: number;
  deposit_status: string;
  table_id: string | null;
}

interface GuestSessionContextType {
  guestReservation: GuestReservation | null;
  setGuestReservation: (reservation: GuestReservation | null) => void;
  isGuestLoggedIn: boolean;
  logout: () => void;
}

const GuestSessionContext = createContext<GuestSessionContextType | undefined>(undefined);

const STORAGE_KEY = 'guest_session';

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const [guestReservation, setGuestReservationState] = useState<GuestReservation | null>(() => {
    // Try to restore from sessionStorage
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setGuestReservation = (reservation: GuestReservation | null) => {
    setGuestReservationState(reservation);
    if (reservation) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reservation));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const logout = () => {
    setGuestReservation(null);
  };

  return (
    <GuestSessionContext.Provider
      value={{
        guestReservation,
        setGuestReservation,
        isGuestLoggedIn: !!guestReservation,
        logout,
      }}
    >
      {children}
    </GuestSessionContext.Provider>
  );
}

export function useGuestSession() {
  const context = useContext(GuestSessionContext);
  if (context === undefined) {
    throw new Error('useGuestSession must be used within a GuestSessionProvider');
  }
  return context;
}
