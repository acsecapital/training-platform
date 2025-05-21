import React, {useState, useEffect } from 'react';
import {Team, Department, Company } from '@/types/company.types';
import {createTeam, updateTeam, getCompanyDepartments, getAllCompanies } from '@/services/companyService';
import {useRouter } from 'next/router';
import {Save, X, Users, Building, User, Briefcase } from 'lucide-react';

interface TeamFormProps {
  companyId?: string;
  teamId?: string;
  initialData?: Partial<Team>;
  onCancel?: () => void;
  onSave?: (team: Team) => void;
  isCreating?: boolean;
}

const TeamForm: React.FC<TeamFormProps> = ({
  companyId,
  teamId,
  initialData,
  onCancel,
  onSave,
  isCreating = false,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Team>>({
    name: '',
    description: '',
    companyId: companyId || '',
    departmentId: '',
    managerId: '',
    ...initialData,
});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
}, []);

  useEffect(() => {
    if (formData.companyId) {
      fetchDepartments(formData.companyId);
  }
}, [formData.companyId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        companyId: initialData.companyId || companyId || '',
        departmentId: initialData.departmentId || '',
        managerId: initialData.managerId || '',
    });
  }
}, [initialData, companyId]);

  const fetchCompanies = async () => {
    try {
      const fetchedCompanies = await getAllCompanies();
      setCompanies(fetchedCompanies);

      // If we have a companyId from props and it's not in formData, set it
      if (companyId && !formData.companyId) {
        setFormData(prev => ({
          ...prev,
          companyId
      }));
    }
  } catch (err) {
      console.error('Error fetching companies:', err);
  }
};

  const fetchDepartments = async (selectedCompanyId: string) => {
    try {
      const fetchedDepartments = await getCompanyDepartments(selectedCompanyId);
      setDepartments(fetchedDepartments);
  } catch (err) {
      console.error('Error fetching departments:', err);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
  }));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!formData.name) {
        setError('Team name is required');
        setLoading(false);
        return;
    }

      if (!formData.companyId) {
        setError('Company is required');
        setLoading(false);
        return;
    }

      if (isCreating) {
        // Create new team
        const newTeam = await createTeam(formData.companyId, {
          name: formData.name,
          description: formData.description,
          departmentId: formData.departmentId,
          managerId: formData.managerId || '', // Provide empty string as fallback
          companyId: formData.companyId,
          memberIds: [], // Add memberIds if required by the Team type
      });

        setSuccess('Team created successfully');

        if (onSave) {
          onSave(newTeam);
      } else {
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/admin/teams');
        }, 1500);
      }
    } else if (teamId) {
        // Update existing team
        // For updates, we need to ensure managerId is a string if it's included
        const updatedData = {...formData };
        
        // If managerId is undefined, either remove it from the update or set to empty string
        if (updatedData.managerId === undefined) {
          // Option 1: Remove it from updates if it's optional for updates
          delete updatedData.managerId;
          
          // Option 2: Set to empty string if it's required
          // updatedData.managerId = '';
      }
        
        await updateTeam(formData.companyId, teamId, updatedData);

        setSuccess('Team updated successfully');

        if (onSave) {
          onSave({id: teamId, ...formData } as Team);
      } else {
          // Redirect after a short delay
          setTimeout(() => {
            router.push(`/admin/teams/${teamId}`);
        }, 1500);
      }
    }
  } catch (err) {
      console.error('Error saving team:', err);
      setError('Failed to save team. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
  } else {
      router.push('/admin/teams');
  }
};

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-8 py-5 border-b border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-900">Team Information</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Fill in the details below to create a new team. Teams can be assigned to departments and have members added to them.
        </p>
      </div>

      {error && (
        <div className="px-8 py-4 bg-red-50 border-b border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="px-8 py-4 bg-green-50 border-b border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Save className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                Team Name *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-neutral-300 rounded-md"
                  placeholder="Team Name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-neutral-700 mb-2">
                Company *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  id="companyId"
                  name="companyId"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-neutral-300 rounded-md"
                  value={formData.companyId || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                The company this team belongs to.
              </p>
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
                  id="departmentId"
                  name="departmentId"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-neutral-300 rounded-md"
                  value={formData.departmentId || ''}
                  onChange={handleInputChange}
                  disabled={!formData.companyId}
                >
                  <option value="">Select Department</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                {formData.companyId
                  ? "The department this team belongs to."
                  : "Select a company first to see available departments."}
              </p>
            </div>

          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                Description
              </label>
              <div>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-neutral-300 rounded-md px-3 py-2"
                  placeholder="Team description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                />
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                Brief description of the team's purpose and responsibilities.
              </p>
            </div>

            <div className="mt-8">
              <label htmlFor="managerId" className="block text-sm font-medium text-neutral-700 mb-2">
                Team Manager ID
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="managerId"
                  id="managerId"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-neutral-300 rounded-md"
                  placeholder="Manager ID"
                  value={formData.managerId || ''}
                  onChange={handleInputChange}
                />
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                User ID of the team manager. Leave blank if not assigned yet.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-neutral-200">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center px-5 py-2.5 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isCreating ? 'Create Team' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TeamForm;

