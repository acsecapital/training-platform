import React, {useState, useEffect } from 'react';
import {Company } from '@/types/company.types';
import {getCompanyById, updateCompany, createCompany } from '@/services/companyService';
import {useRouter } from 'next/router';
import {Save, X, Building, Mail, Phone, MapPin, Globe, CreditCard, Users, Flag, Image } from 'lucide-react';
import {countries } from '@/utils/countries';

interface CompanyFormProps {
  companyId?: string;
  onCancel?: () => void;
  onSave?: (company: Company) => void;
  isCreating?: boolean;
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  companyId,
  onCancel,
  onSave,
  isCreating = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    industry: '',
    size: '',
    phoneNumber: '',
    address: '',
    country: '',
    billingEmail: '',
    website: '',
    subscriptionStatus: 'pending',
    subscriptionTier: 'basic',
    maxUsers: 5,
    currentUsers: 0,
});

  useEffect(() => {
    if (companyId && !isCreating) {
      fetchCompanyData();
  }
}, [companyId, isCreating]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!companyId) {
        setError('Company ID is required');
        return;
    }

      const companyData = await getCompanyById(companyId);

      if (!companyData) {
        setError('Company not found');
        return;
    }

      setFormData(companyData);
  } catch (err) {
      console.error('Error fetching company data:', err);
      setError('Failed to load company data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value } = e.target;

    // Handle numeric values
    if (name === 'maxUsers' || name === 'currentUsers') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10) || 0,
    }));
  } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
    }));
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      let savedCompany: Company;

      if (isCreating) {
        // Create new company
        savedCompany = await createCompany(formData as Omit<Company, 'id' | 'createdAt' | 'updatedAt'>);
    } else if (companyId) {
        // Update existing company
        await updateCompany(companyId, formData);
        savedCompany = {...formData, id: companyId } as Company;
    } else {
        setError('Company ID is required for updates');
        return;
    }

      if (onSave) {
        onSave(savedCompany);
    } else {
        router.push('/admin/companies');
    }
  } catch (err) {
      console.error('Error saving company data:', err);
      setError('Failed to save company data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  if (loading && !isCreating) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-8 py-5 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="text-xl font-medium text-neutral-900">
          {isCreating ? 'Create New Company' : 'Edit Company'}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="px-8 py-4 bg-red-50 border-b border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-8 py-6 space-y-8">
        {/* Company Information Section */}
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-5">Company Information</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                Company Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Company Name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-neutral-700 mb-2">
                Industry
              </label>
              <div className="relative rounded-md shadow-sm">
                <select
                  id="industry"
                  name="industry"
                  className="focus:ring-primary focus:border-primary block w-full pl-3 pr-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.industry || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Construction">Construction</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Energy">Energy</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Media">Media</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium text-neutral-700 mb-2">
                Company Size
              </label>
              <div className="relative rounded-md shadow-sm">
                <select
                  id="size"
                  name="size"
                  className="focus:ring-primary focus:border-primary block w-full pl-3 pr-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.size || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1001+">1001+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-neutral-700 mb-2">
                Logo URL
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Image className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="url"
                  name="logo"
                  id="logo"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo || ''}
                  onChange={handleInputChange}
                />
              </div>
              {formData.logo && (
                <div className="mt-3">
                  <img
                    src={formData.logo}
                    alt="Company Logo"
                    className="h-14 object-contain border border-neutral-200 rounded-md p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-logo.png';
                  }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="pt-2">
          <h3 className="text-base font-medium text-neutral-800 mb-5">Contact Information</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Phone Number"
                  value={formData.phoneNumber || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-neutral-700 mb-2">
                Website
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="url"
                  name="website"
                  id="website"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="https://example.com"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="billingEmail" className="block text-sm font-medium text-neutral-700 mb-2">
                Billing Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="email"
                  name="billingEmail"
                  id="billingEmail"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="billing@example.com"
                  value={formData.billingEmail || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-neutral-700 mb-2">
                Country
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Flag className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  name="country"
                  id="country"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.country || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-2">
                Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-neutral-400" />
                </div>
                <textarea
                  name="address"
                  id="address"
                  rows={3}
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Company Address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Details Section */}
        <div className="pt-2">
          <h3 className="text-base font-medium text-neutral-800 mb-5">Subscription Details</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 bg-neutral-50 p-6 rounded-lg">
            <div>
              <label htmlFor="subscriptionTier" className="block text-sm font-medium text-neutral-700 mb-2">
                Subscription Tier
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  id="subscriptionTier"
                  name="subscriptionTier"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 pr-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.subscriptionTier || 'basic'}
                  onChange={handleInputChange}
                  required
                >
                  <option value="basic">Basic</option>
                  <option value="apprentice">Apprentice</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="subscriptionStatus" className="block text-sm font-medium text-neutral-700 mb-2">
                Subscription Status
              </label>
              <div className="relative rounded-md shadow-sm">
                <select
                  id="subscriptionStatus"
                  name="subscriptionStatus"
                  className="focus:ring-primary focus:border-primary block w-full pl-3 pr-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.subscriptionStatus || 'pending'}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="maxUsers" className="block text-sm font-medium text-neutral-700 mb-2">
                Maximum Users
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="number"
                  name="maxUsers"
                  id="maxUsers"
                  min="1"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.maxUsers || 5}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-200 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          {isCreating ? 'Create Company' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default CompanyForm;
