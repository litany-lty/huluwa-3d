import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFilmSoundtrack, FILM_AUDIO_PATH } from '../src/core/FilmSoundtrack.js';
import { DEFAULT_MASTER, frameRange, muxArgs } from './film_mux.mjs';

class FakeMedia extends EventTarget {
  paused = true;
  ended = false;
  muted = false;
  currentTime = 0;
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}

test('the same master transport supports seek, play, pause, mute, credits and failure', async () => {
  const media = new FakeMedia();
  const failures = [];
  const audio = buildFilmSoundtrack(292, (error) => failures.push(error), media);
  assert.equal(FILM_AUDIO_PATH, DEFAULT_MASTER);
  assert.equal(media.src, DEFAULT_MASTER);
  audio.seek(18);
  assert.equal(media.currentTime, 18);
  await audio.play();
  audio.setMuted(true);
  assert.equal(media.muted, true);
  audio.seek(109.92);
  assert.deepEqual([audio.currentTime, media.paused], [109.92, false]);
  audio.pause();
  audio.seek(258);
  assert.deepEqual([audio.currentTime, media.paused], [258, true]);
  audio.seek(300);
  assert.equal(audio.currentTime, 292);
  media.ended = true;
  media.currentTime = 291.999;
  assert.equal(audio.currentTime, 292);
  media.error = new Error('missing generated soundtrack');
  media.dispatchEvent(new Event('error'));
  assert.equal(audio.failed, true);
  assert.deepEqual(failures, [media.error]);
});

test('interrupted or autoplay-blocked play is retryable', async () => {
  const media = new FakeMedia();
  const audio = buildFilmSoundtrack(292, () => assert.fail('must not record a permanent failure'), media);
  for (const name of ['AbortError', 'NotAllowedError']) {
    media.play = () => Promise.reject(Object.assign(new Error(name), { name }));
    assert.equal(await audio.play(), name);
    assert.equal(audio.failed, false);
  }
});

test('mux follows rounded video frame bounds: exact full length and nonaligned partial range', () => {
  const full = frameRange(0, 292, 24, 292);
  assert.deepEqual(full, { start: 0, end: 7008 });
  assert.ok(muxArgs('v', 'm', 'o', full, 24, 44100).includes(
    'atrim=start_sample=0:end_sample=12877200,asetpts=PTS-STARTPTS',
  ));
  const partial = frameRange(60.21, 60.475, 24, 292);
  assert.deepEqual(partial, { start: 1445, end: 1451 });
  const args = muxArgs('v', 'm', 'o', partial, 24, 44100);
  assert.ok(args.includes('atrim=start_sample=2655188:end_sample=2666213,asetpts=PTS-STARTPTS'));
  assert.ok(!args.includes('-shortest'));
  assert.throws(() => frameRange(60.21, 60.211, 24, 292), /no video frames/);
});
