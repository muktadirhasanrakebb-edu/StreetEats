import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import type { User } from '../types';

interface VendorRequest extends User {
    businessName: string;
    date: string;
}

const AdminDashboard: React.FC = () => {
    const { currentUser, logout, navigateTo, refreshVendors } = useContext(AppContext);
    const [requests, setRequests] = useState<VendorRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/vendor-requests', {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch requests');
            }
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            navigateTo('auth');
            return;
        }
        fetchRequests();
    }, [currentUser, navigateTo]);

    if (!currentUser) {
        return null;
    }

    const handleRequest = async (id: string, action: 'approve' | 'deny') => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/vendor-requests/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (!response.ok) {
                throw new Error('Action failed');
            }
            // Refresh the list after action so Home page updates immediately
            setRequests(prev => prev.filter(req => req.id !== id));

            // Wait a small moment for DB commit, then refresh
            setTimeout(async () => {
                await refreshVendors();
            }, 500);

            const data = await response.json();
            alert(data.message);
        } catch (error) {
            console.error(error);
            alert(`Failed to ${action} request.`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
                     <div>
                        <button onClick={() => navigateTo('home')} className="font-semibold text-dark hover:text-primary transition-colors mr-4">Home</button>
                        <button onClick={logout} className="font-semibold text-dark hover:text-primary transition-colors">Logout</button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">Pending Vendor Sign-Up Approvals ({requests.length})</h3>
                    <div className="overflow-x-auto">
                        {isLoading ? <p>Loading requests...</p> : (
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Business Name</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Contact</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Date</th>
                                    <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{req.businessName}</td>
                                        <td className="py-3 px-4">{req.name} ({req.email})</td>
                                        <td className="py-3 px-4">{new Date(req.date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 flex gap-2">
                                            <button onClick={() => handleRequest(req.id, 'approve')} className="bg-green-500 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-green-600 transition-colors">Approve</button>
                                            <button onClick={() => handleRequest(req.id, 'deny')} className="bg-red-500 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-red-600 transition-colors">Deny</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                         {requests.length === 0 && !isLoading && <p className="text-center py-8 text-gray-500">No pending requests.</p>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;