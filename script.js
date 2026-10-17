
(() => {
  'use strict';
  const intro = document.getElementById('intro');
  const invite = document.getElementById('invite');
  const openButton = document.getElementById('openInvite');
  const music = document.getElementById('bgm');
  const musicButton = document.getElementById('musicBtn');
  const musicLabel = document.getElementById('musicLabel');
  let audioFailed = false;
  const syncMusic = () => {
    const playing = !music.paused;
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    musicLabel.textContent = playing ? 'Music on' : 'Music off';
  };
  music.volume = 0.35;
  music.addEventListener('play', syncMusic);
  music.addEventListener('pause', syncMusic);
  const reportAudioFailure = () => {
    audioFailed = true;
    musicButton.disabled = true;
    musicLabel.textContent = 'Music unavailable';
    musicButton.setAttribute('aria-label', 'Background music is unavailable');
    musicButton.setAttribute('aria-pressed', 'false');
  };
  music.addEventListener('error', reportAudioFailure);
  music.querySelector('source').addEventListener('error', reportAudioFailure);
  async function playMusic() {
    if (audioFailed) return;
    try { await music.play(); } catch (error) {
      if (!audioFailed) syncMusic();
    }
  }
  musicButton.addEventListener('click', () => {
    if (music.paused) playMusic(); else music.pause();
  });
  function openInvite() {
    intro.hidden = true;
    invite.hidden = false;
    musicButton.hidden = false;
    document.body.classList.remove('invite-locked');
    const title = document.querySelector('h1');
    title.setAttribute('tabindex', '-1');
    title.focus({preventScroll: true});
    playMusic();
  }
  openButton.addEventListener('click', openInvite);
  // Direct section links bypass the cover; without JS the invitation stays visible.
  if (location.hash && document.getElementById(location.hash.slice(1))) {
    musicButton.hidden = false;
    requestAnimationFrame(() => document.getElementById(location.hash.slice(1)).scrollIntoView());
  } else {
    intro.hidden = false;
    invite.hidden = true;
    document.body.classList.add('invite-locked');
  }
  document.querySelectorAll('.ganesh').forEach(img => {
    img.addEventListener('error', () => { img.hidden = true; });
    if (img.complete && img.naturalWidth === 0) img.hidden = true;
  });
  const target = new Date('2026-12-10T19:00:00+05:30').getTime();
  let timer;
  function updateCountdown() {
    const remaining = Math.max(0, target - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const values = {d: Math.floor(seconds / 86400), h: Math.floor(seconds / 3600) % 24, m: Math.floor(seconds / 60) % 60, s: seconds % 60};
    Object.entries(values).forEach(([id, value]) => {
      document.getElementById(id).textContent = String(value).padStart(2, '0');
    });
    if (!remaining) {
      document.getElementById('countdown-message').hidden = false;
      document.getElementById('countdown-message').textContent = 'With love, celebrating Adhisha & Shivasheesh — 10 December 2026.';
      if (timer) clearInterval(timer);
    }
    return remaining;
  }
  if (updateCountdown() > 0) timer = setInterval(updateCountdown, 1000);
})();
