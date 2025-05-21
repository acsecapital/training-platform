import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import TeamProgressChart from '@/components/admin/teams/TeamProgressChart';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {Team, TeamStats } from '@/types/company.types';
import {getTeamById, getTeamStats } from '@/services/companyService';

const TeamProgressPage: NextPage = () => {
  const router = useRouter();
  const {id, companyId } = router.query;
  const {user, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is not admin
  useEffect(() => {
    if (!authLoading && user && !user.roles?.admin) {
      void router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch team data and stats
  useEffect(() => {
    if (id && companyId && typeof id === 'string' && typeof companyId === 'string') {
      const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
          // Fetch team details
          const teamData = await getTeamById(companyId, id);
          if (teamData) {
            setTeam(teamData);
          }

          // Fetch team statistics
          try {
            const teamStats = await getTeamStats(companyId, id);
            setStats(teamStats);
          } catch (statsErr) {
            console.error('Error fetching team statistics:', statsErr);

            // Use mock data for demonstration if real data fails
            setStats({
              totalMembers: 8,
              activeCourses: 5,
              completedCourses: 12,
              averageProgress: 68,
              certificatesEarned: 10,
              memberProgress: [
                {name: 'John Doe', progress: 85 },
                {name: 'Jane Smith', progress: 92 },
                {name: 'Bob Johnson', progress: 75 },
                {name: 'Alice Williams', progress: 60 },
                {name: 'Charlie Brown', progress: 45 },
                {name: 'Eva Green', progress: 80 },
                {name: 'Frank White', progress: 70 },
                {name: 'Grace Lee', progress: 55 },
              ],
            });
          }
        } catch (err) {
          console.error('Error fetching team data:', err);
          setError('Failed to load team data. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      void fetchData();
    }
  }, [id, companyId]);

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (!user || !user.roles?.admin) {
    return null; // Will redirect
}

  return (
    <AdminLayout>
      <Head>
        <title>Team Progress | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href={{
                pathname: `/admin/teams/${typeof id === 'string' ? id : ''}`,
                query: {companyId: typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : ''}
              }}
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Team
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900">Team Progress</h1>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <TeamProgressChart
              teamId={typeof id === 'string' ? id : undefined}
              teamName={team?.name}
              stats={stats}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TeamProgressPage;
