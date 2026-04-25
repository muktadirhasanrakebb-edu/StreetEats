import React, { useState, useEffect, useContext } from 'react';
import type { Coordinates, Vendor } from '../types';
import { AppContext } from '../context/AppContext';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import Map from '../components/Map';
import VendorCard from '../components/VendorCard';
import { SearchIcon } from '../components/Icons';

const Home: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { vendors, refreshVendors } = useContext(AppContext);

  useEffect(() => {
    // 1. Fetch user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting geolocation: ", error);
        // Fallback location: Dhaka, Bangladesh
        setUserLocation({ lat: 23.8103, lng: 90.4125 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // 2. Force a fresh fetch of vendors when Home page loads
    // This ensures if a user just got approved, they appear immediately.
    refreshVendors();
  }, [refreshVendors]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshVendors();
    setIsRefreshing(false);
  };

  const filteredVendors = vendors.filter(vendor => {
    const query = searchQuery.toLowerCase();
    const businessName = (vendor.businessName || '').toLowerCase();
    const foodType = (vendor.foodType || '').toLowerCase();

    return businessName.includes(query) || foodType.includes(query);
  });

  return (
    <div className="h-screen w-screen flex flex-col">
      <Header onMenuClick={() => setIsMenuOpen(true)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 flex flex-col pt-16 overflow-hidden">
        <div className="h-1/2 md:h-3/5 p-4 relative">
            <Map userLocation={userLocation} vendors={filteredVendors} />
        </div>

        <div className="flex-1 flex flex-col bg-light overflow-hidden rounded-t-2xl shadow-inner">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark">Vendors Nearby</h2>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`text-sm font-semibold text-primary hover:text-red-600 transition-colors flex items-center gap-1 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isRefreshing ? 'Refreshing...' : 'Refresh List'}
                </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <SearchIcon className="w-5 h-5" />
              </span>
              <input
                  type="text"
                  placeholder="Search by name or food type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredVendors.length > 0 ? (
              filteredVendors.map(vendor => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))
            ) : (
              <div className="text-center text-gray-500 mt-8 px-4">
                <p className="text-lg font-semibold mb-2">No vendors found nearby.</p>
                <p className="text-sm mb-4">
                    {searchQuery ? "Try adjusting your search terms." : "We couldn't find any approved vendors in your area."}
                </p>
                {!searchQuery && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                        <strong>New Vendor?</strong><br/>
                        If you just created a vendor account, your shop will not appear here until an <strong>Admin</strong> approves it.
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;