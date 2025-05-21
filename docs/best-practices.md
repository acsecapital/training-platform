Firestore Best Practices: Preventing Runaway Reads and Writes

Core Principles:
Think in batches, not loops: Always use batch operations for multiple writes to reduce network calls and prevent transaction failures.
Limit document size: Keep documents under 1MB and prefer shallow data structures.
Design for query efficiency: Structure data to minimize the number of queries needed for common operations.
Avoid hotspots: Distribute writes across the key range to prevent contention errors.
Cache aggressively: Implement client-side caching for frequently accessed data.

Database Design Guidelines:
Denormalize strategically: Duplicate some data to reduce query complexity, but be mindful of update costs.
Use composite keys: When appropriate, to avoid excessive subcollections.
Implement counters carefully: Use distributed counters for high-frequency updates.
Plan for scale: Consider how your data model will perform under load.

Code Implementation Rules:
Never use unbounded queries: Always use limits on queries that could return large result sets.
Avoid nested loops with database operations: This can cause exponential growth in operations.
Implement pagination: For large collections, always paginate results.
Use transactions for atomic operations: When multiple documents must be updated together.
Validate before writing: Check data validity before committing to Firestore.
Never store undefined or null values: These create problems in Firestore and the application.

Logging and Debugging Best Practices:
Avoid console logging Firestore objects: Logging document references or query results can trigger additional reads.
Use conditional logging: Only enable detailed logging in development environments.
Implement structured logging: Use a proper logging service instead of console.log for production.
Log metadata, not full documents: Log IDs and operation types rather than entire document contents.
Remove debug logging in production: Ensure development-only logging doesn't make it to production.
Use sampling for high-volume operations: Only log a percentage of operations in high-traffic scenarios.

Console Logging and Firestore Reads:
Never log Firestore document references: Logging a document reference (e.g., console.log(docRef)) can trigger a read operation when the console attempts to display the object.
Avoid logging query results directly: When you log query results (e.g., console.log(querySnapshot)), the console may trigger additional reads to display nested data.
Don't log Firestore objects in loops: This can cause exponential growth in read operations.
Use primitive values in logs: Log IDs, counts, or specific fields instead of entire Firestore objects.
Implement log levels: Use a logging utility that respects log levels and can be disabled in production.
Sanitize objects before logging: Create a sanitized version of Firestore objects that doesn't contain methods or circular references.

Example of problematic logging:
```javascript
// BAD: This can trigger additional reads
const docRef = doc(firestore, 'users', userId);
console.log('User document:', docRef);

// BAD: This logs the entire document with methods that may trigger reads
const docSnap = await getDoc(docRef);
console.log('User data:', docSnap);
```

Better approach:
```javascript
// GOOD: Log only the path
const docRef = doc(firestore, 'users', userId);
console.log('User document path:', docRef.path);

// GOOD: Log only the data
const docSnap = await getDoc(docRef);
console.log('User data:', docSnap.exists() ? docSnap.data() : 'Document not found');
```

Performance Optimization Techniques:
Use the 500/50/5 rule: Ramp up traffic gradually (500 ops/sec, increase by 50% every 5 minutes).
Implement cursor-based pagination: Instead of offset-based pagination.
Leverage compound queries: To reduce the number of separate queries.
Use appropriate index types: Create custom indexes for complex queries.
Monitor and log database operations: Track read/write counts and latency. 

Error Prevention Strategies:
Implement retry logic with exponential backoff: For handling transient errors.
Use defensive programming: Check for null/undefined before accessing properties.
Validate data types: Ensure data conforms to expected types before writing.
Handle contention gracefully: Implement strategies for high-concurrency scenarios.
