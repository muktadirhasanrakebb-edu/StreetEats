import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import type { MenuItem, Review } from '../types';
import { StarIcon } from '../components/Icons';

const VendorDashboard: React.FC = () => {
    const { currentUser, role, logout, navigateTo, vendors, refreshVendors } = useContext(AppContext);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newItem, setNewItem] = useState({ name: '', description: '', price: '' });
    const [profileImage, setProfileImage] = useState<string | null>(currentUser?.avatar || null);
    const [newItemImage, setNewItemImage] = useState<File | null>(null);
    const [dataError, setDataError] = useState<string | null>(null);

    // State to hold the REAL vendor ID from the database
    const [realVendorId, setRealVendorId] = useState<string | null>(currentUser?.vendorId || null);

    // 1. Attempt to resolve Vendor ID from various sources
    useEffect(() => {
        const resolveVendorId = async () => {
            if (!currentUser || role !== 'VENDOR') return;

            // A. If we already have it from login
            if (currentUser.vendorId) {
                setRealVendorId(currentUser.vendorId);
                return;
            }

            // B. Check the public approved vendors list
            const publicVendor = vendors.find(v => String(v.userId) === String(currentUser.id));
            if (publicVendor) {
                setRealVendorId(publicVendor.id);
                return;
            }

            // C. Fallback: Ask the backend directly (Handles pending vendors)
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/vendor-lookup/${currentUser.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setRealVendorId(data.vendorId);
                }
            } catch (e) {
                console.error("Could not resolve vendor ID", e);
            }
        };

        resolveVendorId();
    }, [currentUser, vendors, role]);

    const fetchVendorData = async () => {
        if (!realVendorId) return;

        setIsLoading(true);
        setDataError(null);
        try {
            const [menuRes, reviewsRes] = await Promise.all([
                fetch(`http://127.0.0.1:5000/api/vendors/${realVendorId}/menu`),
                fetch(`http://127.0.0.1:5000/api/vendors/${realVendorId}/reviews`)
            ]);

            let menuData = [];
            let reviewsData = [];

            if (menuRes.ok) {
                menuData = await menuRes.json();
            }

            if (reviewsRes.ok) {
                 reviewsData = await reviewsRes.json();
            }

            setMenuItems(Array.isArray(menuData) ? menuData : []);
            setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        } catch (error: any) {
            console.error("Failed to fetch vendor data:", error);
            setDataError("Could not load some vendor data.");
            setMenuItems([]);
            setReviews([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigateTo('auth');
            return;
        }
        refreshVendors();
    }, [currentUser, navigateTo, refreshVendors]);

    useEffect(() => {
        if (realVendorId) {
            fetchVendorData();
        }
    }, [realVendorId]);

    if (!currentUser) {
        return null;
    }

    const isPending = currentUser.status === 'pending';
    const showActiveState = currentUser.status === 'approved';

    const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfileImage(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    const handleItemImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewItemImage(e.target.files[0]);
        }
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!realVendorId) {
            alert("Please wait... identifying your vendor profile. Try again in a few seconds.");
            return;
        }

        // Validation
        if (!newItem.name.trim() || !newItem.description.trim()) {
            alert("Please fill in item name and description.");
            return;
        }

        const priceVal = parseFloat(newItem.price);
        if (isNaN(priceVal) || priceVal < 0) {
            alert("Please enter a valid price.");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/vendors/${realVendorId}/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newItem.name,
                    description: newItem.description,
                    price: priceVal,
                }),
            });

            const contentType = response.headers.get("content-type");
            let errorMessage = `Server Error (${response.status})`;

            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (response.ok) {
                    // Success
                    setMenuItems(prev => [...prev, data]);
                    setNewItem({ name: '', description: '', price: '' });
                    setNewItemImage(null);
                    await refreshVendors();
                    alert("Item added successfully!");
                    return;
                } else {
                    errorMessage = data.message || errorMessage;
                }
            } else {
                // Fallback for non-JSON errors (e.g. 500 HTML crash)
                console.error("Non-JSON response received");
                if (response.status === 500) errorMessage = "Internal Server Error (500). Check backend logs.";
                if (response.status === 404) errorMessage = "Endpoint not found (404).";
            }

            throw new Error(errorMessage);

        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary">Vendor Dashboard</h1>
                    <div>
                        <button onClick={() => navigateTo('home')} className="font-semibold text-dark hover:text-primary transition-colors mr-4">Home</button>
                        <button onClick={logout} className="font-semibold text-dark hover:text-primary transition-colors">Logout</button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {dataError && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{dataError}</span>
                    </div>
                )}

                <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-6">
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <img src={profileImage || ''} alt="Vendor" className="w-full h-full rounded-full object-cover border-4 border-primary"/>
                        <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-red-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                        </label>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-dark">{currentUser.businessName || currentUser.name}</h2>
                        <p className="text-lg text-gray-600">{currentUser.name}</p>
                        <p className="text-gray-500">{currentUser.email}</p>

                        {isPending ? (
                             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-3">
                                <p className="text-yellow-700 text-sm font-semibold flex items-center">
                                    <span className="mr-2">⚠️</span> Pending Admin Approval
                                </p>
                                <p className="text-yellow-600 text-xs mt-1">You can add menu items, but your shop won't appear on the map until approved.</p>
                             </div>
                        ) : showActiveState ? (
                             <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-3">
                                <p className="text-green-700 text-sm font-semibold flex items-center">
                                    <span className="mr-2">✅</span> Account Approved
                                </p>
                             </div>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Menu Item Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-4">Add New Menu Item</h3>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <input name="name" value={newItem.name} onChange={handleInputChange} placeholder="Item Name" className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary" required />
                            <textarea name="description" value={newItem.description} onChange={handleInputChange} placeholder="Description" className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary" rows={3} required />
                            <input name="price" value={newItem.price} onChange={handleInputChange} type="number" step="0.01" placeholder="Price" className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary" required />
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Item Photo</label>
                                <input name="image" onChange={handleItemImageChange} type="file" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">Add Item</button>
                        </form>
                    </div>

                    {/* My Menu Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-4">My Menu ({menuItems.length})</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {isLoading ? <p>Loading menu...</p> : menuItems.length > 0 ? menuItems.map(item => (
                                <div key={item.id} className="flex items-center p-2 border rounded-md">
                                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover mr-4" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                    </div>
                                    <p className="font-bold text-primary">${item.price.toFixed(2)}</p>
                                </div>
                            )) : <p className="text-gray-500 italic">No menu items yet.</p>}
                        </div>
                    </div>
                </div>

                 {/* Shop Reviews Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">Shop Reviews ({reviews.length})</h3>
                     <div className="space-y-4">
                        {isLoading ? <p>Loading reviews...</p> : reviews.length > 0 ? reviews.map(review => (
                             <div key={review.id} className="flex items-start border-b pb-3">
                                <img src={review.userAvatar} alt={review.userName} className="w-12 h-12 rounded-full mr-4"/>
                                <div>
                                    <div className="flex items-center justify-between w-full">
                                        <p className="font-semibold">{review.userName}</p>
                                         <div className="flex items-center">
                                            {Array(review.rating).fill(0).map((_, i) => <StarIcon key={i} className="w-4 h-4 text-secondary"/>)}
                                            {Array(5 - review.rating).fill(0).map((_, i) => <StarIcon key={i} className="w-4 h-4 text-gray-300" />)}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(review.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )) : <p className="text-gray-500 italic">No reviews yet.</p>}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default VendorDashboard;