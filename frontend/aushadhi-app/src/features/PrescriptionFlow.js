import CameraCapture from '../CameraCapture';

function renderMedicineList(medicines) {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return <p className="subtext">No medicines were detected in this prescription.</p>;
  }

  return (
    <ul className="medicine-list" aria-label="extracted-medicines">
      {medicines.map((medicine, index) => {
        if (typeof medicine === 'string') {
          return (
            <li className="medicine-item" key={`${medicine}-${index}`}>
              <h3>{medicine}</h3>
            </li>
          );
        }

        const name = medicine.name || medicine.medicine_name || `Medicine ${index + 1}`;
        const dosage = medicine.dosage || medicine.strength || '';
        const instruction = medicine.instruction || medicine.instructions || medicine.frequency || '';

        return (
          <li className="medicine-item" key={`${name}-${index}`}>
            <h3>{name}</h3>
            {dosage ? <p>Dosage: {dosage}</p> : null}
            {instruction ? <p>Instructions: {instruction}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function PrescriptionFlow({
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
  audioSection,
}) {
  if (screen === 'camera') {
    return (
      <section className="camera-screen" aria-label="prescription-camera-screen">
        <p className="subtext">Capture a clear prescription image or upload from your gallery.</p>

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
            <p>Processing prescription...</p>
          </div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>
    );
  }

  if (screen !== 'result') {
    return null;
  }

  return (
    <section className="result-screen" aria-label="prescription-result-screen">
      <h2>Prescription Details</h2>

      {renderMedicineList(resultData && resultData.extracted_medicines)}

      <div className="kannada-box">
        <h3>Kannada Explanation</h3>
        <p>{(resultData && resultData.kannada_explanation) || 'No explanation available.'}</p>
        {savedAudioPath ? (
          <p className="audio-path">Audio saved at: {savedAudioPath}</p>
        ) : null}
      </div>

      {audioSection}
    </section>
  );
}
