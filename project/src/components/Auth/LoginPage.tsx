import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Home, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        onLogin();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500 rounded-2xl mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">TROPA</h1>
          <p className="text-gray-600 text-sm lg:text-base">Members Management System</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 text-sm lg:text-base">Please sign in to your account</p>
          </div>
          {error && (
            <div className="mb-4 p-3 lg:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4 lg:space-y-6">
            <div>
              <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 lg:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-base"
                  placeholder="Enter your email" />
              </div>
            </div>
            <div>
              <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 lg:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-base"
                  placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 lg:py-4 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-400 text-white font-medium rounded-lg transition-colors touch-manipulation text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-5 h-5" />Sign In</>
              )}
            </button>
          </form>
        </div>
        <div className="text-center mt-6 lg:mt-8">
          <p className="text-sm text-gray-500">© 2025 TROPA, All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
