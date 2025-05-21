/**
 * Sharded Timestamp Utility
 *
 * This utility implements sharded timestamps for Firestore to prevent
 * write limitations on sequential timestamp fields.
 *
 * Based on Firestore best practices:
 * https://firebase.google.com/docs/firestore/best-practices#shard-timestamp
 */

// Define shard values (can be increased for higher write throughput)
const SHARDS = ["a", "b", "c", "d", "e"];

/**
 * Get a random shard value
 * @return {string} A random shard value
 */
export const getRandomShard = (): string => {
  return SHARDS[Math.floor(Math.random() * SHARDS.length)];
};

/**
 * Create a sharded timestamp object for Firestore
 * @return {Object} Object with timestamp and shard
 */
export const createShardedTimestamp = (): {
  timestamp: string;
  shard: string;
} => {
  return {
    timestamp: new Date().toISOString(),
    shard: getRandomShard(),
};
};

/**
 * Get all shard values for querying
 * @return {string[]} Array of all shard values
 */
export const getAllShards = (): string[] => {
  return [...SHARDS];
};

/**
 * Create a composite index field that combines shard and timestamp
 * This is useful for sorting across shards
 * @return {Object} Object with composite sharded timestamp
 */
export const createCompositeTimestamp = (): {
  shardedTimestamp: string;
} => {
  const shard = getRandomShard();
  const timestamp = new Date().toISOString();

  return {
    shardedTimestamp: `${shard}_${timestamp}`,
};
};