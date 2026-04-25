import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import type { Role, User } from '../types';

type AuthMode = 'signin' | 'signup';

const AuthView: React.FC = () => {
  const [activeRole, setActiveRole] = useState<Role>('USER');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, navigateTo, refreshVendors } = useContext(AppContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
    const businessName = (form.elements.namedItem('businessName') as HTMLInputElement)?.value;
    const foodType = (form.elements.namedItem('foodType') as HTMLInputElement)?.value;

    const endpoint = authMode === 'signin' ? 'login' : 'register';

    let body: any = { email, password, role: activeRole };
    if(authMode === 'signup') {
        body = {...body, name, businessName, foodType };
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred.');
        }

        if (authMode === 'signin') {
            const loggedInUser: User = data.user;
            const loggedInRole: Role = data.role;

            // Refresh vendors data on login so the user sees the latest list
            await refreshVendors();

            login(loggedInUser, loggedInRole);
        } else {
            alert(data.message);
            if (activeRole !== 'VENDOR') {
                setAuthMode('signin'); // Switch to sign in after successful user/admin signup
            }
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const renderFormFields = () => {
    if (authMode === 'signup') {
      return (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" name="name" type="text" placeholder="John Doe" required />
          </div>
          {activeRole === 'VENDOR' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="businessName">Business Name</label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="businessName" name="businessName" type="text" placeholder="e.g., John's Hot Dogs" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="foodType">Food Type</label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="foodType" name="foodType" type="text" placeholder="e.g., American" required />
              </div>
            </>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <button onClick={() => navigateTo('home')} className="absolute top-4 left-4 text-primary font-semibold hover:underline">
            &larr; Back to Home
        </button>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-center text-primary mb-2">
                {authMode === 'signin' ? 'Welcome Back!' : 'Create Account'}
            </h1>
            <p className="text-center text-gray-600 mb-6">Sign in or create an account as a...</p>
            <div className="flex rounded-lg p-1 bg-gray-200 mb-6">
                {(['USER', 'VENDOR', 'ADMIN'] as Role[]).map(role => (
                    <button
                        key={role}
                        onClick={() => setActiveRole(role)}
                        className={`w-full font-semibold py-2 rounded-md transition-all duration-300 ${activeRole === role ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                    >
                        {role.charAt(0) + role.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                    <p className="font-bold text-sm">Error:</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {renderFormFields()}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" name="email" type="email" placeholder="email@example.com" required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" name="password" type="password" placeholder="******************" required />
                </div>

                {authMode === 'signup' && activeRole === 'VENDOR' && (
                     <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
                        <p className="text-sm">Vendor sign up requires admin approval after registration.</p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                     <button className="bg-primary hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition-colors duration-300 disabled:bg-gray-400" type="submit" disabled={loading}>
                        {loading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
                    </button>
                     <button type="button" onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setError(null); }} className="font-semibold text-sm text-gray-600 hover:text-primary">
                        {authMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default AuthView;