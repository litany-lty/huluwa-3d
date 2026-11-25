# Huluwa Full Film Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Re-stage the existing nine-act film and remix the five current instrumental tracks; deliver full playback and exported masters.
**Architecture:** Shot and action changes in the existing timeline and actors; deterministic music and SFX mixed once, then used by the page and the offline exporter.
**Tech Stack:** existing Three.js r170 ESM, Python/NumPy, Chromium, FFmpeg, Node.
**Spec:** docs/superpowers/specs/2026-11-24-huluwa-remaster-design.md

## Global Constraints

18 s + 240 s + 34 s, no story or subtitle text changes, no new dialogue, no original archive audio, no new services/dependencies by default, no main or publishing. Record targeted verification in docs/remaster-verification.md; commit and push relevant code every 10 minutes when changed; keep full film and masters out of public Git absent separate authorization.

## Review Focus

- All nine acts retain ordered and complete camera coverage; chapter time starts at 18 s.
- New angles must not make character silhouettes disappear behind scenery.
- Complete renderer output must not shrink to a shorter audio duration.
- Browser play/pause/seek uses the same licensed-source mix as offline; no double music.
- Loudness-matched A/B must retain the theme and let sound effects through.

### Task 1: Visual blocking and edit
Files: src/director/StoryboardData.js, src/director/FilmDirector.js, optional src/actors/PuppetActor.js and isolated director helpers.
- [ ] Pin baseline. Write a targeted timeline assertion for boundaries 0 and 240, all nine starts, unchanged subtitles, gap-free finite camera coordinates.
- [ ] Run the assertion against the new camera data while developing and correct issues. Mark distinct physical actions and shot purposes for every act; communicate the final cues to Task 2 without changing chapter starts.
- [ ] Render matched legacy and new frames from mire, blade and summit; inspect human-readable action, silhouettes, occlusion and plot continuity. Commit only relevant changes.

### Task 2: Unified soundtrack
Files: tools/build_audio.py, src/main.js, audio-only helper, tools/render_film.mjs if needed.
- [ ] Assert exact 292 s 24 fps equivalent, cue offset 18 s, seek behavior and no overshoot/clipping. Inspect track phrasing and duration before specifying transitions.
- [ ] Generate independent music WAV and full SFX mix from existing tracks; mix headroom and cue fades without pitch/tempo changes. Use one agreed relative generated master path; story cues remain story-relative before the 18 s offset.
- [ ] Browser synchronizes to the master and never doubles legacy audio; preserve seek/pause/mute and unrendered source fallback. Verify full and partial mux alignment, no substitutions, matched-loudness excerpt comparison. Commit reproducible code and ignore masters.

### Task 3: Integration and delivery
- [ ] Integrate both on dev branch; compare shots and subtitles against baseline. Confirm one full render with decoded-stream duration and frame count, scene contrast, export tail, audio and chapter navigation.
- [ ] Deliver MP4, WAV, browser playback and comparison evidence privately. Record actual performed checks and limitations. Verify GitHub branch head; no merge or deployment.
