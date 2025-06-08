import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginPageProps {
  onSwitchToSignup: () => void;
}

export default function LoginPage({ onSwitchToSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-teal-600/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/50 via-slate-900/50 to-slate-900"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Welcome back</h1>
          <p className="text-white/70 text-lg">Sign in to your AI Assistant account</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-3">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 backdrop-blur-xl"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 pr-12 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 backdrop-blur-xl"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-300 text-sm bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/70">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300"
              >
                Sign up
              </button>
            </p>
          </div>

          <div className="mt-8 text-xs text-white/60 bg-white/5 border border-white/20 rounded-xl p-4 backdrop-blur-xl">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p>Admin: admin@example.com / password</p>
            <p>User: user@example.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}