// Shared frame bounds and deterministic FFmpeg audio selection.
import { spawnSync } from 'node:child_process';
import { FILM_AUDIO_PATH } from '../src/core/FilmSoundtrack.js';

export const DEFAULT_MASTER = FILM_AUDIO_PATH;

export function frameRange(from, to, fps, total) {
  if (![from, to, fps, total].every(Number.isFinite) || fps <= 0 ||
      from < 0 || from >= to || to > total) {
    throw new Error('Expected 0 <= --from < --to <= film duration and a positive --fps.');
  }
  const start = Math.round(from * fps);
  const end = Math.round(to * fps);
  if (start >= end) throw new Error('Selected range has no video frames.');
  return { start, end };
}

export function muxArgs(video, master, out, { start, end }, fps, sr) {
  const firstSample = Math.round(start * sr / fps);
  const endSample = Math.round(end * sr / fps);
  return [
    '-y', '-v', 'error', '-i', video, '-i', master,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
    '-af', `atrim=start_sample=${firstSample}:end_sample=${endSample},asetpts=PTS-STARTPTS`,
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out,
  ];
}

export function checkMaster(path, total) {
  const { status, stdout, stderr, error } = spawnSync('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=duration_ts,time_base,sample_rate,codec_name', '-of', 'json', path,
  ], { encoding: 'utf8' });
  if (status !== 0) throw new Error(`Cannot read master ${path}. Run python3 tools/build_audio.py (or use --video-only). ${stderr || error || ''}`);
  const stream = JSON.parse(stdout).streams?.[0];
  if (!stream || !stream.codec_name.startsWith('pcm_') ||
      stream.time_base !== `1/${stream.sample_rate}` ||
      stream.duration_ts !== Math.round(total * +stream.sample_rate)) {
    throw new Error(`Expected an exact ${total} s PCM soundtrack master at ${path}.`);
  }
  return +stream.sample_rate;
}
