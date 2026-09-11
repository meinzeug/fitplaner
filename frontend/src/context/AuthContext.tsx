import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  FamilyMember,
  FamilyHousehold,
  HouseholdStatus,
  LoginResponse,
  PublicMemberInfo,
} from '../types';
import {
  fetchHouseholdStatus,
  createHouseholdApi,
  joinHouseholdApi,
  loginApi,
  fetchMeApi,
  logoutApi,
  fetchPublicMembersApi,
  getActiveMember,
  setActiveMember,
  getAuthToken,
  setAuthToken,
  getHouseholdPasskey,
  setHouseholdPasskey,
} from '../api/client';
import { performBidirectionalSync } from '../api/syncManager';

interface AuthContextType {
  currentMember: FamilyMember | null;
  household: FamilyHousehold | null;
  householdStatus: HouseholdStatus | null;
  publicMembers: PublicMemberInfo[];
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isKid: boolean;
  isLoading: boolean;
  login: (username: string, password?: string, pin?: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  createHousehold: (payload: {
    family_name: string;
    admin_name: string;
    username: string;
    password: string;
    pin?: string;
    device_id: string;
    device_name: string;
    demographics?: any;
  }) => Promise<any>;
  joinHousehold: (payload: {
    household_passkey: string;
    username: string;
    password?: string;
    pin?: string;
    device_id: string;
    device_name: string;
  }) => Promise<any>;
  switchMember: (member: FamilyMember) => void;
  refreshAuth: () => Promise<void>;
  refreshHouseholdStatus: () => Promise<HouseholdStatus | null>;
  refreshPublicMembers: () => Promise<PublicMemberInfo[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMember, setCurrentMemberState] = useState<FamilyMember | null>(() => getActiveMember());
  const [household, setHousehold] = useState<FamilyHousehold | null>(null);
  const [householdStatus, setHouseholdStatus] = useState<HouseholdStatus | null>(null);
  const [publicMembers, setPublicMembers] = useState<PublicMemberInfo[]>([]);
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshHouseholdStatus = useCallback(async (): Promise<HouseholdStatus | null> => {
    try {
      const status = await fetchHouseholdStatus();
      setHouseholdStatus(status);
      return status;
    } catch (err) {
      console.warn('[AuthContext] Could not fetch household status:', err);
      return null;
    }
  }, []);

  const refreshPublicMembers = useCallback(async (): Promise<PublicMemberInfo[]> => {
    try {
      const members = await fetchPublicMembersApi();
      setPublicMembers(members);
      return members;
    } catch (err) {
      console.warn('[AuthContext] Could not fetch public members:', err);
      return [];
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      await refreshHouseholdStatus();
      await refreshPublicMembers();

      const existingToken = getAuthToken();
      if (existingToken) {
        try {
          const meData = await fetchMeApi();
          if (meData?.member) {
            setCurrentMemberState(meData.member);
            setActiveMember(meData.member);
          }
          if (meData?.household) {
            setHousehold(meData.household);
          }
        } catch {
          // Token expired or invalid
          console.log('[AuthContext] Session expired or offline fallback active');
        }
      } else {
        const cachedMember = getActiveMember();
        if (cachedMember) {
          setCurrentMemberState(cachedMember);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshHouseholdStatus, refreshPublicMembers]);

  useEffect(() => {
    refreshAuth();

    const onMemberChanged = (e: any) => {
      setCurrentMemberState(e.detail?.member || null);
    };
    window.addEventListener('fitplaner_member_changed', onMemberChanged);
    return () => {
      window.removeEventListener('fitplaner_member_changed', onMemberChanged);
    };
  }, [refreshAuth]);

  const login = async (username: string, password?: string, pin?: string): Promise<LoginResponse> => {
    const res = await loginApi({
      username,
      password,
      pin,
      device_id: typeof window !== 'undefined' ? localStorage.getItem('fitplaner_node_device_id') || undefined : undefined,
      device_name: typeof window !== 'undefined' ? navigator.userAgent.slice(0, 30) : undefined,
    });

    if (res.token) {
      setTokenState(res.token);
    }
    if (res.member) {
      setCurrentMemberState(res.member);
    }
    if (res.household) {
      setHousehold(res.household);
    }

    // Trigger full background sync right after login
    performBidirectionalSync().catch(() => {});
    await refreshPublicMembers();
    return res;
  };

  const logout = async (): Promise<void> => {
    await logoutApi();
    setCurrentMemberState(null);
    setTokenState(null);
    await refreshPublicMembers();
  };

  const createHousehold = async (payload: {
    family_name: string;
    admin_name: string;
    username: string;
    password: string;
    pin?: string;
    device_id: string;
    device_name: string;
    demographics?: any;
  }): Promise<any> => {
    const res = await createHouseholdApi(payload);
    if (res.token) setTokenState(res.token);
    if (res.member) setCurrentMemberState(res.member);
    if (res.household) setHousehold(res.household);
    if (res.household_passkey) setHouseholdPasskey(res.household_passkey);

    await refreshHouseholdStatus();
    await refreshPublicMembers();
    return res;
  };

  const joinHousehold = async (payload: {
    household_passkey: string;
    username: string;
    password?: string;
    pin?: string;
    device_id: string;
    device_name: string;
  }): Promise<any> => {
    const res = await joinHouseholdApi(payload);
    if (payload.household_passkey) {
      setHouseholdPasskey(payload.household_passkey);
    }
    await refreshHouseholdStatus();
    await refreshPublicMembers();
    return res;
  };

  const switchMember = (member: FamilyMember) => {
    setCurrentMemberState(member);
    setActiveMember(member);
  };

  const isAdmin = !!(currentMember?.role === 'admin' || currentMember?.is_admin);
  const isKid = !!(currentMember?.role === 'kid' || (currentMember?.age && currentMember.age < 16));
  const isAuthenticated = !!currentMember;

  return (
    <AuthContext.Provider
      value={{
        currentMember,
        household,
        householdStatus,
        publicMembers,
        token,
        isAuthenticated,
        isAdmin,
        isKid,
        isLoading,
        login,
        logout,
        createHousehold,
        joinHousehold,
        switchMember,
        refreshAuth,
        refreshHouseholdStatus,
        refreshPublicMembers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
