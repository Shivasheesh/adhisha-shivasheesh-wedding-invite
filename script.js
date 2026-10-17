(() => {
  'use strict';

  const intro = document.getElementById('intro');
  const invite = document.getElementById('invite');
  const openButton = document.getElementById('openInvite');

  const music = document.getElementById('bgm');
  const musicButton = document.getElementById('musicBtn');
  const musicLabel = document.getElementById('musicLabel');

  const hero = document.getElementById('home');
  const heroCanvas = document.getElementById('heroCanvas');
  const backdrop = document.getElementById('shivParvatiBackdrop');
  const weddingTitle = document.getElementById('weddingTitle');

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  let audioFailed = false;
  let invitationOpened = false;
  let celebrationStarted = false;
  let countdownTimer = null;

  const activeRevealAnimations = new Set();

  /* Music */

  function syncMusic() {
    if (!music || !musicButton || !musicLabel || audioFailed) {
      return;
    }

    const playing = !music.paused && !music.ended;

    musicButton.setAttribute('aria-pressed', String(playing));

    musicButton.setAttribute(
      'aria-label',
      playing ? 'Pause background music' : 'Play background music'
    );

    musicLabel.textContent = playing ? 'Music on' : 'Music off';
  }

  function reportAudioFailure() {
    audioFailed = true;

    if (!musicButton || !musicLabel) {
      return;
    }

    musicButton.disabled = true;
    musicButton.setAttribute('aria-pressed', 'false');

    musicButton.setAttribute(
      'aria-label',
      'Background music is unavailable'
    );

    musicLabel.textContent = 'Music unavailable';
  }

  async function playMusic() {
    if (!music || audioFailed) {
      return;
    }

    try {
      await music.play();
    } catch (error) {
      /*
        A blocked playback attempt does not necessarily mean
        the audio file is unavailable. Keep the button usable.
      */
      if (!audioFailed) {
        syncMusic();
      }
    }
  }

  if (music) {
    music.volume = 0.35;

    music.addEventListener('play', syncMusic);
    music.addEventListener('pause', syncMusic);
    music.addEventListener('ended', syncMusic);
    music.addEventListener('error', reportAudioFailure);

    const source = music.querySelector('source');

    if (source) {
      source.addEventListener('error', reportAudioFailure);
    }
  }

  if (musicButton && music) {
    musicButton.addEventListener('click', () => {
      if (music.paused) {
        void playMusic();
      } else {
        music.pause();
      }
    });
  }

  /* Hero animation */

  function startCelebration() {
    if (celebrationStarted || !hero) {
      return;
    }

    celebrationStarted = true;
    hero.classList.add('celebration-started');
  }

  /* Opening cover */

  function openInvitation() {
    if (invitationOpened) {
      return;
    }

    invitationOpened = true;

    if (intro) {
      intro.hidden = true;
    }

    if (invite) {
      invite.hidden = false;
    }

    if (musicButton) {
      musicButton.hidden = false;
    }

    document.body.classList.remove('invite-locked');

    /*
      Start audio directly from the button gesture, as in
      your original implementation.
    */
    void playMusic();

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    if (weddingTitle) {
      weddingTitle.focus({ preventScroll: true });
    }

    requestAnimationFrame(() => {
      startCelebration();
    });
  }

  if (openButton) {
    openButton.addEventListener('click', openInvitation);
  }

  function getHashTarget() {
    if (!window.location.hash) {
      return null;
    }

    try {
      const id = decodeURIComponent(
        window.location.hash.substring(1)
      );

      return document.getElementById(id);
    } catch (error) {
      return null;
    }
  }

  const hashTarget = getHashTarget();

  if (hashTarget) {
    /*
      Direct section links bypass the cover.
      They do not automatically start music.
    */
    invitationOpened = true;

    if (intro) {
      intro.hidden = true;
    }

    if (invite) {
      invite.hidden = false;
    }

    if (musicButton) {
      musicButton.hidden = false;
    }

    document.body.classList.remove('invite-locked');

    requestAnimationFrame(() => {
      startCelebration();

      hashTarget.scrollIntoView({
        behavior: 'instant',
        block: 'start'
      });
    });
  } else if (intro && invite && openButton) {
    intro.hidden = false;
    invite.hidden = true;

    document.body.classList.add('invite-locked');

    requestAnimationFrame(() => {
      openButton.focus({ preventScroll: true });
    });
  } else {
    /*
      If the cover markup is missing, leave the invitation usable.
    */
    invitationOpened = true;

    if (invite) {
      invite.hidden = false;
    }

    if (musicButton) {
      musicButton.hidden = false;
    }

    startCelebration();
  }

  /* Backdrop fallback */

  function handleBackdropFailure() {
    if (backdrop) {
      backdrop.hidden = true;
    }

    if (heroCanvas) {
      heroCanvas.classList.add('artwork-unavailable');
    }
  }

  if (backdrop) {
    backdrop.addEventListener('error', handleBackdropFailure);

    if (backdrop.complete && backdrop.naturalWidth === 0) {
      handleBackdropFailure();
    }
  }

  /* Hide missing Ganesha images without a broken-image icon. */

  document.querySelectorAll('.ganesh').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
    });

    if (image.complete && image.naturalWidth === 0) {
      image.hidden = true;
    }
  });

  /* Countdown */

  const targetTime = new Date(
    '2026-12-10T19:00:00+05:30'
  ).getTime();

  function updateCountdown() {
    const remaining = Math.max(0, targetTime - Date.now());
    const totalSeconds = Math.floor(remaining / 1000);

    const values = {
      d: Math.floor(totalSeconds / 86400),
      h: Math.floor(totalSeconds / 3600) % 24,
      m: Math.floor(totalSeconds / 60) % 60,
      s: totalSeconds % 60
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.textContent = String(value).padStart(2, '0');
      }
    });

    if (remaining === 0) {
      const message = document.getElementById('countdown-message');

      if (message) {
        message.hidden = false;
        message.textContent =
          'With love, celebrating Adhisha & Shivasheesh — ' +
          '10 December 2026.';
      }

      if (countdownTimer !== null) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }

    return remaining;
  }

  if (updateCountdown() > 0) {
    countdownTimer = window.setInterval(updateCountdown, 1000);
  }

  /* One-time section reveals; content is visible without JavaScript. */

  function revealElement(element) {
    if (
      reducedMotion.matches ||
      typeof element.animate !== 'function'
    ) {
      return;
    }

    const animation = element.animate(
      [
        {
          opacity: 0,
          transform: 'translateY(16px)'
        },
        {
          opacity: 1,
          transform: 'translateY(0)'
        }
      ],
      {
        duration: 750,
        easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        fill: 'none'
      }
    );

    activeRevealAnimations.add(animation);

    const removeAnimation = () => {
      activeRevealAnimations.delete(animation);
    };

    animation.addEventListener('finish', removeAnimation, {
      once: true
    });

    animation.addEventListener('cancel', removeAnimation, {
      once: true
    });
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          revealElement(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12
      }
    );

    document.querySelectorAll('[data-reveal]').forEach((element) => {
      revealObserver.observe(element);
    });
  }

  /* Pause decorative motion in background tabs. */

  function updatePageVisibility() {
    document.body.classList.toggle(
      'page-paused',
      document.hidden
    );

    activeRevealAnimations.forEach((animation) => {
      if (document.hidden) {
        animation.pause();
      } else if (animation.playState === 'paused') {
        animation.play();
      }
    });

    if (!document.hidden) {
      updateCountdown();
    }
  }

  document.addEventListener(
    'visibilitychange',
    updatePageVisibility
  );

  updatePageVisibility();

  /* Apply a changed reduced-motion preference immediately. */

  function handleMotionPreferenceChange() {
    if (reducedMotion.matches) {
      activeRevealAnimations.forEach((animation) => {
        animation.cancel();
      });
    }
  }

  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener(
      'change',
      handleMotionPreferenceChange
    );
  }
})();
