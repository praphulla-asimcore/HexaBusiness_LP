const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const navItems = [...document.querySelectorAll('.has-menu')];

const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  mainNav.classList.toggle('mobile-open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

navItems.forEach((item) => {
  const trigger = item.querySelector('.nav-trigger');
  trigger.addEventListener('click', () => {
    const willOpen = !item.classList.contains('menu-open');
    navItems.forEach((other) => {
      other.classList.remove('menu-open');
      other.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false');
    });
    if (willOpen) {
      item.classList.add('menu-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    navItems.forEach((item) => {
      item.classList.remove('menu-open');
      item.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false');
    });
    mainNav.classList.remove('mobile-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('menu-open');
  });
});

const searchPanel = document.querySelector('.search-panel');
const searchButton = document.querySelector('.search-button');
const searchInput = document.querySelector('#site-search');
const searchFeedback = document.querySelector('.search-feedback');
searchButton.addEventListener('click', () => {
  const open = !searchPanel.classList.contains('open');
  searchPanel.classList.toggle('open', open);
  searchPanel.setAttribute('aria-hidden', String(!open));
  if (open) searchInput.focus();
});

document.querySelector('.search-submit').addEventListener('click', () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchFeedback.textContent = 'Enter a topic to search this page.';
    searchInput.focus();
    return;
  }
  const sections = [...document.querySelectorAll('main section')];
  const match = sections.find((section) => section.innerText.toLowerCase().includes(query));
  if (match) {
    searchFeedback.textContent = `Found a match in ${match.querySelector('h1, h2, h3')?.innerText || 'this section'}.`;
    match.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      searchPanel.classList.remove('open');
      searchPanel.setAttribute('aria-hidden', 'true');
    }, 700);
  } else {
    searchFeedback.textContent = 'No match on this page. Try a service or industry name.';
  }
});
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') document.querySelector('.search-submit').click();
});

const track = document.querySelector('.testimonial-track');
const cards = [...document.querySelectorAll('.testimonial-card')];
const progress = document.querySelector('.slider-progress span');
const currentSlide = document.querySelector('.current-slide');
let activeSlide = 0;
const visibleCards = () => window.innerWidth <= 580 ? 1 : window.innerWidth <= 1050 ? 2 : 3;
const updateSlider = () => {
  const maxSlide = Math.max(0, cards.length - visibleCards());
  activeSlide = Math.min(activeSlide, maxSlide);
  const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 15;
  const offset = activeSlide * (cards[0].getBoundingClientRect().width + gap);
  track.style.transform = `translateX(-${offset}px)`;
  progress.style.width = `${((activeSlide + 1) / cards.length) * 100}%`;
  currentSlide.textContent = String(activeSlide + 1).padStart(2, '0');
};
document.querySelector('.slider-prev').addEventListener('click', () => {
  activeSlide = Math.max(0, activeSlide - 1);
  updateSlider();
});
document.querySelector('.slider-next').addEventListener('click', () => {
  activeSlide = Math.min(cards.length - visibleCards(), activeSlide + 1);
  updateSlider();
});
window.addEventListener('resize', updateSlider);
updateSlider();

const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const subject = encodeURIComponent(`Hexa Business enquiry — ${data.get('service')}`);
  const body = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${data.get('service')}\n\n${data.get('message')}`);
  document.querySelector('.form-note').textContent = 'Opening your email app with your enquiry. You can review it before sending.';
  window.location.href = `mailto:hello@hexamatics.com?subject=${subject}&body=${body}`;
});

document.querySelector('.newsletter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const feedback = document.querySelector('.newsletter-feedback');
  feedback.textContent = 'Thanks! Newsletter sign-up will be available soon.';
  event.currentTarget.reset();
});

document.querySelector('#year').textContent = new Date().getFullYear();
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    searchPanel.classList.remove('open');
    searchPanel.setAttribute('aria-hidden', 'true');
    navItems.forEach((item) => {
      item.classList.remove('menu-open');
      item.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false');
    });
    mainNav.classList.remove('mobile-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }
});
