import {NextApiRequest, NextApiResponse } from 'next';
import {collection, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {checkTeamProgress } from '@/services/teamNotificationService';

/**
 * Interface for team data
 */
interface TeamData {
  companyId: string;
  name: string;
  members?: string[];
  // Add other team properties as needed
}

/**
 * API endpoint to check team progress and send notifications
 * This can be called by a cron job or scheduler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  // Check for API key or other authentication
  const apiKey = req.headers['x-api-key'];
  if (!process.env.CRON_API_KEY || apiKey !== process.env.CRON_API_KEY) {
    return res.status(401).json({error: 'Unauthorized'});
}

  try {
    // Get all teams
    const teamsRef = collection(firestore, 'teams');
    const teamsSnapshot = await getDocs(teamsRef);

    if (teamsSnapshot.empty) {
      return res.status(200).json({message: 'No teams found', processed: 0});
  }

    let processedCount = 0;
    let notificationsSent = 0;

    // Process each team
    for (const teamDoc of teamsSnapshot.docs) {
      const team = teamDoc.data() as TeamData;
      const teamId = teamDoc.id;
      const companyId = team.companyId;

      // Check team progress and send notifications if needed
      const notificationSent = await checkTeamProgress(companyId, teamId);

      if (notificationSent) {
        notificationsSent++;
    }

      processedCount++;
  }

    return res.status(200).json({
      message: 'Team progress check completed',
      processed: processedCount,
      notificationsSent
  });
} catch (error) {
    console.error('Error checking team progress:', error);
    return res.status(500).json({error: 'Internal server error'});
}
}
