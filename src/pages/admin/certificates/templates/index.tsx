import React, {useState, useEffect } from 'react';
import {collection, getDocs, query, orderBy, limit, startAfter, where, deleteDoc, doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {CertificateTemplate } from '@/types/certificate.types';
import Image from 'next/image';

const CertificateTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 10;

  // Fetch certificate templates from Firestore
  const fetchTemplates = async (isInitial = false) => {
    try {
      setLoading(true);
      setError(null);

      const templatesQuery = collection(firestore, 'certificateTemplates');
      const queryConstraints: any[] = [orderBy('createdAt', 'desc'), limit(pageSize)];

      // Apply pagination
      if (!isInitial && lastVisible) {
        queryConstraints.push(startAfter(lastVisible));
    }

      const q = query(templatesQuery, ...queryConstraints);
      const querySnapshot = await getDocs(q);

      // Check if we have more results
      setHasMore(querySnapshot.docs.length === pageSize);

      // Set the last visible document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } else {
        setLastVisible(null);
    }

      // Process the results
      const fetchedTemplates: CertificateTemplate[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTemplates.push({
          id: doc.id,
          name: data.name || 'Untitled Template',
          description: data.description || '',
          previewUrl: data.previewUrl || '/assets/certificate-default.jpg',
          htmlTemplate: data.htmlTemplate || '',
          cssStyles: data.cssStyles || '',
          placeholders: data.placeholders || [],
          orientation: data.orientation || 'landscape',
          dimensions: data.dimensions || {
            width: 297,
            height: 210,
            unit: 'mm'
        },
          defaultFonts: data.defaultFonts || ['Helvetica', 'Arial', 'sans-serif'],
          defaultColors: data.defaultColors || {
            primary: '#0e0e4f',
            secondary: '#8a0200',
            text: '#3c3c3c',
            background: '#f0f0ff'
        },
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          type: 'html',
          content: '',
          defaultValues: {},
          status: 'active',
          createdBy: ''
      });
    });

      if (isInitial) {
        setTemplates(fetchedTemplates);
    } else {
        setTemplates(prev => [...prev, ...fetchedTemplates]);
    }
  } catch (err: any) {
      console.error('Error fetching certificate templates:', err);
      setError('Failed to load certificate templates. Please try again.');
  } finally {
      setLoading(false);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchTemplates(true);
}, []);

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
  }

    try {
      await deleteDoc(doc(firestore, 'certificateTemplates', templateId));
      setTemplates(prev => prev.filter(template => template.id !== templateId));
  } catch (err: any) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template. Please try again.');
  }
};

  return (
    <AdminLayout title="Certificate Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-neutral-500 mt-1">
              Manage your certificate templates for course completion
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href="/admin/certificates/templates/create">
              <Button variant="primary" className="mt-4 sm:mt-0">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Template
                </span>
              </Button>
            </Link>
            <Link href="/admin/certificates/templates/manage">
              <Button variant="secondary" className="mt-4 sm:mt-0">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                  </svg>
                  Manage PDF Templates
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Templates Grid */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
          {loading && templates.length === 0 ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">No certificate templates found</h3>
              <p className="text-neutral-500">
                Create your first certificate template to get started.
              </p>
              <div className="mt-4">
                <Link href="/admin/certificates/templates/create">
                  <Button variant="primary">
                    Create Template
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="border border-neutral-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="relative h-48 bg-neutral-100">
                    {template.previewUrl ? (
                      <Image
                        src={template.previewUrl}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="text-lg font-medium text-neutral-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{template.description}</p>
                    )}
                    <div className="mt-2 flex items-center text-xs text-neutral-500">
                      <span className="capitalize">{template.orientation}</span>
                      <span className="mx-2">•</span>
                      <span>{template.dimensions.width} × {template.dimensions.height} {template.dimensions.unit}</span>
                    </div>
                  </div>
                  <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-between">
                    <Link href={`/admin/certificates/templates/${template.id}`}>
                      <Button variant="outline" size="sm">
                        Preview
                      </Button>
                    </Link>
                    <div className="flex space-x-2">
                      <Link href={`/admin/certificates/templates/${template.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      {template.isPdfTemplate && (
                        <Link href={`/admin/certificates/templates/manage?templateId=${template.id}`}>
                          <Button variant="outline" size="sm">
                            Place Fields
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchTemplates(false)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default function AdminCertificateTemplatesPage() {
  return (
    <ProtectedRoute adminOnly>
      <CertificateTemplatesPage />
    </ProtectedRoute>
  );
}
