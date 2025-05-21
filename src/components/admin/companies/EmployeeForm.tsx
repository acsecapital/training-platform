import React, {useState, useEffect } from 'react';
import {Employee, Department } from '@/types/company.types';
import {getCompanyDepartments } from '@/services/companyService';
import {
  User, Mail, Phone, Building, Briefcase, MapPin,
  Shield, Image, Save, X
} from 'lucide-react';

interface EmployeeFormProps {
  companyId: string;
  employee?: Employee;
  onCancel: () => void;
  onSave: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isLoading?: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  companyId,
  employee,
  onCancel,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>({
    firstName: '',
    lastName: '',
    email: '',
    companyId: companyId,
    role: 'employee',
    status: 'active',
    jobTitle: '',
    phoneNumber: '',
    departmentId: '',
    location: '',
    bio: '',
});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments();
}, [companyId]);

  // Populate form with employee data if editing
  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        companyId: employee.companyId,
        departmentId: employee.departmentId || '',
        role: employee.role,
        status: employee.status,
        jobTitle: employee.jobTitle || '',
        phoneNumber: employee.phoneNumber || '',
        photoURL: employee.photoURL || '',
        bio: employee.bio || '',
        location: employee.location || '',
    });
  }
}, [employee]);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const fetchedDepartments = await getCompanyDepartments(companyId);
      setDepartments(fetchedDepartments);
  } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments. Please try again.');
  } finally {
      setLoadingDepartments(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
  }));
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('First name, last name, and email are required.');
      return;
  }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
  }

    // Clear any previous errors
    setError(null);

    // Submit the form
    onSave(formData);
};

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-8 py-5 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="text-xl font-medium text-neutral-900">
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </h2>
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
        {/* Personal Information Section */}
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-5">Personal Information</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                First Name *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                Last Name *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="photoURL" className="block text-sm font-medium text-neutral-700 mb-2">
                Profile Photo URL
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Image className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="url"
                  name="photoURL"
                  id="photoURL"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.photoURL || ''}
                  onChange={handleInputChange}
                />
              </div>
              {formData.photoURL && (
                <div className="mt-3">
                  <img
                    src={formData.photoURL}
                    alt="Profile"
                    className="h-14 w-14 object-cover rounded-full border border-neutral-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder-avatar.png';
                  }}
                  />
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-2">
                Bio
              </label>
              <div className="relative rounded-md shadow-sm">
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full py-3 px-4 text-sm border-neutral-300 rounded-md"
                  placeholder="Brief description about the employee"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="pt-2">
          <h3 className="text-base font-medium text-neutral-800 mb-5">Contact Information</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

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
              <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-2">
                Location
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  id="location"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information Section */}
        <div className="pt-2">
          <h3 className="text-base font-medium text-neutral-800 mb-5">Employment Information</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-neutral-700 mb-2">
                Job Title
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="jobTitle"
                  id="jobTitle"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Job Title"
                  value={formData.jobTitle || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-neutral-700 mb-2">
                Department
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  name="departmentId"
                  id="departmentId"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.departmentId || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select Department</option>
                  {loadingDepartments ? (
                    <option disabled>Loading departments...</option>
                  ) : (
                    departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Role & Status Section */}
        <div className="pt-2">
          <h3 className="text-base font-medium text-neutral-800 mb-5">Role & Status</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 bg-neutral-50 p-6 rounded-lg">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-2">
                Role *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  name="role"
                  id="role"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="manager">Manager</option>
                  <option value="instructor">Instructor</option>
                  <option value="student">Student</option>
                  <option value="employee">Employee</option>
                  <option value="sales_staff">Sales Staff</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-2">
                Status *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  name="status"
                  id="status"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-200 flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-5 py-2.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          disabled={isLoading}
        >
          <X className="h-5 w-5 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          disabled={isLoading}
        >
          <Save className="h-5 w-5 mr-2" />
          {isLoading ? 'Saving...' : 'Save Employee'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
