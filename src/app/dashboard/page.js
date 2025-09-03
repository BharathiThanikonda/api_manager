'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import BackButton from '../components/BackButton';

export default function Dashboard() {
  const [apiKeys, setApiKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [deletePopup, setDeletePopup] = useState({ show: false, key: null, position: { x: 0, y: 0 } });
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
    keyType: 'development',
    monthlyLimit: false,
    limitValue: 1000
  });

  // Load API keys from Supabase
  useEffect(() => {
    loadApiKeys();
  }, []);

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
            key: 'gitinsights-dev-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
            maskedKey: 'gitinsights-dev-***************************',
            description: 'Main production API key for GitInsights',
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
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'API key deleted successfully!';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
      // Show error notification instead of alert
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'An error occurred while deleting the API key';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  const handleView = (key) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key.id)) {
        newSet.delete(key.id);
      } else {
        newSet.add(key.id);
      }
      return newSet;
    });
  };

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key.key);
    // Show a toast notification instead of alert
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = 'API key copied to clipboard!';
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
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
            monthly_limit: formData.monthlyLimit ? formData.limitValue : null
          })
          .eq('id', editingKey.id);

        if (error) {
          console.error('Error updating API key:', error);
          // Show error notification instead of alert
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
          notification.textContent = `Failed to update API key: ${error.message}`;
          document.body.appendChild(notification);
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
          return;
        }
      } else {
        // Create new key
        const fullKey = `gitinsights-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 30)}`;
        const { error } = await supabase
          .from('api_keys')
          .insert({
            name: formData.name,
            key: fullKey,
            key_type: formData.keyType,
            monthly_limit: formData.monthlyLimit ? formData.limitValue : null,
            status: 'active',
            usage: 0
          });

        if (error) {
          console.error('Error creating API key:', error);
          // Show error notification instead of alert
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
          notification.textContent = `Failed to create API key: ${error.message}`;
          document.body.appendChild(notification);
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
          return;
        }
      }
      
      // Reload the API keys from database
      await loadApiKeys();
      setIsModalOpen(false);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = editingKey ? 'API key updated successfully!' : 'API key created successfully!';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
      // Show error notification instead of alert
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'An error occurred';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const totalUsage = apiKeys.reduce((sum, key) => sum + key.usage, 0);
  const maxCredits = 1000;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <BackButton href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <span>Back to Home</span>
              </BackButton>
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
                <h2 className="text-3xl font-bold">GitInsights</h2>
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
                </div>
              </div>
            </div>
          </div>

          {/* API Keys Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-gray-900">API Keys</h3>
                  <p className="text-sm text-gray-600">
                    The key is used to authenticate your requests to the GitInsights API. Create and manage your API keys here.
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {editingKey ? 'Edit API Key' : 'Create a new API key'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {editingKey ? 'Modify the details of the existing API key.' : 'Enter a name and limit for the new API key.'}
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Key Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name — A unique name to identify this key
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Key Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                {/* Key Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Key Type — Choose the environment for this key
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="keyType"
                        value="development"
                        checked={formData.keyType === 'development'}
                        onChange={(e) => setFormData({...formData, keyType: e.target.value})}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <span className="font-medium text-gray-900">Development</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Rate limited to 100 requests/minute</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="keyType"
                        value="production"
                        checked={formData.keyType === 'production'}
                        onChange={(e) => setFormData({...formData, keyType: e.target.value})}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="font-medium text-gray-900">Production</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Rate limited to 1,000 requests/minute</p>
                      </div>
                    </label>
                  </div>
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
