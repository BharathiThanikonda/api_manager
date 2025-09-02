'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [apiKeys, setApiKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [deletePopup, setDeletePopup] = useState({ show: false, key: null, position: { x: 0, y: 0 } });
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
    keyType: 'development',
    monthlyLimit: false,
    limitValue: 1000
  });

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading API keys:', error);
        // Fallback to default data if no keys exist
        const defaultKeys = [
          {
            id: 1,
            name: 'default',
            key: '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',
            maskedKey: 'tvly-dev-***************************',
            description: 'Main production API key for live transactions',
            permissions: ['read', 'write'],
            createdAt: '2024-01-15',
            lastUsed: '2024-01-20',
            status: 'active',
            type: 'dev',
            usage: 0
          }
        ];
        setApiKeys(defaultKeys);
      } else {
        // Transform the data to match our expected format
        const transformedKeys = data.map(key => ({
          id: key.id,
          name: key.name,
          key: key.key,
          maskedKey: `${key.key.substring(0, 8)}***************************`,
          description: '', // Database doesn't have description column
          permissions: [], // Database doesn't have permissions column
          createdAt: new Date(key.created_at).toISOString().split('T')[0],
          lastUsed: key.last_used ? new Date(key.last_used).toISOString().split('T')[0] : '-',
          status: key.status || 'active',
          type: key.key_type === 'development' ? 'dev' : 'prod',
          usage: key.usage || 0
        }));
        setApiKeys(transformedKeys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (session?.user?.email) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (error) {
          console.error('Error loading user profile:', error);
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
  };

  // Load API keys from Supabase
  useEffect(() => {
    loadApiKeys();
    loadUserProfile();
  }, [session]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deletePopup.show) {
        setDeletePopup({ show: false, key: null, position: { x: 0, y: 0 } });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [deletePopup.show]);

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the dashboard.</p>
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = () => {
    setEditingKey(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
      keyType: 'development',
      monthlyLimit: false,
      limitValue: 1000
    });
    setIsModalOpen(true);
  };

  const handleEdit = (key) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      description: '', // Database doesn't have description
      permissions: [], // Database doesn't have permissions
      keyType: key.type === 'dev' ? 'development' : 'production',
      monthlyLimit: false,
      limitValue: 1000
    });
    setIsModalOpen(true);
  };

  const handleDelete = (key, event) => {
    event.stopPropagation(); // Prevent immediate closing
    setDeletePopup({
      show: true,
      key: key,
      position: { x: 0, y: 0 } // Not used for centered popup
    });
  };
  
  const performDelete = async () => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', deletePopup.key.id);

      if (error) {
        console.error('Error deleting API key:', error);
        // Show error notification instead of alert
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = `Failed to delete API key: ${error.message}`;
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
        return;
      }

      // Reload the API keys from database
      await loadApiKeys();
      
      // Close popup and reset state
      setDeletePopup({ show: false, key: null, position: { x: 0, y: 0 } });
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'API key deleted successfully!';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
      
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingKey) {
        // Update existing key
        const { error } = await supabase
          .from('api_keys')
          .update({
            name: formData.name,
            key_type: formData.keyType,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingKey.id);

        if (error) {
          console.error('Error updating API key:', error);
          return;
        }
      } else {
        // Create new key
        const newKey = {
          name: formData.name,
          key: `tvly-${formData.keyType === 'development' ? 'dev' : 'prod'}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          key_type: formData.keyType,
          status: 'active',
          usage: 0
        };

        const { error } = await supabase
          .from('api_keys')
          .insert([newKey]);

        if (error) {
          console.error('Error creating API key:', error);
          return;
        }
      }

      // Reload the API keys from database
      await loadApiKeys();
      
      // Close modal and reset form
      setIsModalOpen(false);
      setEditingKey(null);
      setFormData({
        name: '',
        description: '',
        permissions: [],
        keyType: 'development',
        monthlyLimit: false,
        limitValue: 1000
      });
      
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleView = (key) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(key.id)) {
      newVisibleKeys.delete(key.id);
    } else {
      newVisibleKeys.add(key.id);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const handleCopy = async (key) => {
    try {
      await navigator.clipboard.writeText(key.key);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'API key copied to clipboard!';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  // Calculate usage statistics
  const totalUsage = apiKeys.reduce((sum, key) => sum + (key.usage || 0), 0);
  const maxCredits = 1000; // This should come from user's plan

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Pages</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">Overview</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Operational</span>
              </div>
              
              {/* User Profile */}
              {session && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {session.user?.image && (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt={session.user.name}
                      />
                    )}
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{session.user?.name}</p>
                      <p className="text-gray-500">{session.user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-gray-400 hover:text-gray-600"
                    title="Sign Out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Social Icons */}
              <div className="flex items-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
              
              {/* Dark Mode Toggle */}
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Current Plan Section */}
          <div className="bg-gradient-to-r from-red-400 via-orange-400 to-blue-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="text-xs font-medium text-white/80 bg-white/20 px-3 py-1 rounded-full inline-block">
                  CURRENT PLAN
                </div>
                <h2 className="text-3xl font-bold">api-manager</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white/90">API Usage</span>
                    <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Plan</span>
                      <span>{totalUsage}/{maxCredits} Credits</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((totalUsage / maxCredits) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="w-10 h-6 bg-white/20 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 border border-white/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Manage Plan</span>
              </button>
            </div>
          </div>

          {/* User Profile Section */}
          {userProfile && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">User Profile</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your account information and login history
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {userProfile.image_url && (
                        <img
                          className="h-16 w-16 rounded-full"
                          src={userProfile.image_url}
                          alt={userProfile.name}
                        />
                      )}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{userProfile.name}</h4>
                        <p className="text-sm text-gray-500">{userProfile.email}</p>
                        <p className="text-xs text-gray-400">Member since {new Date(userProfile.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Account Details</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Provider:</span>
                          <span className="text-gray-900 capitalize">{userProfile.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Login:</span>
                          <span className="text-gray-900">
                            {userProfile.last_login ? new Date(userProfile.last_login).toLocaleString() : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Created:</span>
                          <span className="text-gray-900">
                            {new Date(userProfile.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-gray-900">API Keys</h3>
                  <p className="text-sm text-gray-600">
                    The key is used to authenticate your requests to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 underline">Research API</a>. To learn more, see the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 underline">documentation page</a>.
                  </p>
                </div>
                <button
                  onClick={handleCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  API Key
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading API keys...</span>
                </div>
              ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USAGE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KEY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OPTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{key.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {key.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{key.usage}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono">
                          {visibleKeys.has(key.id) ? key.key : key.maskedKey}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleView(key)}
                            className={`${visibleKeys.has(key.id) ? 'text-blue-600' : 'text-gray-400'} hover:text-gray-600`}
                            title={visibleKeys.has(key.id) ? "Hide" : "Show"}
                          >
                            {visibleKeys.has(key.id) ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(key)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(key)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDelete(key, e)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingKey ? 'Edit API Key' : 'Create New API Key'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter API key name"
                  required
                />
              </div>
              
              {/* Key Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Type
                </label>
                <select
                  value={formData.keyType}
                  onChange={(e) => setFormData({...formData, keyType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                </select>
              </div>
                
              {/* Monthly Usage Limit */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.monthlyLimit}
                    onChange={(e) => setFormData({...formData, monthlyLimit: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Limit monthly usage*</span>
                </label>
                
                {formData.monthlyLimit && (
                  <div className="ml-6">
                    <input
                      type="number"
                      value={formData.limitValue}
                      onChange={(e) => setFormData({...formData, limitValue: parseInt(e.target.value) || 0})}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  * If the combined usage of all your keys exceeds your plan&apos;s limit, all requests will be rejected.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  {editingKey ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {deletePopup.show && deletePopup.key && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div 
            className="bg-white border border-gray-200 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Delete API Key</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete the API key <strong>&quot;{deletePopup.key.name}&quot;</strong>?
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  This action cannot be undone. The API key will be permanently removed.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={performDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeletePopup({ show: false, key: null, position: { x: 0, y: 0 } })}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
