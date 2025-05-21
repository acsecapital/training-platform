import {firestore as db } from './firebase';
import {
  doc,
  collection,
  onSnapshot,
  Timestamp,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  getDocs
} from 'firebase/firestore';

// Define error classes locally if they don't exist elsewhere
export enum ErrorCode {
  AUTHENTICATION = 'AUTH_ERROR',
  USER_METRICS = 'USER_METRICS_ERROR',
  TEAM_METRICS = 'TEAM_METRICS_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  FIREBASE = 'FIREBASE_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

export class BaseError extends Error {
  readonly code: ErrorCode;
  readonly timestamp: Date;
  readonly context?: Record<string, unknown>;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
}
}

export class TeamMetricsError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(`Team Metrics Error: ${message}`, ErrorCode.TEAM_METRICS, context);
}
}

import {createShardedTimestamp } from '../utils/shardedTimestamp';

interface PerformanceMetric {
  id?: string;
  operation: string;
  duration: number;
  timestamp: Timestamp;
  status: 'success' | 'error';
  metadata?: {
    userId?: string;
    companyId?: string;
    departmentId?: string;
    campaignId?: string;
    resourceType?: string;
    errorDetails?: string;
    deviceInfo?: {
      browser: string;
      os: string;
      deviceType: string;
  };
};
}

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    external: number;
};
  cpu: {
    user: number;
    system: number;
};
  timestamp: Timestamp;
}

export const performanceMonitoringService = {
  // Realtime subscription to performance metrics
  subscribeToPerformanceMetrics(
    companyId: string,
    callback: (metrics: PerformanceMetric[]) => void,
    options?: {
      operation?: string;
      status?: 'success' | 'error';
      limit?: number;
  }
  ) {
    if (!companyId) {
      throw new TeamMetricsError('Company ID is required');
  }

    let metricsQuery = query(
      collection(db, 'performanceMetrics'),
      where('metadata.companyId', '==', companyId),
      orderBy('timestamp', 'desc')
    );

    if (options?.operation) {
      metricsQuery = query(metricsQuery, where('operation', '==', options.operation));
  }

    if (options?.status) {
      metricsQuery = query(metricsQuery, where('status', '==', options.status));
  }

    if (options?.limit) {
      metricsQuery = query(metricsQuery, limit(options.limit));
  }

    return onSnapshot(metricsQuery, (snapshot) => {
      const metrics = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          operation: data.operation as string,
          duration: data.duration as number,
          timestamp: data.timestamp as Timestamp,
          status: data.status as 'success' | 'error',
          metadata: data.metadata as PerformanceMetric['metadata']
      } as PerformanceMetric;
    });
      callback(metrics);
  });
},

  // Realtime subscription to system metrics
  subscribeToSystemMetrics(
    companyId: string,
    callback: (metrics: SystemMetrics) => void
  ) {
    if (!companyId) {
      throw new TeamMetricsError('Company ID is required');
  }

    const systemMetricsRef = doc(db, 'systemMetrics', companyId);

    return onSnapshot(systemMetricsRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SystemMetrics);
    }
  });
},

  // Measure async operation performance
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: PerformanceMetric['metadata']
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;

      await this.recordMetric({
        operation,
        duration,
        timestamp: Timestamp.now(),
        status: 'success',
        metadata
    });

      return result;
  } catch (error) {
      const duration = performance.now() - start;

      await this.recordMetric({
        operation,
        duration,
        timestamp: Timestamp.now(),
        status: 'error',
        metadata: {
          ...metadata,
          errorDetails: error instanceof Error ? error.message : 'Unknown error'
      }
    });

      throw error;
  }
},

  // Record individual performance metric
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    if (!metric.metadata?.companyId) {
      throw new TeamMetricsError('Company ID is required in metadata');
  }

    try {
      // Add sharded timestamp to prevent hotspotting
      const {timestamp, shard } = createShardedTimestamp();

      const metricData = {
        ...metric,
        timestamp: metric.timestamp || Timestamp.now(),
        shard, // Add shard field
        createdAt: timestamp // Add ISO string timestamp
    };

      // Use regular addDoc for now
      const metricsRef = collection(db, 'performanceMetrics');
      await addDoc(metricsRef, metricData);
  } catch (error) {
      console.error('Error recording metric:', error);
      throw error;
  }
},

  // Get recent metrics (keeping this for backward compatibility)
  async getRecentMetrics(
    companyId: string,
    options?: {
      limit?: number;
      operation?: string;
  }
  ): Promise<PerformanceMetric[]> {
    let metricsQuery = query(
      collection(db, 'performanceMetrics'),
      where('metadata.companyId', '==', companyId),
      orderBy('timestamp', 'desc')
    );

    if (options?.limit) {
      metricsQuery = query(metricsQuery, limit(options.limit));
  }

    if (options?.operation) {
      metricsQuery = query(metricsQuery, where('operation', '==', options.operation));
  }

    const snapshot = await getDocs(metricsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        operation: data.operation as string,
        duration: data.duration as number,
        timestamp: data.timestamp as Timestamp,
        status: data.status as 'success' | 'error',
        metadata: data.metadata as PerformanceMetric['metadata']
    } as PerformanceMetric;
  });
},

  calculateAverageResponseTime(metrics: PerformanceMetric[]): number {
    if (!metrics.length) return 0;

    const totalDuration = metrics.reduce((sum, metric) =>
      sum + (metric.duration || 0), 0);

    return Math.round(totalDuration / metrics.length);
},

  calculateSuccessRate(metrics: PerformanceMetric[]): number {
    if (!metrics.length) return 0;

    const successCount = metrics.filter(m => m.status === 'success').length;
    return Math.round((successCount / metrics.length) * 100);
}
};




