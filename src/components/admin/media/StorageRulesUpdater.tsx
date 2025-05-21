import React, {useState } from 'react';

const StorageRulesUpdater: React.FC = () => {
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string } | null>(null);

  const updateStorageRules = async () => {
    setUpdating(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/storage-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
    });

      const data = await response.json();

      if (response.ok) {
        setResult({success: true, message: data.message || 'Storage rules updated successfully'});
    } else {
        setResult({success: false, message: data.error || 'Failed to update storage rules'});
    }
  } catch (error: any) {
      setResult({success: false, message: error.message || 'An error occurred'});
  } finally {
      setUpdating(false);
  }
};

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-medium text-neutral-900 mb-4">Storage Permissions</h3>
      
      <p className="text-neutral-600 mb-4">
        If you're experiencing permission issues with Firebase Storage, you can update the storage rules to allow uploads to the media folder.
      </p>
      
      {result && (
        <div className={`p-4 rounded-md mb-4 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}
      
      <button
        type="button"
        className="flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        onClick={updateStorageRules}
        disabled={updating}
      >
        {updating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          </>
        ) : (
          'Update Storage Rules'
        )}
      </button>
    </div>
  );
};

export default StorageRulesUpdater;
