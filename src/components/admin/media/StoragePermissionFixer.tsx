import React, {useState } from 'react';

const StoragePermissionFixer: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
} | null>(null);

  const testStoragePermissions = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/fix-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
    });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Storage permissions are working correctly',
          details: `Test file URL: ${data.url}`,
      });
    } else {
        setResult({
          success: false,
          message: data.error || 'Failed to test storage permissions',
          details: data.message,
      });
    }
  } catch (error: any) {
      setResult({
        success: false,
        message: 'An error occurred while testing storage permissions',
        details: error.message,
    });
  } finally {
      setTesting(false);
  }
};

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-medium text-neutral-900 mb-4">Storage Permission Test</h3>
      
      <p className="text-neutral-600 mb-4">
        If you're experiencing permission issues with Firebase Storage, use this tool to test and diagnose the problem.
      </p>
      
      {result && (
        <div className={`p-4 rounded-md mb-4 ${
          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
          <p className="font-medium">{result.message}</p>
          {result.details && (
            <p className="mt-2 text-sm">{result.details}</p>
          )}
          {!result.success && (
            <div className="mt-3">
              <p className="font-medium">Possible solutions:</p>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>Check your Firebase Storage rules in the Firebase Console</li>
                <li>Make sure your Firebase project is properly configured</li>
                <li>Verify that your authentication is working correctly</li>
                <li>Try logging out and logging back in</li>
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="flex space-x-4">
        <button
          type="button"
          className="flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          onClick={testStoragePermissions}
          disabled={testing}
        >
          {testing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Testing...
            </>
          ) : (
            'Test Storage Permissions'
          )}
        </button>
      </div>
    </div>
  );
};

export default StoragePermissionFixer;
