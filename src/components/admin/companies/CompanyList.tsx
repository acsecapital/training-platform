import React, {useState, useEffect } from 'react';
import {Company } from '@/types/company.types';
import {getCompanies } from '@/services/companyService';
import {formatDate } from '@/utils/formatters';
import Link from 'next/link';
import {Search, Filter, Building, MoreHorizontal, Users, CheckCircle, XCircle } from 'lucide-react';

interface CompanyListProps {
  onCompanySelect?: (company: Company) => void;
  onCreateCompany?: () => void;
}

const CompanyList: React.FC<CompanyListProps> = ({onCompanySelect, onCreateCompany }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof Company>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchedCompanies = await getCompanies();
        setCompanies(fetchedCompanies);
        setFilteredCompanies(fetchedCompanies);
    } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Failed to load companies. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCompanies();
}, []);

  useEffect(() => {
    // Apply search and industry filter
    let filtered = companies;

    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

    if (industryFilter !== 'all') {
      filtered = filtered.filter(company =>
        company.industry.toLowerCase() === industryFilter.toLowerCase()
      );
  }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Handle date strings (like createdAt and updatedAt)
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          const aDate = new Date(aValue).getTime();
          const bDate = new Date(bValue).getTime();
          return sortDirection === 'asc'
            ? aDate - bDate
            : bDate - aDate;
      }

        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
    }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
    }

      return 0;
  });

    setFilteredCompanies(sorted);
}, [searchTerm, industryFilter, companies, sortBy, sortDirection]);

  const handleSort = (column: keyof Company) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
      setSortBy(column);
      setSortDirection('asc');
  }
};

  // Get unique industries for filter
  const industries = React.useMemo(() => {
    const uniqueIndustries = new Set<string>();
    companies.forEach(company => {
      if (company.industry) {
        uniqueIndustries.add(company.industry);
    }
  });
    return Array.from(uniqueIndustries).sort();
}, [companies]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search companies..."
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <select
              className="appearance-none block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-neutral-400" />
            </div>
          </div>

          {onCreateCompany && (
            <button
              onClick={onCreateCompany}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Building className="h-4 w-4 mr-2" />
              Add Company
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Company
                  {sortBy === 'name' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('industry')}
              >
                <div className="flex items-center">
                  Industry
                  {sortBy === 'industry' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center">
                  Size
                  {sortBy === 'size' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Subscription
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Users
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Created
                  {sortBy === 'createdAt' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-neutral-500">
                  No companies found
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {company.logo ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={company.logo}
                            alt={company.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                            {company.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {company.name}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {company.country || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{company.industry}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{company.size}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {company.subscriptionStatus === 'active' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                          <span className="text-sm text-neutral-900 capitalize">{company.subscriptionTier}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-yellow-500 mr-1.5" />
                          <span className="text-sm text-neutral-900 capitalize">{company.subscriptionStatus}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-neutral-400 mr-1.5" />
                      <span className="text-sm text-neutral-900">
                        {company.currentUsers} / {company.maxUsers}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(company.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/companies/${company.id}/edit`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/companies/${company.id}?tab=employees`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Employees
                      </Link>
                      <button
                        onClick={() => onCompanySelect && onCompanySelect(company)}
                        className="text-neutral-400 hover:text-neutral-500"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyList;

