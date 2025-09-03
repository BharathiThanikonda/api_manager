'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Star, GitPullRequest, TrendingUp, Zap, Shield, BarChart3, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoUrl, setDemoUrl] = useState("");

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleDashboardsClick = () => {
    if (session) {
      window.location.href = '/dashboard';
    } else {
      handleGoogleSignIn();
    }
  };

  const handleDemoRequest = async () => {
    if (!session) {
      // If user is not authenticated, redirect to sign-in with the repository URL
      await signIn('google', { callbackUrl: `/dashboard/playground?repo=${encodeURIComponent(demoUrl)}` });
      return;
    }
    
    // If user is authenticated, redirect to playground with the repository URL
    window.location.href = `/dashboard/playground?repo=${encodeURIComponent(demoUrl)}`;
  };

  const handleTryApi = () => {
    window.location.href = '/dashboard/playground';
  };

  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mock demo data for demonstration purposes
  const mockDemoResult = {
    summary: "LangChain is a powerful framework for developing applications powered by language models. It provides tools for building LLM applications with prompt management and agent frameworks.",
    cool_facts: [
      "Over 50,000 stars on GitHub",
      "Used by thousands of developers worldwide",
      "Supports multiple language models"
    ],
    stars: 56789,
    latest_version: "v0.1.0",
    website_url: "https://langchain.com",
    license: "MIT"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
              <GitBranch className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">GitInsights</span>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={handleHomeClick}
              className="text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Home
            </button>
            <Link href="#features" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
              Pricing
            </Link>
            <Link href="#about" className="text-gray-700 hover:text-red-600 transition-colors font-medium">
              About
            </Link>
            <button 
              onClick={handleDashboardsClick}
              className="text-gray-700 hover:text-red-600 transition-colors font-medium"
            >
              Dashboards
            </button>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
            ) : session ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600 font-medium">
                    {session.user?.name}
                  </span>
                  {session.user?.image && (
                    <div className="ring-2 ring-red-200 ring-offset-2 ring-offset-white">
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt={session.user.name}
                        width={32}
                        height={32}
                      />
                    </div>
                  )}
                </div>
                <Button variant="ghost" onClick={handleSignOut} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={handleGoogleSignIn} className="text-gray-700 hover:text-red-600">Login</Button>
                <Button onClick={handleGoogleSignIn} className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-lg">
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    handleHomeClick();
                    setMobileMenuOpen(false);
                  }}
                  className="block text-gray-700 hover:text-red-600 transition-colors font-medium py-2 w-full text-left"
                >
                  Home
                </button>
                <Link 
                  href="#features" 
                  className="block text-gray-700 hover:text-red-600 transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#pricing" 
                  className="block text-gray-700 hover:text-red-600 transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="#about" 
                  className="block text-gray-700 hover:text-red-600 transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <button 
                  onClick={() => {
                    handleDashboardsClick();
                    setMobileMenuOpen(false);
                  }}
                  className="block text-gray-700 hover:text-red-600 transition-colors font-medium py-2 w-full text-left"
                >
                  Dashboards
                </button>
              </div>

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-200">
                {status === 'loading' ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                  </div>
                ) : session ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      {session.user?.image && (
                        <Image
                          className="h-10 w-10 rounded-full"
                          src={session.user.image}
                          alt={session.user.name}
                          width={40}
                          height={40}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.user?.name}</div>
                        <div className="text-sm text-gray-500">{session.user?.email}</div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }} 
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        handleGoogleSignIn();
                        setMobileMenuOpen(false);
                      }} 
                      className="w-full text-gray-700 hover:text-red-600"
                    >
                      Login
                    </Button>
                    <Button 
                      onClick={() => {
                        handleGoogleSignIn();
                        setMobileMenuOpen(false);
                      }} 
                      className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-lg"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20"></div>
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-red-400/30 to-orange-400/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400/30 to-blue-400/30 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto text-center max-w-4xl relative z-10">
            <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-orange-400 to-red-400 text-white border-0">
              Free Tier Available
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 text-balance bg-gradient-to-r from-gray-900 via-red-600 to-orange-600 bg-clip-text text-transparent">
              Unlock Deep Insights from Any <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">GitHub Repository</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 text-pretty max-w-2xl mx-auto px-4">
              Get comprehensive analysis, track stars, monitor pull requests, discover cool facts, and stay updated with
              version changes through our powerful API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300" onClick={handleTryApi}>
                Try the API
              </Button>
              {session ? (
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:border-red-300 text-gray-700 hover:text-red-600" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:border-red-300 text-gray-700 hover:text-red-600" onClick={handleGoogleSignIn}>
                  Start Free Analysis
                </Button>
              )}
              <Button size="lg" variant="outline" className="text-lg px-8 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:border-red-300 text-gray-700 hover:text-red-600">
                View API Docs
              </Button>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-12 sm:py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                See GitInsights in Action
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Try our API with a real GitHub repository and see instant insights
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Demo Input */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Try the API</h3>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                    onClick={handleTryApi}
                  >
                    Go to Playground
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub Repository URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://github.com/langchain-ai/langchain"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleDemoRequest}
                    disabled={!demoUrl}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Try This Repository
                  </button>
                  <p className="text-sm text-gray-500 text-center">
                    Enter any public GitHub repository URL to try our API in the playground
                  </p>
                </div>
              </div>

              {/* Demo Results */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Demo Response</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Summary</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {mockDemoResult.summary}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Cool Facts</h4>
                    <ul className="space-y-2">
                      {mockDemoResult.cool_facts.map((fact, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Repository Info</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Stars:</span>
                        <span className="ml-2 font-medium text-gray-800">{mockDemoResult.stars.toLocaleString()} ⭐</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Latest Version:</span>
                        <span className="ml-2 font-medium text-gray-800">{mockDemoResult.latest_version}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Website:</span>
                        <span className="ml-2 font-medium text-gray-800">
                          <a href={mockDemoResult.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {mockDemoResult.website_url}
                          </a>
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">License:</span>
                        <span className="ml-2 font-medium text-gray-800">{mockDemoResult.license}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    <p className="mb-2">This is a demo response. Sign in to try the real API!</p>
                    <p>Response time: ~200ms | Data size: ~2.5KB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 sm:py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Everything You Need to Analyze Repositories
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Our comprehensive API provides detailed insights into any open-source GitHub repository
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Summary Analysis</CardTitle>
                  <CardDescription>
                    Get comprehensive overviews including activity metrics, contributor insights, and project health
                    scores
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Star Tracking</CardTitle>
                  <CardDescription>
                    Monitor star growth patterns, identify trending periods, and analyze popularity metrics over time
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Cool Facts</CardTitle>
                  <CardDescription>
                    Uncover interesting statistics, unique patterns, and surprising insights about any repository
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Version Updates</CardTitle>
                  <CardDescription>
                    Track release patterns, monitor version changes, and stay informed about project evolution
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>
                    Simple REST API with comprehensive documentation, rate limiting, and reliable uptime
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-12 sm:py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50"></div>
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Simple, Transparent Pricing</h2>
              <p className="text-lg sm:text-xl text-gray-600">Start free and scale as you grow</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Free Tier */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl sm:text-2xl">Free Tier</CardTitle>
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">$0</div>
                  <CardDescription>Perfect for getting started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-3"></div>
                      100 API calls per month
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-3"></div>
                      Basic repository analysis
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-3"></div>
                      Star tracking
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-3"></div>
                      Cool facts generation
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mr-3"></div>
                      Community support
                    </li>
                  </ul>
                  <Button className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700" onClick={handleGoogleSignIn}>
                    Get Started Free
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Tier */}
              <Card className="border-0 bg-gray-100/80 backdrop-blur-sm relative overflow-hidden opacity-75">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gray-500 text-white font-semibold">Coming Soon</Badge>
                </div>
                <CardHeader className="text-center relative z-10">
                  <CardTitle className="text-xl sm:text-2xl text-gray-600">Pro</CardTitle>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-500">$29</div>
                  <CardDescription className="text-gray-500">For serious developers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-gray-500">10,000 API calls per month</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-gray-500">Advanced analytics</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-gray-500">Pull request insights</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-gray-500">Version tracking</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-gray-500">Priority support</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-gray-500">Custom webhooks</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-gray-400 text-gray-600 cursor-not-allowed" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 sm:py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-red-50"></div>
        </section>

        {/* About Section */}
        <section id="about" className="py-12 sm:py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50"></div>
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              About GitInsights
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-4">
              We&apos;re passionate about making GitHub repository insights accessible to everyone. 
              Our platform provides deep insights that help developers understand project health, 
              track trends, and make informed decisions about their codebase.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12">
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-xl p-6 hover:bg-white/90 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Data-Driven Insights</h3>
                <p className="text-gray-600">Comprehensive analytics powered by real GitHub data</p>
              </div>
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-xl p-6 hover:bg-white/90 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure & Reliable</h3>
                <p className="text-gray-600">Enterprise-grade security with 99.9% uptime guarantee</p>
              </div>
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-xl p-6 hover:bg-white/90 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Instant results with our optimized API infrastructure</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50"></div>
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Ready to Analyze Your First Repository?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-4">
              Join thousands of developers who trust GitInsights for their repository insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300" onClick={handleTryApi}>
                Try the API
              </Button>
              {session ? (
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:border-red-300 text-gray-700 hover:text-red-600" asChild>
                  <Link href="/dashboard">
                    Access Dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:border-red-300 text-gray-700 hover:text-red-600" onClick={handleGoogleSignIn}>
                  Start Free Today
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              <div className="sm:col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                    <GitBranch className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">GitInsights</span>
                </div>
                                  <p className="text-gray-300">Powerful GitHub repository insights made simple.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-white">Product</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <a href="#features" className="hover:text-white transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="hover:text-white transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      API Docs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Status
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-white">Company</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <a href="#about" className="hover:text-white transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-white">Support</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Community
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 GitInsights. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
