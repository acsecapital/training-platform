import {collection, doc, getDoc, getDocs, query, where, orderBy, limit, setDoc, updateDoc, increment, serverTimestamp, Timestamp, startAfter, FieldValue } from 'firebase/firestore';
import {firestore } from './firebase';
import {v4 as uuidv4 } from 'uuid';

/**
 * Interface for certificate view data
 */
export interface CertificateView {
  id: string;
  certificateId: string;
  viewedAt: string;
  viewerIp?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
}

/**
 * Interface for certificate analytics data
 */
export interface CertificateAnalytics {
  certificateId: string;
  totalViews: number;
  uniqueViews: number;
  lastViewedAt?: string;
  viewsByCountry?: Record<string, number>;
  viewsByDevice?: Record<string, number>;
  viewsByBrowser?: Record<string, number>;
  viewsByReferrer?: Record<string, number>;
  viewsTimeline?: Record<string, number>; // Date string to count
  createdAt: string;
  updatedAt: string;
}

/**
 * Track a certificate view
 */
export const trackCertificateView = async (
  certificateId: string,
  viewData: {
    viewerIp?: string;
    userAgent?: string;
    referrer?: string;
    country?: string;
    city?: string;
    deviceType?: string;
    browser?: string;
}
): Promise<void> => {
  try {
    const now = new Date();
    const viewId = uuidv4();
    const viewRef = doc(firestore, 'certificateViews', viewId);

    // Create view record
    const view: CertificateView = {
      id: viewId,
      certificateId,
      viewedAt: now.toISOString(),
      ...viewData
  };

    await setDoc(viewRef, {
      ...view,
      createdAt: serverTimestamp()
  });

    // Update analytics
    const analyticsRef = doc(firestore, 'certificateAnalytics', certificateId);
    const analyticsDoc = await getDoc(analyticsRef);

    if (analyticsDoc.exists()) {
      // Update existing analytics
      const updateData: Record<string, FieldValue | string | Timestamp> = {
        totalViews: increment(1),
        lastViewedAt: now.toISOString(),
        updatedAt: serverTimestamp()
    };

      // Update country stats
      if (viewData.country) {
        updateData[`viewsByCountry.${viewData.country}`] = increment(1);
    }

      // Update device stats
      if (viewData.deviceType) {
        updateData[`viewsByDevice.${viewData.deviceType}`] = increment(1);
    }

      // Update browser stats
      if (viewData.browser) {
        updateData[`viewsByBrowser.${viewData.browser}`] = increment(1);
    }

      // Update referrer stats
      if (viewData.referrer) {
        const referrerDomain = extractDomain(viewData.referrer);
        if (referrerDomain) {
          updateData[`viewsByReferrer.${referrerDomain}`] = increment(1);
      }
    }

      // Update timeline
      const dateString = formatDate(now);
      updateData[`viewsTimeline.${dateString}`] = increment(1);

      await updateDoc(analyticsRef, updateData);
  } else {
      // Create new analytics
      const analytics: CertificateAnalytics = {
        certificateId,
        totalViews: 1,
        uniqueViews: 1, // Will be updated by a scheduled function
        lastViewedAt: now.toISOString(),
        viewsByCountry: viewData.country ? {[viewData.country]: 1 } : {},
        viewsByDevice: viewData.deviceType ? {[viewData.deviceType]: 1 } : {},
        viewsByBrowser: viewData.browser ? {[viewData.browser]: 1 } : {},
        viewsByReferrer: viewData.referrer ? {[extractDomain(viewData.referrer) || 'unknown']: 1 } : {},
        viewsTimeline: {[formatDate(now)]: 1 },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    };

      await setDoc(analyticsRef, {
        ...analytics,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
  }
} catch (error) {
    console.error('Error tracking certificate view:', error);
}
};

/**
 * Get certificate analytics
 */
export const getCertificateAnalytics = async (certificateId: string): Promise<CertificateAnalytics | null> => {
  try {
    const analyticsRef = doc(firestore, 'certificateAnalytics', certificateId);
    const analyticsDoc = await getDoc(analyticsRef);

    if (!analyticsDoc.exists()) {
      return null;
  }

    return analyticsDoc.data() as CertificateAnalytics;
} catch (error) {
    console.error('Error getting certificate analytics:', error);
    return null;
}
};

/**
 * Get certificate views
 */
export const getCertificateViews = async (
  certificateId: string,
  options: {
    limit?: number;
    startAfter?: string;
} = {}
): Promise<CertificateView[]> => {
  try {
    const {limit: viewLimit = 50, startAfter: startAfterTimestamp } = options;

    let viewsQuery = query(
      collection(firestore, 'certificateViews'),
      where('certificateId', '==', certificateId),
      orderBy('viewedAt', 'desc'),
      limit(viewLimit)
    );

    if (startAfterTimestamp) {
      const startAfterDate = new Date(startAfterTimestamp);
      const timestampStartAfter = Timestamp.fromDate(startAfterDate);
      viewsQuery = query(
        viewsQuery,
        startAfter(timestampStartAfter)
      );
  }

    const viewsSnapshot = await getDocs(viewsQuery);

    return viewsSnapshot.docs.map(doc => doc.data() as CertificateView);
} catch (error) {
    console.error('Error getting certificate views:', error);
    return [];
}
};

/**
 * Get top viewed certificates
 */
export const getTopViewedCertificates = async (limitCount = 10): Promise<CertificateAnalytics[]> => {
  try {
    const analyticsQuery = query(
      collection(firestore, 'certificateAnalytics'),
      orderBy('totalViews', 'desc'),
      limit(limitCount)
    );

    const analyticsSnapshot = await getDocs(analyticsQuery);

    return analyticsSnapshot.docs.map(doc => doc.data() as CertificateAnalytics);
} catch (error) {
    console.error('Error getting top viewed certificates:', error);
    return [];
}
};

/**
 * Helper function to extract domain from URL
 */
const extractDomain = (url: string): string | null => {
  try {
    const domain = new URL(url).hostname;
    return domain;
} catch {
    return null;
}
};

/**
 * Helper function to format date as YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
