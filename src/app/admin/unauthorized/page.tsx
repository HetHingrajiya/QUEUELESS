import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-center space-y-5">
        <h1 className="text-7xl font-bold text-red-500">403</h1>
        <h2 className="text-3xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          You don't have permission to access this page. Please contact your system administrator if you believe this is a mistake.
        </p>
        <div className="pt-6">
          <Link 
            href="/admin/dashboard" 
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium inline-block"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
