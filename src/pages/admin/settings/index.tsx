import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CloudflareSettings from '@/components/admin/settings/CloudflareSettings';
import {Tab } from '@headlessui/react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  // Set active tab based on query parameter
  useEffect(() => {
    const {tab } = router.query;
    if (tab && !isNaN(Number(tab))) {
      setActiveTab(Number(tab));
  }
}, [router.query]);

  // Update URL when tab changes
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (index === 0) {
      router.push('/admin/settings', undefined, {shallow: true });
  } else {
      router.push(`/admin/settings?tab=${index}`, undefined, {shallow: true });
  }
};

  const tabs = [
    {name: 'General', component: <GeneralSettings /> },
    {name: 'Media', component: <MediaSettings /> },
    {name: 'Cloudflare', component: <CloudflareSettings /> },
  ];

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
            <Tab.List className="flex border-b border-neutral-200">
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  className={({selected }) =>
                    classNames(
                      'py-4 px-6 text-sm font-medium focus:outline-none',
                      selected
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    )
                }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="p-6">
              {tabs.map((tab, index) => (
                <Tab.Panel key={index}>{tab.component}</Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </AdminLayout>
  );
};

// General Settings Component
const GeneralSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-6">General Settings</h2>

      <div className="bg-white shadow-sm rounded-lg p-6 border border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Site Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Site Name
            </label>
            <input
              type="text"
              placeholder="Enter site name"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Site Description
            </label>
            <textarea
              rows={3}
              placeholder="Enter site description"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Media Settings Component
const MediaSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-6">Media Settings</h2>

      <div className="bg-white shadow-sm rounded-lg p-6 border border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Image Sizes</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Thumbnail Width (px)
              </label>
              <input
                type="number"
                placeholder="Enter width"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Thumbnail Height (px)
              </label>
              <input
                type="number"
                placeholder="Enter height"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
              />
              <span className="ml-2 text-sm text-neutral-700">
                Maintain aspect ratio
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 border border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Site Logos</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Footer Logo
            </label>
            <div className="mt-1 flex items-center">
              <span className="inline-block h-12 w-12 rounded-md overflow-hidden bg-neutral-100">
                <img
                  id="footer-logo-preview"
                  src="/assets/logo.png"
                  alt="Footer logo preview"
                  className="h-full w-full object-contain"
                />
              </span>
              <button
                type="button"
                onClick={() => window.open('/admin/media?purpose=select-footer-logo', '_blank')}
                className="ml-5 bg-white py-2 px-3 border border-neutral-300 rounded-md shadow-sm text-sm leading-4 font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Select Image
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              This logo will appear in the footer section of your site.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 border border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Storage</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Maximum File Size (MB)
            </label>
            <input
              type="number"
              placeholder="Enter maximum file size"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Allowed File Types
            </label>
            <div className="flex flex-wrap gap-2">
              {['jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf'].map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-neutral-700">{type.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function AdminSettingsPage() {
  return (
    <ProtectedRoute adminOnly>
      <SettingsPage />
    </ProtectedRoute>
  );
}
