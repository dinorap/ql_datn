const connection = require("../config/database");
const {
    ensureReviewSummaryTables,
    generateAndSaveSummary,
} = require("../services/reviewSummaryService");

const POLL_MS = 7000;
let workerTimer = null;

async function processSingleJob() {
    const [jobs] = await connection.query(
        `SELECT * FROM product_review_summary_jobs
         WHERE status = 'pending'
           AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY created_at ASC, id ASC
         LIMIT 1`
    );

    const job = jobs[0];
    if (!job) return;

    try {
        await connection.query(
            `UPDATE product_review_summary_jobs
             SET status = 'processing', attempts = attempts + 1, next_retry_at = NULL
             WHERE id = ?`,
            [job.id]
        );

        await generateAndSaveSummary(job.product_id);

        await connection.query(
            `UPDATE product_review_summary_jobs
             SET status = 'done', last_error = NULL
             WHERE id = ?`,
            [job.id]
        );
    } catch (error) {
        const retryMs = Number(error?.retryMs || 0);
        const isRateLimited = String(error?.code || "").includes("RATE_LIMITED");
        if (isRateLimited) {
            await connection.query(
                `UPDATE product_review_summary_jobs
                 SET status = 'pending',
                     last_error = ?,
                     next_retry_at = DATE_ADD(NOW(), INTERVAL ? MICROSECOND)
                 WHERE id = ?`,
                [String(error.message || error).slice(0, 2000), Math.max(retryMs, 1000) * 1000, job.id]
            );
            return;
        }

        await connection.query(
            `UPDATE product_review_summary_jobs
             SET status = 'pending', last_error = ?, next_retry_at = DATE_ADD(NOW(), INTERVAL 10 SECOND)
             WHERE id = ?`,
            [String(error.message || error).slice(0, 2000), job.id]
        );
    }
}

async function recoverFailedJobs() {
    await connection.query(
        `UPDATE product_review_summary_jobs
         SET status = 'pending'
         WHERE status = 'failed'`
    );
}

async function startReviewSummaryWorker() {
    await ensureReviewSummaryTables();
    await recoverFailedJobs();

    if (workerTimer) return;
    workerTimer = setInterval(async () => {
        try {
            await processSingleJob();
        } catch (error) {
            console.error("[review-summary-worker] loop error:", error.message);
        }
    }, POLL_MS);
}

module.exports = {
    startReviewSummaryWorker,
};
