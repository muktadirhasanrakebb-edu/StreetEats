import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { BackIcon, StarIcon } from '../components/Icons';
import type { MenuItem, Review, Vendor } from '../types';

const VendorDetail: React.FC = () => {
    const { selectedVendor: initialSelectedVendor, navigateTo, vendors, currentUser } = useContext(AppContext);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedItem, setSelectedItem] = useState<string>(''); // For item-specific reviews
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reviewFormRef = useRef<HTMLDivElement>(null);

    // Try to find the latest version of this vendor in the global list
    const currentVendor = vendors.find(v => v.id === initialSelectedVendor?.id) || initialSelectedVendor;

    const fetchData = async () => {
        if (!currentVendor) return;
        try {
            const [menuRes, reviewsRes] = await Promise.all([
                fetch(`http://127.0.0.1:5000/api/vendors/${currentVendor.id}/menu`),
                fetch(`http://127.0.0.1:5000/api/vendors/${currentVendor.id}/reviews`)
            ]);

            if (menuRes.ok) {
                const menuData = await menuRes.json();
                setMenu(menuData);
            }

            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                setReviews(reviewsData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to top on view change
        setIsLoading(true);
        fetchData();
    }, [currentVendor]);

    const handleReviewItem = (itemName: string) => {
        if (!currentUser) {
            alert("Please sign in to review items.");
            navigateTo('auth');
            return;
        }
        setSelectedItem(itemName);
        // Scroll to review form
        reviewFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Authentication Check
        if (!currentUser) {
            alert("Please sign in to leave a review.");
            navigateTo('auth');
            return;
        }

        // 2. Vendor Check
        if (!currentVendor) {
             alert("No vendor selected.");
             return;
        }

        // 3. Validation & Parsing
        // Ensure we are sending Integers to the backend
        const vendorId = parseInt(currentVendor.id, 10);
        const userId = parseInt(currentUser.id, 10);
        const numericRating = Number(rating);

        if (isNaN(vendorId) || isNaN(userId)) {
            console.error("ID Parsing Error", { vendorIdStr: currentVendor.id, userIdStr: currentUser.id });
            alert("There is an issue with the user or vendor data. Please refresh the page and try again.");
            return;
        }

        if (numericRating === 0) {
            alert("Please select a rating.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Construct the final comment. If an item is selected, tag it.
            const finalComment = selectedItem
                ? `[Review for ${selectedItem}]: ${comment}`
                : comment;

            const payload = {
                user_id: userId,
                rating: numericRating,
                comment: finalComment,
            };

            console.log("Submitting Review Payload:", payload);

            const response = await fetch(`http://127.0.0.1:5000/api/vendors/${vendorId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            // Specific error handling for 405 Method Not Allowed
            if (response.status === 405) {
                throw new Error("Method Not Allowed (405). The backend server is rejecting the POST request. Please ensure your 'app.py' allows POST methods for the reviews route.");
            }

            if (response.status === 404) {
                throw new Error("Endpoint Not Found (404). The backend route for reviews seems to be missing.");
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to submit review');
                }
            } else {
                if (!response.ok) {
                    throw new Error(`Server error (${response.status}). Please check backend logs.`);
                }
            }

            // Success! Clear form and refresh reviews
            setRating(0);
            setComment('');
            setSelectedItem('');
            fetchData(); // Refresh the list to show the new review
            alert("Review submitted successfully!");

        } catch (error: any) {
            console.error("Submission Error:", error);
            if (error.message === "Failed to fetch") {
                alert("Connection Error: Could not reach the server. Please ensure the backend is running on port 5000.");
            } else {
                alert("Error: " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentVendor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
                <h2 className="text-2xl font-bold text-dark mb-4">No Vendor Selected</h2>
                <p className="text-gray-600 mb-6">It looks like you haven't selected a vendor to view.</p>
                <button onClick={() => navigateTo('home')} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors">
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="bg-light min-h-screen">
            <header className="relative">
                <img src={currentVendor.image} alt={currentVendor.businessName} className="w-full h-48 md:h-64 object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0"></div>
                <button onClick={() => navigateTo('home')} className="absolute top-4 left-4 bg-white/80 rounded-full p-2 text-dark hover:bg-white transition-all shadow-md z-10" aria-label="Back to home">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white">
                    <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">{currentVendor.businessName}</h1>
                    <p className="text-lg md:text-xl drop-shadow-md">{currentVendor.foodType}</p>
                    <div className="flex items-center mt-2">
                         <StarIcon className="w-5 h-5 text-secondary mr-1"/>
                         <span className="font-bold">{currentVendor.rating.toFixed(1)}</span>
                         <span className="text-sm ml-2 opacity-90">({reviews.length} reviews)</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {isLoading ? (
                    <div className="text-center py-10">
                        <p className="text-lg font-semibold text-primary">Loading vendor details...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Menu */}
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold mb-4 text-dark border-b pb-2">Menu Items</h2>
                            <div className="space-y-4">
                                {menu.length > 0 ? menu.map(item => (
                                    <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-lg transition-shadow">
                                        <img src={item.image} alt={item.name} className="w-full sm:w-24 h-32 sm:h-24 rounded-md object-cover flex-shrink-0 bg-gray-200"/>
                                        <div className="flex-1 w-full">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-lg text-dark">{item.name}</h3>
                                                <p className="font-bold text-primary text-lg">${item.price.toFixed(2)}</p>
                                            </div>
                                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.description}</p>
                                            <button
                                                onClick={() => handleReviewItem(item.name)}
                                                className="text-sm text-accent font-semibold hover:underline flex items-center"
                                            >
                                                <StarIcon className="w-3 h-3 mr-1"/>
                                                Review this item
                                            </button>
                                        </div>
                                    </div>
                                )) : <p className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">This vendor has not added any menu items yet.</p>}
                            </div>
                        </div>

                        {/* Right Column: Reviews & Write Review */}
                        <div className="space-y-6">

                            {/* Write Review Section */}
                            <div ref={reviewFormRef} className="bg-white rounded-lg shadow-md p-6 border-t-4 border-primary">
                                <h3 className="text-xl font-bold mb-4 text-dark">Write a Review</h3>
                                {currentUser ? (
                                    <form onSubmit={handleReviewSubmit} className="space-y-4">

                                        {/* Optional Item Selection */}
                                        {menu.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewing Item (Optional)</label>
                                                <select
                                                    value={selectedItem}
                                                    onChange={(e) => setSelectedItem(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                                                >
                                                    <option value="">-- Review Whole Shop --</option>
                                                    {menu.map(item => (
                                                        <option key={item.id} value={item.name}>{item.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating</label>
                                            <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <StarIcon
                                                        key={star}
                                                        className={`w-8 h-8 cursor-pointer transition-colors ${
                                                            star <= (hoverRating || rating) ? 'text-secondary' : 'text-gray-300'
                                                        }`}
                                                        onClick={() => setRating(star)}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Experience</label>
                                            <textarea
                                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary h-24 resize-none"
                                                placeholder={selectedItem ? `How was the ${selectedItem}?` : "What did you order? How was it?"}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
                                        >
                                            {isSubmitting ? 'Posting...' : 'Post Review'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-600 mb-3">Please sign in to verify your visit and leave a review.</p>
                                        <button
                                            onClick={() => navigateTo('auth')}
                                            className="w-full bg-dark text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Sign In
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Reviews List */}
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-dark">Customer Reviews</h2>
                                <div className="space-y-4 bg-white rounded-lg shadow-md p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {reviews.length > 0 ? reviews.map(review => (
                                        <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                                            <div className="flex items-start">
                                                <img src={review.userAvatar || 'https://i.pravatar.cc/150'} alt={review.userName} className="w-10 h-10 rounded-full mr-3 border border-gray-200"/>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold text-dark">{review.userName}</p>
                                                        <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex my-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <StarIcon key={i} className={`w-3 h-3 ${i < review.rating ? 'text-secondary' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{review.comment}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No reviews yet.</p>
                                            <p className="text-sm">Be the first to review!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VendorDetail;