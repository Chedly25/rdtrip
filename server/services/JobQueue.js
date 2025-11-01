/**
 * In-Memory Job Queue for Async Itinerary Generation
 *
 * This provides background processing for itinerary generation without timeouts.
 * Each job runs independently in the background and updates the database as it progresses.
 *
 * For MVP: Simple in-memory queue (resets on server restart)
 * For Scale: Upgrade to Redis Bull queue for persistence
 */

const EventEmitter = require('events');

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map(); // jobId → job metadata
    this.processing = false;
    this.currentJob = null;
  }

  /**
   * Add a new job to the queue
   * @param {string} jobId - Unique job identifier (itinerary ID)
   * @param {Function} processor - Async function to execute
   * @param {Object} metadata - Job metadata
   * @returns {Object} Job details
   */
  addJob(jobId, processor, metadata = {}) {
    const job = {
      id: jobId,
      processor,
      metadata,
      status: 'pending',
      addedAt: new Date(),
      startedAt: null,
      completedAt: null,
      error: null,
      result: null
    };

    this.jobs.set(jobId, job);
    console.log(`📋 Job ${jobId} added to queue (${this.jobs.size} total)`);

    // Start processing if not already running
    if (!this.processing) {
      this.processNext();
    }

    return job;
  }

  /**
   * Process the next job in the queue
   */
  async processNext() {
    // Find next pending job
    const nextJob = Array.from(this.jobs.values())
      .find(j => j.status === 'pending');

    if (!nextJob) {
      this.processing = false;
      console.log('✅ Job queue empty');
      return;
    }

    this.processing = true;
    this.currentJob = nextJob.id;
    nextJob.status = 'processing';
    nextJob.startedAt = new Date();

    console.log(`\n🚀 Starting job ${nextJob.id}`);
    this.emit('job:start', nextJob);

    try {
      // Execute the job processor
      const result = await nextJob.processor();

      nextJob.status = 'completed';
      nextJob.completedAt = new Date();
      nextJob.result = result;

      const duration = nextJob.completedAt - nextJob.startedAt;
      console.log(`✅ Job ${nextJob.id} completed in ${duration}ms`);
      this.emit('job:complete', nextJob);

    } catch (error) {
      nextJob.status = 'failed';
      nextJob.completedAt = new Date();
      nextJob.error = error.message;

      console.error(`❌ Job ${nextJob.id} failed:`, error.message);
      this.emit('job:error', nextJob, error);
    }

    this.currentJob = null;

    // Clean up old completed/failed jobs (keep last 100)
    this.cleanup();

    // Process next job
    setImmediate(() => this.processNext());
  }

  /**
   * Get job status
   * @param {string} jobId - Job identifier
   * @returns {Object|null} Job status or null if not found
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      status: job.status,
      metadata: job.metadata,
      addedAt: job.addedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      duration: job.completedAt
        ? job.completedAt - job.startedAt
        : job.startedAt
          ? Date.now() - job.startedAt
          : null,
      error: job.error
    };
  }

  /**
   * Remove a job from the queue
   * @param {string} jobId - Job identifier
   * @returns {boolean} True if deleted
   */
  removeJob(jobId) {
    return this.jobs.delete(jobId);
  }

  /**
   * Clean up old completed jobs
   * Keep only the last 100 completed/failed jobs
   */
  cleanup() {
    const completedJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'completed' || j.status === 'failed')
      .sort((a, b) => b.completedAt - a.completedAt);

    if (completedJobs.length > 100) {
      const toRemove = completedJobs.slice(100);
      toRemove.forEach(job => this.jobs.delete(job.id));
      console.log(`🧹 Cleaned up ${toRemove.length} old jobs`);
    }
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue stats
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      currentJob: this.currentJob
    };
  }
}

// Singleton instance
const jobQueue = new JobQueue();

module.exports = jobQueue;
