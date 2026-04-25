import { useState, useMemo, useCallback, useEffect } from 'react';
import { AppContext, initialAppContext } from './context/AppContext';
import type { User, Vendor, View, Role } from './types';

import Home from './views/Home';
import AuthView from './views/AuthView';
import UserDashboard from './views/UserDashboard';
import VendorDashboard from './views/VendorDashboard';
import AdminDashboard from './views/AdminDashboard';
import VendorDetail from './views/VendorDetail';

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialAppContext.currentUser);
  const [role, setRole] = useState<Role | null>(initialAppContext.role);
  const [view, setView] = useState<View>(initialAppContext.view);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setConnectionError(null);
    try {
      // ADDED: ?_=${new Date().getTime()} to URL to aggressively prevent browser caching
      const response = await fetch(`http://127.0.0.1:5000/api/vendors?_=${new Date().getTime()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        console.log(`Fetched ${data.length} vendors from backend.`);

        // Robust parsing: convert strings to numbers and handle missing optional fields
        const validVendors = data.map((v: any) => {
          if (!v || (!v.id && !v.user_id)) return null;

          // Handle coordinates (accept strings, nested objects, or flat snake_case)
          let lat = v.coords?.lat;
          let lng = v.coords?.lng;

          // Fallback if flat structure or undefined
          if (lat === undefined) lat = v.lat;
          if (lng === undefined) lng = v.lng;

          let parsedLat = parseFloat(lat);
          let parsedLng = parseFloat(lng);

          // If coordinates are missing or invalid (e.g. new vendor), default to a central location
          // so they still appear in the list.
          // UPDATED: Default to Dhaka Center (23.8103, 90.4125)
          if (isNaN(parsedLat) || isNaN(parsedLng)) {
             parsedLat = 23.8103;
             parsedLng = 90.4125;
          }

          // Determine User ID: backend might send snake_case or camelCase
          // Fallback: if no user_id is present, assume the vendor ID is the user ID (common in 1:1 relations)
          const ownerId = v.user_id || v.userId || v.id;

          // Handle snake_case database fields vs camelCase frontend expectations
          const businessName = v.businessName || v.business_name || v.name || 'Unnamed Vendor';
          const foodType = v.foodType || v.food_type || 'Street Food';
          const vendorImage = v.image || v.avatar || 'https://placehold.co/600x400?text=Street+Food';
          const rating = parseFloat(v.rating) || 0;

          return {
            ...v,
            id: String(v.id), // Ensure ID is string for consistent comparison
            userId: String(ownerId), // Map user_id from backend to allow linking to User
            coords: { lat: parsedLat, lng: parsedLng },
            rating: rating,
            businessName: businessName,
            foodType: foodType,
            image: vendorImage,
            reviews: Array.isArray(v.reviews) ? v.reviews : []
          } as Vendor;
        }).filter((v): v is Vendor => v !== null);

        setVendors(validVendors);
      } else {
        console.error("Expected array from API but got:", data);
        setVendors([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch vendors:", error);
      setConnectionError(error.message || "Unknown Error");
      // Don't clear vendors on error if we already have some, to prevent UI flashing
      if (vendors.length === 0) setVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const navigateTo = useCallback((newView: View, vendor?: Vendor) => {
    setView(newView);
    if (vendor) {
      setSelectedVendor(vendor);
    } else if (newView === 'home') {
      setSelectedVendor(null);
    }
  }, []);

  const login = useCallback((user: User, userRole: Role) => {
    setCurrentUser(user);
    setRole(userRole);
    if (userRole === 'USER') navigateTo('userDashboard');
    else if (userRole === 'VENDOR') navigateTo('vendorDashboard');
    else if (userRole === 'ADMIN') navigateTo('adminDashboard');
    else navigateTo('home');
  }, [navigateTo]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setRole(null);
    navigateTo('home');
  }, [navigateTo]);

  const contextValue = useMemo(() => ({
    currentUser,
    role,
    view,
    vendors,
    selectedVendor,
    login,
    logout,
    navigateTo,
    refreshVendors: fetchVendors,
  }), [currentUser, role, view, vendors, selectedVendor, login, logout, navigateTo, fetchVendors]);

  const renderView = () => {
    if (isLoading && view === 'home') {
      return (
        <div className="flex items-center justify-center min-h-screen flex-col">
          <div className="text-xl font-semibold text-primary">Loading StreetEats...</div>
        </div>
      );
    }

    switch (view) {
      case 'auth':
        return <AuthView />;
      case 'userDashboard':
        return <UserDashboard />;
      case 'vendorDashboard':
        return <VendorDashboard />;
      case 'adminDashboard':
        return <AdminDashboard />;
      case 'vendorDetail':
        return <VendorDetail />;
      case 'home':
      default:
        return <Home />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="bg-gray-100 min-h-screen font-sans text-dark">
        {connectionError && view === 'home' && (
             <div className="bg-red-600 text-white text-center py-2 px-4 sticky top-0 z-50 shadow-md">
                <p className="font-bold">Backend Connection Error ({connectionError})</p>
                <p className="text-sm">Please ensure your Python backend is running and your database is connected.</p>
            </div>
        )}
        {renderView()}
      </div>
    </AppContext.Provider>
  );
};

export default App;