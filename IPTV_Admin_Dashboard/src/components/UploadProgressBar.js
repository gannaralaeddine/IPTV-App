import React from 'react';

/**
 * Format bytes into human-readable string (e.g. 10.5 MB, 1.2 GB)
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format transfer speed (debit rate) in KB/s or MB/s (Ko/s, Mo/s)
 */
export const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || bytesPerSec <= 0 || isNaN(bytesPerSec) || !isFinite(bytesPerSec)) {
        return '0 KB/s';
    }
    if (bytesPerSec < 1024) {
        return `${Math.round(bytesPerSec)} B/s`;
    }
    if (bytesPerSec < 1024 * 1024) {
        return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    }
    return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
};

/**
 * Format remaining estimated time (ETA)
 */
export const formatTimeRemaining = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
        return 'Calculating...';
    }
    const totalSecs = Math.round(seconds);
    if (totalSecs < 1) return 'Almost done...';
    if (totalSecs < 60) {
        return `${totalSecs}s remaining`;
    }
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins < 60) {
        return `${mins}m ${secs}s remaining`;
    }
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m remaining`;
};

/**
 * Helper to construct an Axios onUploadProgress handler with smooth speed and ETA calculation
 */
export const createUploadProgressHandler = (setUploadProgress, setUploadStats) => {
    const startTime = Date.now();
    let lastTime = startTime;
    let lastLoaded = 0;
    let smoothedSpeed = 0;

    return (progressEvent) => {
        const now = Date.now();
        const total = progressEvent.total || 0;
        const loaded = progressEvent.loaded || 0;
        const percent = total ? Math.round((loaded * 100) / total) : 0;
        setUploadProgress(percent);

        // Calculate debit rate / upload speed
        let currentSpeed = progressEvent.rate || 0;
        if (!currentSpeed) {
            const timeDelta = (now - lastTime) / 1000;
            if (timeDelta >= 0.25) {
                const instantSpeed = (loaded - lastLoaded) / timeDelta;
                smoothedSpeed = smoothedSpeed === 0 ? instantSpeed : 0.65 * instantSpeed + 0.35 * smoothedSpeed;
                lastTime = now;
                lastLoaded = loaded;
                currentSpeed = smoothedSpeed;
            } else {
                currentSpeed = smoothedSpeed || (loaded / ((now - startTime) / 1000 || 1));
            }
        }

        // Calculate estimated remaining time
        let estimatedSeconds = progressEvent.estimated;
        if (estimatedSeconds === undefined && currentSpeed > 0 && total > loaded) {
            estimatedSeconds = (total - loaded) / currentSpeed;
        }

        setUploadStats({
            loaded,
            total,
            speed: currentSpeed,
            estimatedTime: estimatedSeconds
        });
    };
};

/**
 * Reusable Upload Progress Bar Component with Debit Rate and Remaining Time
 *
 * @param {boolean} uploading - Whether upload is currently active
 * @param {number} progress - Upload percentage (0 to 100)
 * @param {string} fileName - Name of the file being uploaded
 * @param {number} loaded - Bytes uploaded so far
 * @param {number} total - Total file size in bytes
 * @param {number} speed - Upload throughput in bytes per second
 * @param {number} estimatedTime - Estimated remaining time in seconds
 * @param {string} statusText - Optional custom status text
 */
const UploadProgressBar = ({
    uploading = false,
    progress = 0,
    fileName = '',
    loaded = 0,
    total = 0,
    speed = 0,
    estimatedTime = null,
    statusText = ''
}) => {
    if (!uploading && progress === 0) {
        return null;
    }

    const isProcessing = progress >= 100;
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className="upload-progress-card my-3 p-3 border rounded shadow-sm bg-white">
            {/* Top row: Icon, file name, transferred / total bytes, percentage badge */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center text-truncate me-2">
                    <div className="me-2 text-primary">
                        {isProcessing ? (
                            <i className="fa-solid fa-gear fa-spin fs-5 text-info"></i>
                        ) : (
                            <i className="fa-solid fa-cloud-arrow-up fs-5 text-primary"></i>
                        )}
                    </div>
                    <div className="text-truncate">
                        <div className="fw-semibold text-truncate" style={{ maxWidth: '350px' }}>
                            {fileName ? fileName : 'Uploading file...'}
                        </div>
                        <small className="text-muted">
                            {total > 0 ? (
                                <>
                                    {formatBytes(loaded)} / {formatBytes(total)}
                                </>
                            ) : (
                                `${clampedProgress}%`
                            )}
                        </small>
                    </div>
                </div>

                <div className="text-end ms-2">
                    <span
                        className={`badge ${isProcessing ? 'bg-info' : 'bg-primary'} fs-6 px-2 py-1`}
                        style={{ minWidth: '55px' }}
                    >
                        {clampedProgress}%
                    </span>
                </div>
            </div>

            {/* Bootstrap Progress Bar Container */}
            <div
                className="progress"
                role="progressbar"
                aria-label="Upload progress"
                aria-valuenow={clampedProgress}
                aria-valuemin="0"
                aria-valuemax="100"
                style={{ height: '22px', borderRadius: '6px', backgroundColor: '#e9ecef' }}
            >
                <div
                    className={`progress-bar progress-bar-striped progress-bar-animated fw-semibold text-white ${
                        isProcessing ? 'bg-info' : 'bg-primary'
                    }`}
                    style={{
                        width: `${clampedProgress}%`,
                        transition: 'width 0.3s ease',
                        fontSize: '12px',
                        lineHeight: '22px'
                    }}
                >
                    {clampedProgress > 5 ? `${clampedProgress}%` : ''}
                </div>
            </div>

            {/* Live Metrics Row: Debit Rate (Speed) and Remaining Time (ETA) */}
            {!isProcessing && (
                <div className="mt-2 pt-1 d-flex flex-wrap justify-content-between align-items-center text-muted small bg-light p-2 rounded border">
                    <div className="d-flex align-items-center me-3 my-1">
                        <i className="fa-solid fa-gauge-high text-primary me-2 fs-6"></i>
                        <span>Upload Speed:&nbsp;</span>
                        <strong className="text-dark fw-bold">{formatSpeed(speed)}</strong>
                    </div>

                    <div className="d-flex align-items-center my-1">
                        <i className="fa-regular fa-clock text-primary me-2 fs-6"></i>
                        <span>Remaining Time:&nbsp;</span>
                        <strong className="text-dark fw-bold">{formatTimeRemaining(estimatedTime)}</strong>
                    </div>
                </div>
            )}

            {/* Status / Helper Text */}
            <div className="mt-2 d-flex align-items-center">
                {isProcessing ? (
                    <small className="text-info fw-semibold d-flex align-items-center">
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {statusText || 'Upload complete! Server is processing video and extracting duration...'}
                    </small>
                ) : (
                    <small className="text-muted d-flex align-items-center">
                        <i className="fa-solid fa-arrow-up me-1 text-primary"></i>
                        {statusText || 'Uploading to server, please keep this page open...'}
                    </small>
                )}
            </div>
        </div>
    );
};

export default UploadProgressBar;
