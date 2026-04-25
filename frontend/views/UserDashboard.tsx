import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { StarIcon } from '../components/Icons';
import type { Review, Vendor } from '../types';

const UserDashboard: React.FC = () => {
    const { currentUser, logout, navigateTo, vendors } = useContext(AppContext);
    const [profileImage, setProfileImage] = useState<string | null>(currentUser?.avatar || null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/users/${currentUser.id}/reviews`);
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) {
            navigateTo('auth');
            return;
        }
        fetchReviews();
    }, [currentUser, navigateTo, fetchReviews]);

    if (!currentUser) {
        return null;
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfileImage(event.target?.result as string);
                // In a real app, you would also upload this to the server
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary">My Dashboard</h1>
                    <div>
                        <button onClick={() => navigateTo('home')} className="font-semibold text-dark hover:text-primary transition-colors mr-4">Home</button>
                        <button onClick={logout} className="font-semibold text-dark hover:text-primary transition-colors">Logout</button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center sticky top-20">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <img src={profileImage || ''} alt="User" className="w-full h-full rounded-full object-cover border-4 border-primary"/>
                            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-red-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <h2 className="text-xl font-semibold">{currentUser.name}</h2>
                        <p className="text-gray-500">{currentUser.email}</p>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">Member since {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Discount Coupons Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-4">My Coupons</h3>
                        <div className="space-y-3">
                            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="font-bold">TACO20</span> - 20% off your next taco order!
                                </div>
                                <button className="font-semibold text-sm hover:underline">COPY</button>
                            </div>
                            <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="font-bold">PIZZAFUN</span> - Buy one slice, get one free!
                                </div>
                                <button className="font-semibold text-sm hover:underline">COPY</button>
                            </div>
                        </div>
                    </div>

                    {/* My Reviews Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-4">My Past Reviews ({reviews.length})</h3>
                        <div className="space-y-4">
                            {isLoading ? <p>Loading reviews...</p> : reviews.length > 0 ? reviews.map(review => (
                                <div key={review.id} className="border-b pb-4 last:border-b-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-lg text-primary cursor-pointer hover:underline" onClick={() => {
                                            // Navigate to vendor if possible (optional feature)
                                            const vendor = vendors.find(v => v.businessName === review.userName);
                                            if(vendor) navigateTo('vendorDetail', vendor);
                                        }}>{review.userName}</h4>
                                        <span className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center my-2">
                                        {Array(review.rating).fill(0).map((_, i) => <StarIcon key={i} className="w-4 h-4 text-secondary"/>)}
                                        {Array(5 - review.rating).fill(0).map((_, i) => <StarIcon key={i} className="w-4 h-4 text-gray-300"/>)}
                                    </div>
                                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md italic">"{review.comment}"</p>
                                </div>
                            )) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-500">You haven't written any reviews yet.</p>
                                    <button onClick={() => navigateTo('home')} className="mt-2 text-primary font-semibold hover:underline">Find a vendor to review</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;