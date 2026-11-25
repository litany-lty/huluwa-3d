// One transport for browser and offline scoring; no procedural layer on top.
export const FILM_AUDIO_PATH = './exports/film_audio.wav';

export function buildFilmSoundtrack(total, onFailure, media = new Audio()) {
  media.preload = 'metadata';
  let failed = false;
  const warn = (err) => {
    if (failed) return;
    failed = true;
    onFailure?.(err);
  };
  media.addEventListener('error', () => warn(media.error));
  media.src = FILM_AUDIO_PATH;
  return {
    get failed() { return failed; },
    get currentTime() { return media.ended ? total : media.currentTime; },
    get muted() { return media.muted; },
    setMuted(muted) { media.muted = muted; },
    seek(t) { media.currentTime = Math.max(0, Math.min(total, t)); },
    play() {
      return media.play().catch((err) => {
        // A newer pause or seek can interrupt an outstanding play request.
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') warn(err);
        return err.name;
      });
    },
    pause() { media.pause(); },
  };
}
