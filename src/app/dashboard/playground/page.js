'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Playground() {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API key validation
      // In a real app, you would make an API call to validate the key
      const isValid = await validateApiKey(apiKey);
      
      if (isValid) {
        // Store the valid API key in localStorage or session
        localStorage.setItem('validApiKey', apiKey);
        
        // Show success notification
        showNotification('Valid API key! Access granted.', 'success');
        
        // Redirect to protected page after a short delay
        setTimeout(() => {
          router.push('/dashboard/protected');
        }, 1500);
      } else {
        showNotification('Invalid API key! Please try again.', 'error');
      }
    } catch (error) {
      showNotification('Error validating API key. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateApiKey = async (key) => {
    // Simulate API validation
    // In a real implementation, you would make an API call to your backend
    return new Promise((resolve) => {
      setTimeout(() => {
        // For demo purposes, consider keys starting with 'tvly-' as valid
        const isValid = key.startsWith('tvly-') && key.length > 20;
        resolve(isValid);
      }, 1000);
    });
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">API Playground</h1>
            <p className="text-sm text-gray-600 mt-2">
              Test your API key and access protected resources
            </p>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key (e.g., 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)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your API key will be validated securely
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">How it works</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Submit your API key to validate access. If valid, you&apos;ll be redirected to the protected area.
                      For testing, use any key starting with &apos;tvly-&apos; and longer than 20 characters.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !apiKey.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </>
                ) : (
                  'Validate API Key'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
