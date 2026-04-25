export default function AudioPlayerControls({
  audioUrl,
  isAudioPlaying,
  onPause,
  onContinue,
  audioCurrentTime,
  audioDuration,
  onSeek,
  formatAudioTime,
  audioBlocked,
  onRetryPlay,
}) {
  if (!audioUrl) {
    return null;
  }

  const safeDuration = Number.isFinite(audioDuration) ? audioDuration : 0;
  const safeCurrentTime = Number.isFinite(audioCurrentTime) ? audioCurrentTime : 0;

  return (
    <section className="audio-player-box" aria-label="kannada-audio-player">
      <p className="audio-player-title">Kannada Audio</p>

      <div className="audio-controls">
        {isAudioPlaying ? (
          <button type="button" className="audio-control-btn" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button type="button" className="audio-control-btn" onClick={onContinue}>
            Continue
          </button>
        )}
      </div>

      <div className="audio-progress-row">
        <input
          type="range"
          className="audio-progress"
          min="0"
          max={safeDuration || 0}
          step="0.1"
          value={Math.min(safeCurrentTime, safeDuration || safeCurrentTime || 0)}
          onChange={onSeek}
          disabled={!safeDuration}
          aria-label="audio-seek"
        />
        <p className="audio-time">
          {formatAudioTime(safeCurrentTime)} / {formatAudioTime(safeDuration)}
        </p>
      </div>

      {audioBlocked ? (
        <button
          type="button"
          className="audio-fallback-btn"
          onClick={onRetryPlay}
        >
          Tap to play audio
        </button>
      ) : null}
    </section>
  );
}
