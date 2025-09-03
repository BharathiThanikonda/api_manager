'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BackButton from '../../components/BackButton';

function PlaygroundContent() {
  const [apiKey, setApiKey] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();

  // Pre-fill the repository URL from query parameter
  useEffect(() => {
    const repoParam = searchParams.get('repo');
    if (repoParam) {
      setGithubUrl(decodeURIComponent(repoParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/githubsummarizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-apikey-header': apiKey
        },
        body: JSON.stringify({
          repositoryUrl: githubUrl,
          summaryType: 'general'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <BackButton href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <span>Back to Dashboard</span>
              </BackButton>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">GitHub Repository Summarizer</h1>
            <p className="text-sm text-gray-600 mt-2">
              Enter a GitHub repository URL and get a summary with stars, latest version, website, and license information. 
              {githubUrl && <span className="text-blue-600 font-medium"> Repository URL pre-filled from landing page.</span>}
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
                  Your API key will be used to authenticate the request
                </p>
              </div>

              <div>
                <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  id="githubUrl"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repository-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the full GitHub repository URL
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
                    <h3 className="text-sm font-medium text-blue-900">What you&apos;ll get</h3>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Repository summary and cool facts</li>
                      <li>• Number of stars</li>
                      <li>• Latest version/release</li>
                      <li>• Website URL (if available)</li>
                      <li>• License information</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !apiKey.trim() || !githubUrl.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Repository...
                  </>
                ) : (
                  'Analyze Repository'
                )}
              </button>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {result && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-green-900">Repository Analysis Results</h3>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors"
                  >
                    Copy JSON
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Summary Section */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-md border">
                        {result.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Cool Facts</h4>
                      <ul className="text-sm text-gray-600 bg-white p-3 rounded-md border space-y-1">
                        {result.cool_facts?.map((fact, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Repository Info Section */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Repository Information</h4>
                      <div className="bg-white p-3 rounded-md border space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Stars:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {result.stars ? `${result.stars.toLocaleString()} ⭐` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Latest Version:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {result.latest_version || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Website:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {result.website_url ? (
                              <a 
                                href={result.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {result.website_url}
                              </a>
                            ) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">License:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {result.license || 'N/A'}
                          </span>
                        </div>
                      </div>
                                         </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Playground() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900">GitHub Repository Summarizer</h1>
              <p className="text-sm text-gray-600 mt-2">Loading...</p>
            </div>
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <PlaygroundContent />
    </Suspense>
  );
}
