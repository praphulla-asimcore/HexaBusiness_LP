document.addEventListener('DOMContentLoaded', () => {
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const svgNS = 'http://www.w3.org/2000/svg';
const whenVisible = (element, onChange, rootMargin = '0px') => {
  if (!('IntersectionObserver' in window)) return onChange(true);
  new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { rootMargin }).observe(element);
};

// Glass cards: cursor spotlight, gradient edge and gentle 3D tilt.
const cardSelector = '.service-card, .capability-card, .launch-card, .leader-card, .audience-card, .industry-list > a, .industry-stats > div, .stat-grid > div, .testimonial-card, .insight-card, .podcast-note, .proof-note, .hero-glass-card, .floating-tag, .glass-form, .inner-card, .inner-post-card, .inner-story-block';
const tiltSelector = '.service-card, .capability-card, .launch-card, .leader-card, .audience-card, .insight-card, .testimonial-card, .inner-card, .inner-post-card';
const glassCards = [...document.querySelectorAll(cardSelector)];
glassCards.forEach((card) => {
  card.classList.add('glass-card');
  const glow = document.createElement('glass-glow');
  glow.className = 'glass-glow';
  glow.setAttribute('aria-hidden', 'true');
  card.append(glow);
  if (!finePointer) return;
  const tilt = !reduceMotion && card.matches(tiltSelector);
  if (tilt) card.classList.add('glass-tilt');
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = Math.max(-1, Math.min(1, (x / rect.width) * 2 - 1));
    const py = Math.max(-1, Math.min(1, (y / rect.height) * 2 - 1));
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
    card.style.setProperty('--px', px.toFixed(3));
    card.style.setProperty('--py', py.toFixed(3));
    if (!tilt) return;
    card.classList.add('is-tracking');
    card.style.setProperty('--rx', `${(-py * 4).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${(px * 5).toFixed(2)}deg`);
  });
  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-tracking');
    ['--rx', '--ry'].forEach((name) => card.style.setProperty(name, '0deg'));
    ['--px', '--py'].forEach((name) => card.style.setProperty(name, '0'));
  });
});

// Staggered reveal as cards scroll into view.
if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealTargets = glassCards.filter((card) => !card.closest('.hero') && !card.classList.contains('proof-note'));
  document.documentElement.classList.add('has-reveal');
  const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const card = entry.target;
    card.classList.add('is-revealed');
    revealObserver.unobserve(card);
    // Hand transitions back to the hover and tilt styles once the entrance has played.
    window.setTimeout(() => {
      card.removeAttribute('data-reveal');
      card.classList.remove('is-revealed');
    }, 1300);
  }), { rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach((card) => {
    const siblings = [...card.parentElement.children].filter((element) => revealTargets.includes(element));
    card.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(card), 5) * 80}ms`);
    card.dataset.reveal = '';
    revealObserver.observe(card);
  });
}

// Count stats up from zero the first time they appear.
document.querySelectorAll('.stat-grid b, .industry-stats b, .inner-stats b, .client-intro strong').forEach((stat) => {
  const node = [...stat.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
  const match = node?.textContent.match(/^(\D*)([\d,]+)(.*)$/);
  if (reduceMotion || !match) return;
  const [, prefix, value, suffix] = match;
  const target = Number(value.replace(/,/g, ''));
  // Leave founding years such as 2002 as written.
  if (!value.includes(',') && target >= 1900 && target <= 2100) return;
  const format = (number) => (value.includes(',') ? number.toLocaleString('en-US') : String(number));
  node.textContent = `${prefix}0${suffix}`;
  let counted = false;
  whenVisible(stat, (visible) => {
    if (!visible || counted) return;
    counted = true;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / 1400);
      node.textContent = `${prefix}${format(Math.round(target * (1 - (1 - progress) ** 3)))}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
});

// Magnetic controls lean towards the pointer.
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.button, .slider-controls button, .social-links a').forEach((control) => {
    control.addEventListener('pointermove', (event) => {
      const rect = control.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      control.style.translate = `${(x * 0.18).toFixed(1)}px ${(y * 0.3).toFixed(1)}px`;
    });
    control.addEventListener('pointerleave', () => {
      control.style.translate = '';
    });
  });
}

