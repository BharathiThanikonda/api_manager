'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ 
  href, 
  className = "flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors",
  children = "Back"
}) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className={className}
      type="button"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{children}</span>
    </button>
  );
}
