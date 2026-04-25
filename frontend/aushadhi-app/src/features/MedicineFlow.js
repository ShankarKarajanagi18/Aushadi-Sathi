import CameraCapture from '../CameraCapture';

function getVerdictClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'GREEN') {
    return 'verdict-card verdict-green';
  }
  if (normalized === 'YELLOW') {
    return 'verdict-card verdict-yellow';
  }
  return 'verdict-card verdict-red';
}

export default function MedicineFlow({
  screen,
  loading,
  errorMessage,
  selectedFileName,
  onCapture,
  onCameraOpen,
  onUploadOpen,
  onFileChange,
  onUploadFileChange,
  onCameraError,
  fileInputRef,
  uploadInputRef,
  resultData,
  savedAudioPath,
  onDownloadRedReport,
  audioSection,
}) {
  if (screen === 'camera') {
    return (
      <section className="camera-screen" aria-label="medicine-camera-screen">
        <p className="subtext">Scan the medicine strip or bottle label to verify authenticity.</p>

        <div className="camera-action-row">
          <button
            type="button"
            className="camera-btn"
            onClick={onCameraOpen}
            disabled={loading}
          >
            Capture With Camera
          </button>
          <button
            type="button"
            className="camera-btn upload-btn"
            onClick={onUploadOpen}
            disabled={loading}
          >
            Upload Image
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden-input"
          onChange={onFileChange}
        />
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={onUploadFileChange}
        />

        <CameraCapture onCapture={onCapture} disabled={loading} onError={onCameraError} />

        {selectedFileName ? <p className="file-name">Selected: {selectedFileName}</p> : null}

        {loading ? (
          <div className="loader-wrap" role="status" aria-live="polite">
            <div className="spinner" />
            <p>Verifying medicine...</p>
          </div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>
    );
  }

  if (screen !== 'result') {
    return null;
  }

  const scan = (resultData && resultData.scan_result) || {};
  const verdict = (resultData && resultData.verdict) || {};
  const status = String(verdict.status || 'RED').toUpperCase();

  return (
    <section className="result-screen" aria-label="medicine-result-screen">
      <h2>Medicine Verification Result</h2>

      <div className={getVerdictClass(status)}>
        <p className="status-label">{status}</p>
        <p className="status-reason">{verdict.reason || 'No additional reason provided.'}</p>
      </div>

      <div className="scan-detail">
        <h3>Scanned Details</h3>
        <p>Drug Name: {scan.drug_name || 'Unknown'}</p>
        <p>Batch Number: {scan.batch_number || 'Unknown'}</p>
        <p>Expiry Date: {scan.expiry_date || 'Unknown'}</p>
        <p>Manufacturer: {scan.manufacturer || 'Unknown'}</p>
        <p>Hologram Present: {String(scan.hologram_present)}</p>
      </div>

      <div className="kannada-box">
        <h3>Kannada Verdict</h3>
        <p>{verdict.kannada || 'Kannada verdict unavailable.'}</p>
        {savedAudioPath ? (
          <p className="audio-path">Audio saved at: {savedAudioPath}</p>
        ) : null}
      </div>

      {status === 'RED' ? (
        <button type="button" className="report-btn" onClick={onDownloadRedReport}>
          Download RED Alert Report
        </button>
      ) : null}

      {audioSection}
    </section>
  );
}