// Client names scroll as a seamless marquee.
const logoRow = document.querySelector('.logo-row');
if (logoRow && logoRow.children.length) {
  const group = document.createElement('div');
  group.className = 'logo-group';
  group.append(...logoRow.children);
  const copy = group.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  const logoTrack = document.createElement('div');
  logoTrack.className = 'logo-track';
  logoTrack.append(group, copy);
  logoRow.append(logoTrack);
}

// Reading progress along the bottom of the header.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const bar = document.createElement('span');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  siteHeader.append(bar);
  const syncProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--progress', max > 0 ? (window.scrollY / max).toFixed(4) : '0');
  };
  window.addEventListener('scroll', syncProgress, { passive: true });
  window.addEventListener('resize', syncProgress);
  syncProgress();
}

// Soft light follows the pointer across dark sections.
if (finePointer) {
  document.querySelectorAll('.hero, .industries, .locations-section, .contact-section, .inner-hero, .site-footer').forEach((section) => {
    const light = document.createElement('span');
    light.className = 'section-spotlight';
    light.setAttribute('aria-hidden', 'true');
    section.prepend(light);
    section.addEventListener('pointermove', (event) => {
      const rect = section.getBoundingClientRect();
      light.style.setProperty('--sx', `${event.clientX - rect.left}px`);
      light.style.setProperty('--sy', `${event.clientY - rect.top}px`);
    });
  });
}

