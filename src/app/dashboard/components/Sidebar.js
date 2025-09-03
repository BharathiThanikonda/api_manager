'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(256);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    avatar: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const sidebarRef = useRef(null);

  // Fetch user information on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Since you're already logged in, get user info from your session
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Include cookies for session
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.data) {
            setUserInfo({
              name: userData.data.name || 'User',
              email: userData.data.email || '',
              avatar: userData.data.avatar_url || null
            });
          } else {
            console.error('Invalid user data format');
          }
        } else {
          console.error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // Clear any local storage or session storage
        localStorage.clear();
        sessionStorage.clear();
        
                       // Redirect to login page
               router.push('/auth/signin');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      name: 'API Playground',
      href: '/dashboard/playground',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
  ];

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(sidebarRef.current.offsetWidth);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(400, startWidth + deltaX));
    sidebarRef.current.style.width = `${newWidth}px`;
  }, [isDragging, startX, startWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, startWidth, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={sidebarRef}
      className={`bg-white border-r border-gray-200 flex flex-col relative transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
      style={isCollapsed ? { width: '64px' } : { width: '256px' }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-20"
      >
        <svg 
          className={`w-3 h-3 text-gray-600 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Drag Handle */}
      <div
        className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-100 transition-colors z-10"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-300 rounded-full"></div>
      </div>

      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
          {!isCollapsed && <span className="text-xl font-bold text-gray-900">api-manager</span>}
        </div>
      </div>

      {/* Account Selector */}
      <div className="p-4 border-b border-gray-200">
        <div className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              B
            </div>
            {!isCollapsed && <span className="text-sm font-medium text-gray-700">Personal</span>}
          </div>
          {!isCollapsed && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const isExternal = item.external;
          
          const linkContent = (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                    {item.name}
                  </span>
                )}
              </div>
              {!isCollapsed && isExternal && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </div>
          );

          if (isExternal) {
            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {linkContent}
              </a>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {linkContent}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg transition-colors">
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : userInfo.avatar ? (
              <Image 
                src={userInfo.avatar} 
                alt={userInfo.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col">
                {isLoading ? (
                  <>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mt-1"></div>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-900">
                      {userInfo.name || 'User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {userInfo.email || 'No email'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
