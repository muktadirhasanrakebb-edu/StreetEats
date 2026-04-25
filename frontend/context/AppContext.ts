import { createContext } from 'react';
import type { User, Vendor, View, Role } from '../types';

interface AppContextType {
  currentUser: User | null;
  role: Role | null;
  view: View;
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  login: (user: User, role: Role) => void;
  logout: () => void;
  navigateTo: (view: View, vendor?: Vendor) => void;
  refreshVendors: () => Promise<void>;
}

export const initialAppContext: AppContextType = {
  currentUser: null,
  role: null,
  view: 'home',
  vendors: [],
  selectedVendor: null,
  login: () => {},
  logout: () => {},
  navigateTo: () => {},
  refreshVendors: async () => {},
};

export const AppContext = createContext<AppContextType>(initialAppContext);