// Hero visual: depth parallax, live orbit nodes and links from each satellite to the mark.
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual) {
  const hero = heroVisual.closest('.hero') || heroVisual;
  const center = heroVisual.querySelector('.hero-center');
  const satellites = [...heroVisual.querySelectorAll('.hero-glass-card, .floating-tag')];
  const linkSvg = document.createElementNS(svgNS, 'svg');
  linkSvg.classList.add('hero-links');
  linkSvg.setAttribute('aria-hidden', 'true');
  linkSvg.innerHTML = '<defs><linearGradient id="hero-link-gradient" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f06bdc"/><stop offset="1" stop-color="#6b8bff"/></linearGradient></defs>';
  const links = satellites.map(() => {
    const path = document.createElementNS(svgNS, 'path');
    path.classList.add('hero-link');
    linkSvg.append(path);
    return path;
  });
  heroVisual.prepend(linkSvg);

  const orbits = [...heroVisual.querySelectorAll('.orbit')].map((orbit, index) => {
    const nodes = [0, Math.PI * 1.1].map((phase, nodeIndex) => {
      const node = document.createElement('i');
      node.className = `orbit-node${nodeIndex ? ' node-small' : ''}`;
      orbit.append(node);
      return { node, angle: phase + index * 1.7 };
    });
    return { orbit, nodes, speed: [0.00042, -0.0003, 0.00022][index] || 0.0003 };
  });

  const depth = new Map([['.map-dots', 8], ['.orbit-a', 12], ['.orbit-b', 18], ['.orbit-c', 24], ['.hero-center', 6], ['.card-top', -30], ['.card-bottom', 26], ['.tag-left', 36], ['.tag-right', -34]]);
  const layers = [...depth].map(([selector, amount]) => ({ element: heroVisual.querySelector(selector), amount })).filter((layer) => layer.element);
  const offsetOf = (element) => layers.find((layer) => layer.element === element)?.amount || 0;
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let energy = 1;
  let energized = false;
  let running = false;
  let lastTime = performance.now();

  const setEnergized = (value) => {
    energized = value;
    heroVisual.classList.toggle('is-energized', value);
  };
  const drawLinks = () => {
    const cx = center.offsetLeft + center.offsetWidth / 2 + current.x * offsetOf(center);
    const cy = center.offsetTop + center.offsetHeight / 2 + current.y * offsetOf(center);
    satellites.forEach((satellite, index) => {
      const shift = offsetOf(satellite);
      const sx = satellite.offsetLeft + satellite.offsetWidth / 2 + current.x * shift;
      const sy = satellite.offsetTop + satellite.offsetHeight / 2 + current.y * shift;
      const qx = (cx + sx) / 2 + (sy - cy) * 0.18;
      const qy = (cy + sy) / 2 - (sx - cx) * 0.18;
      links[index].setAttribute('d', `M${cx.toFixed(1)} ${cy.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
    });
    const gradient = linkSvg.querySelector('linearGradient');
    gradient.setAttribute('x2', String(heroVisual.offsetWidth));
  };
  const frame = (now) => {
    if (!running) return;
    const delta = Math.min(50, now - lastTime);
    lastTime = now;
    if (!finePointer) {
      target.x = Math.sin(now * 0.0004) * 0.5;
      target.y = Math.cos(now * 0.00031) * 0.4;
    }
    current.x += (target.x - current.x) * 0.06;
    current.y += (target.y - current.y) * 0.06;
    energy += ((energized ? 3.2 : 1) - energy) * 0.05;
    heroVisual.style.setProperty('--hx', current.x.toFixed(3));
    heroVisual.style.setProperty('--hy', current.y.toFixed(3));
    layers.forEach(({ element, amount }) => {
      element.style.translate = `${(current.x * amount).toFixed(1)}px ${(current.y * amount).toFixed(1)}px`;
    });
    orbits.forEach(({ orbit, nodes, speed }) => {
      const rx = orbit.offsetWidth / 2;
      const ry = orbit.offsetHeight / 2;
      nodes.forEach((item) => {
        item.angle += delta * speed * energy;
        item.node.style.translate = `${(Math.cos(item.angle) * rx).toFixed(1)}px ${(Math.sin(item.angle) * ry).toFixed(1)}px`;
      });
    });
    drawLinks();
    requestAnimationFrame(frame);
  };

  if (reduceMotion) {
    orbits.forEach(({ orbit, nodes }) => nodes.forEach((item) => {
      item.node.style.translate = `${(Math.cos(item.angle) * orbit.offsetWidth / 2).toFixed(1)}px ${(Math.sin(item.angle) * orbit.offsetHeight / 2).toFixed(1)}px`;
    }));
    drawLinks();
    window.addEventListener('resize', drawLinks);
  } else {
    whenVisible(hero, (visible) => {
      if (visible === running) return;
      running = visible;
      lastTime = performance.now();
      if (running) requestAnimationFrame(frame);
    });
  }

  if (finePointer) {
    hero.addEventListener('pointermove', (event) => {
      const rect = heroVisual.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
      target.y = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)));
    });
    hero.addEventListener('pointerleave', () => {
      target.x = 0;
      target.y = 0;
    });
  }
  satellites.forEach((satellite, index) => {
    const activate = (on) => links[index].classList.toggle('is-active', on);
    satellite.addEventListener('pointerenter', () => activate(true));
    satellite.addEventListener('pointerleave', () => activate(false));
    satellite.addEventListener('focus', () => activate(true));
    satellite.addEventListener('blur', () => activate(false));
  });
  center.addEventListener('pointerenter', () => {
    setEnergized(true);
    links.forEach((link) => link.classList.add('is-active'));
  });
  center.addEventListener('pointerleave', () => {
    setEnergized(false);
    links.forEach((link) => link.classList.remove('is-active'));
  });
  center.addEventListener('click', () => {
    const ripple = document.createElement('span');
    ripple.className = 'hero-ripple';
    heroVisual.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
    if (!finePointer) {
      setEnergized(true);
      links.forEach((link) => link.classList.add('is-active'));
      window.setTimeout(() => {
        setEnergized(false);
        links.forEach((link) => link.classList.remove('is-active'));
      }, 1600);
    }
  });
}

// Proof orb: explore the three pillars around the Hexa mark.
const orb = document.querySelector('.proof-orb');
if (orb) {
  const visual = orb.closest('.proof-visual') || orb;
  const labels = [...orb.querySelectorAll('.orb-label')];
  const note = document.querySelector('.proof-note');
  const noteTitle = note?.querySelector('b');
  const noteText = note?.querySelector('small');
  let active = -1;
  let ringAngle = 0;
  let timer = 0;
  let userChose = false;
  let inView = false;

  const setActive = (index) => {
    if (index === active || !labels[index]) return;
    active = index;
    const label = labels[index];
    labels.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === index);
      item.setAttribute('aria-pressed', String(itemIndex === index));
    });
    const dx = label.offsetLeft + label.offsetWidth / 2 - orb.offsetWidth / 2;
    const dy = orb.offsetHeight / 2 - (label.offsetTop + label.offsetHeight / 2);
    const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
    ringAngle += ((angle - ringAngle + 540) % 360) - 180;
    orb.style.setProperty('--orb-angle', `${ringAngle.toFixed(1)}deg`);
    if (!note || !noteTitle || !noteText) return;
    const swap = () => {
      noteTitle.textContent = label.dataset.title;
      noteText.textContent = label.dataset.text;
      note.classList.remove('is-swapping');
    };
    if (reduceMotion) return swap();
    note.classList.add('is-swapping');
    window.setTimeout(swap, 220);
  };
  const stopCycle = () => window.clearInterval(timer);
  const startCycle = () => {
    stopCycle();
    if (reduceMotion || userChose || !inView) return;
    timer = window.setInterval(() => setActive((active + 1) % labels.length), 3800);
  };

  labels.forEach((label, index) => {
    label.setAttribute('aria-pressed', 'false');
    label.addEventListener('click', () => {
      userChose = true;
      stopCycle();
      setActive(index);
    });
    label.addEventListener('pointerenter', () => setActive(index));
    label.addEventListener('focus', () => setActive(index));
  });
  visual.addEventListener('pointerenter', stopCycle);
  visual.addEventListener('pointerleave', () => {
    orb.style.setProperty('--orx', '0deg');
    orb.style.setProperty('--ory', '0deg');
    startCycle();
  });
  if (finePointer && !reduceMotion) {
    visual.addEventListener('pointermove', (event) => {
      const rect = orb.getBoundingClientRect();
      const px = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / rect.width));
      const py = Math.max(-1, Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / rect.height));
      orb.style.setProperty('--orx', `${(-py * 14).toFixed(1)}deg`);
      orb.style.setProperty('--ory', `${(px * 14).toFixed(1)}deg`);
    });
  }
  whenVisible(orb, (visible) => {
    inView = visible;
    if (visible && active < 0 && !reduceMotion) setActive(0);
    if (visible) startCycle();
    else stopCycle();
  });
}

// Why one partner: vendors scatter around your team, then gather around Hexa.
const whyStage = document.querySelector('.why-stage');
if (whyStage) {
  const section = whyStage.closest('.why-section');
  const toggles = [...section.querySelectorAll('.why-toggle button')];
  const texts = [...section.querySelectorAll('.why-text p')];
  const chips = [...whyStage.querySelectorAll('.why-chip')];
  const core = whyStage.querySelector('.why-core');
  const lines = whyStage.querySelector('.why-lines');
  lines.innerHTML = '<defs><linearGradient id="why-gradient" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e719aa"/><stop offset="1" stop-color="#2f58ff"/></linearGradient></defs>';
  const paths = chips.map(() => {
    const path = document.createElementNS(svgNS, 'path');
    path.classList.add('why-line');
    lines.append(path);
    return path;
  });
  // Scattered, uneven positions for the usual way; an even ring for Hexa.
  const usual = [[16, 18, -7], [78, 14, 5], [90, 46, -4], [74, 84, 6], [36, 88, -5], [9, 62, 4], [50, 9, -3]];
  let mode = 'usual';
  let timer = 0;
  let userChose = false;
  let inView = false;
  let drawUntil = 0;

  const layout = () => {
    chips.forEach((chip, index) => {
      if (mode === 'usual') {
        const [x, y, tilt] = usual[index % usual.length];
        chip.style.left = `${x}%`;
        chip.style.top = `${y}%`;
        chip.style.setProperty('--tilt', `${tilt}deg`);
      } else {
        const angle = (index / chips.length) * Math.PI * 2 - Math.PI / 2;
        chip.style.left = `${50 + Math.cos(angle) * 34}%`;
        chip.style.top = `${50 + Math.sin(angle) * 32}%`;
        chip.style.setProperty('--tilt', '0deg');
      }
    });
  };
  const drawLines = () => {
    const box = whyStage.getBoundingClientRect();
    const coreBox = core.getBoundingClientRect();
    const cx = coreBox.left + coreBox.width / 2 - box.left;
    const cy = coreBox.top + coreBox.height / 2 - box.top;
    lines.querySelector('linearGradient').setAttribute('x2', String(box.width));
    chips.forEach((chip, index) => {
      const r = chip.getBoundingClientRect();
      const x = r.left + r.width / 2 - box.left;
      const y = r.top + r.height / 2 - box.top;
      const bend = mode === 'usual' ? (index % 2 ? 0.45 : -0.45) : 0;
      const qx = (cx + x) / 2 + (y - cy) * bend;
      const qy = (cy + y) / 2 - (x - cx) * bend;
      paths[index].setAttribute('d', `M${cx.toFixed(1)} ${cy.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
    });
    if (performance.now() < drawUntil) requestAnimationFrame(drawLines);
  };
  const redraw = (duration = 1300) => {
    const running = performance.now() < drawUntil;
    drawUntil = performance.now() + duration;
    if (!running) requestAnimationFrame(drawLines);
  };
  const setMode = (next) => {
    mode = next;
    whyStage.dataset.mode = next;
    toggles.forEach((button) => {
      const active = button.dataset.mode === next;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    texts.forEach((text) => {
      text.hidden = text.dataset.mode !== next;
    });
    layout();
    redraw();
  };
  const stopCycle = () => window.clearInterval(timer);
  const startCycle = () => {
    stopCycle();
    if (reduceMotion || userChose || !inView) return;
    timer = window.setInterval(() => setMode(mode === 'usual' ? 'hexa' : 'usual'), 5200);
  };
  toggles.forEach((button) => button.addEventListener('click', () => {
    userChose = true;
    stopCycle();
    setMode(button.dataset.mode);
  }));
  window.addEventListener('resize', () => redraw(50));
  setMode('usual');
  whenVisible(section, (visible) => {
    inView = visible;
    if (visible) startCycle();
    else stopCycle();
  });
}

// Design, build, run: the flow follows whichever capability is in focus.
const capabilityGrid = document.querySelector('.capability-grid');
if (capabilityGrid) {
  const capCards = [...capabilityGrid.querySelectorAll('.capability-card')];
  const steps = [...document.querySelectorAll('.cap-flow span')];
  const focus = (key) => {
    capCards.forEach((card) => card.classList.toggle('is-focus', card.dataset.cap === key));
    steps.forEach((step) => step.classList.toggle('is-active', step.dataset.step === key));
  };
  capCards.forEach((card) => {
    card.addEventListener('pointerenter', () => focus(card.dataset.cap));
    card.addEventListener('focusin', () => focus(card.dataset.cap));
    card.querySelectorAll('.cap-depends button').forEach((button) => button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      if (!target) return;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      focus(target.dataset.cap);
      target.classList.remove('is-flash');
      void target.offsetWidth;
      target.classList.add('is-flash');
    }));
  });
  capabilityGrid.addEventListener('pointerleave', () => focus(''));
}

// Case studies: tabs advance on their own until someone picks one, and numbers count up.
const work = document.querySelector('.work-section');
if (work) {
  const tabs = [...work.querySelectorAll('.work-tabs button')];
  const panels = [...work.querySelectorAll('.work-panel')];
  const duration = 8000;
  work.style.setProperty('--work-duration', `${duration}ms`);
  let active = 0;
  let timer = 0;
  let userChose = false;
  let inView = false;
  const countUp = (panel) => {
    if (reduceMotion) return;
    panel.querySelectorAll('[data-count]').forEach((number) => {
      const target = Number(number.dataset.count);
      const decimals = number.dataset.count.includes('.') ? 1 : 0;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - start) / 1200);
        number.textContent = (target * (1 - (1 - progress) ** 3)).toFixed(decimals);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };
  const show = (index) => {
    active = index;
    tabs.forEach((tab, tabIndex) => {
      tab.classList.toggle('is-active', tabIndex === index);
      tab.setAttribute('aria-selected', String(tabIndex === index));
      // Restart the progress bar on the newly active tab.
      const bar = tab.querySelector('.work-progress');
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    });
    panels.forEach((panel, panelIndex) => {
      panel.hidden = panelIndex !== index;
      panel.classList.toggle('is-active', panelIndex === index);
    });
    countUp(panels[index]);
  };
  const stopCycle = () => window.clearInterval(timer);
  const startCycle = () => {
    stopCycle();
    if (reduceMotion || userChose || !inView) return;
    timer = window.setInterval(() => show((active + 1) % tabs.length), duration);
  };
  tabs.forEach((tab, index) => tab.addEventListener('click', () => {
    userChose = true;
    stopCycle();
    work.classList.add('is-paused');
    show(index);
  }));
  const stage = work.querySelector('.work-stage');
  stage.addEventListener('pointerenter', () => {
    stopCycle();
    work.classList.add('is-paused');
  });
  stage.addEventListener('pointerleave', () => {
    if (userChose) return;
    work.classList.remove('is-paused');
    show(active);
    startCycle();
  });
  let counted = false;
  whenVisible(work, (visible) => {
    inView = visible;
    if (visible && !counted) {
      counted = true;
      show(0);
    }
    if (visible) startCycle();
    else stopCycle();
  });
}

// Locations map: list, pins and countries stay in sync with the floating glass card.
const locations = document.querySelector('.locations-section');
if (locations) {
  const panel = locations.querySelector('.locations-map');
  const svg = locations.querySelector('.map-svg');
  const card = locations.querySelector('.map-card');
  const items = [...locations.querySelectorAll('.location-item')];
  const keys = items.map((item) => item.dataset.location);
  let activeKey = '';
  let timer = 0;
  let userChose = false;
  let inView = false;

  const placeCard = () => {
    const pin = locations.querySelector(`.map-pin[data-location="${activeKey}"]`);
    if (!pin || !card || !svg) return;
    const box = svg.viewBox.baseVal;
    const { e, f } = pin.transform.baseVal.consolidate().matrix;
    const svgRect = svg.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const scale = svgRect.width / box.width;
    const pinX = svgRect.left - panelRect.left - panel.clientLeft + e * scale;
    const pinY = svgRect.top - panelRect.top - panel.clientTop + f * scale;
    const half = card.offsetWidth / 2;
    const x = Math.max(half + 8, Math.min(panel.clientWidth - half - 8, pinX));
    card.style.setProperty('--card-x', `${x}px`);
    card.style.setProperty('--card-y', `${pinY}px`);
    card.style.setProperty('--arrow-shift', `${pinX - x}px`);
    card.classList.toggle('is-below', pinY - card.offsetHeight - 30 < 0);
  };
  const setLocation = (key) => {
    if (key === activeKey) return;
    activeKey = key;
    locations.querySelectorAll('[data-location]').forEach((element) => element.classList.toggle('is-active', element.dataset.location === key));
    items.forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.location === key)));
    const item = items.find((entry) => entry.dataset.location === key);
    if (card && item) {
      card.querySelector('.map-card-code').textContent = item.dataset.code;
      card.querySelector('small').textContent = item.dataset.detail.toUpperCase();
      card.querySelector('b').textContent = item.dataset.name;
      card.querySelector('a').setAttribute('aria-label', `Talk to Hexa about ${item.dataset.name}`);
    }
    placeCard();
  };
  const stopCycle = () => window.clearInterval(timer);
  const startCycle = () => {
    stopCycle();
    if (reduceMotion || userChose || !inView) return;
    timer = window.setInterval(() => setLocation(keys[(keys.indexOf(activeKey) + 1) % keys.length]), 3200);
  };
  const choose = (key) => {
    userChose = true;
    stopCycle();
    setLocation(key);
  };

  items.forEach((item) => {
    item.addEventListener('click', () => choose(item.dataset.location));
    item.addEventListener('pointerenter', () => setLocation(item.dataset.location));
    item.addEventListener('focus', () => setLocation(item.dataset.location));
  });
  locations.querySelectorAll('.map-pin, .map-country').forEach((shape) => {
    shape.addEventListener('pointerenter', () => setLocation(shape.dataset.location));
    shape.addEventListener('click', () => choose(shape.dataset.location));
  });
  locations.addEventListener('pointerenter', stopCycle);
  locations.addEventListener('pointerleave', startCycle);
  window.addEventListener('resize', placeCard);
  setLocation(keys[0]);
  whenVisible(locations, (visible) => {
    inView = visible;
    if (visible) {
      placeCard();
      startCycle();
    } else {
      stopCycle();
    }
  });
}
});
