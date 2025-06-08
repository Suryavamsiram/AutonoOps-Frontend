import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff, Loader2, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SignupPageProps {
  onSwitchToLogin: () => void;
}

export default function SignupPage({ onSwitchToLogin }: SignupPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { signup, isLoading } = useAuth();

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { text: 'Contains number', met: /\d/.test(formData.password) }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordRequirements.every(req => req.met)) {
      setError('Password does not meet requirements');
      return;
    }

    const success = await signup(formData.email, formData.password, formData.name);
    if (!success) {
      setError('An error occurred during signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-teal-600/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/50 via-slate-900/50 to-slate-900"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl mb-6 shadow-2xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Create account</h1>
          <p className="text-white/70 text-lg">Get started with your AI Assistant</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-3">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 backdrop-blur-xl"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-3">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 backdrop-blur-xl"
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-4 pr-12 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 backdrop-blur-xl"
                  placeholder="Create a password"
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
              
              {formData.password && (
                <div className="mt-4 space-y-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <Check className={`w-3 h-3 ${req.met ? 'text-emerald-400' : 'text-white/30'}`} />
                      <span className={req.met ? 'text-emerald-300' : 'text-white/60'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-3">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-4 pr-12 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 backdrop-blur-xl"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/70">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors duration-300"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}