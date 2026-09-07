import './style.css';
import './activity.css';
import { pages, routeFromHash } from './content.js';
import { LAB_INTRO, LAB_SIGNALS } from './labs-signals.js';
import { createSignalLayer } from './signal-layer.js';
import { createActivityView } from './activity-view.js';

const article = document.querySelector('#article');
const doc = document.querySelector('#doc');
const stage = document.querySelector('#home-stage');
const motion = document.querySelector('#motion');
const status = document.querySelector('#graphics-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = matchMedia('(pointer: coarse)');
let calm = reducedMotion.matches;
let scene = null;
let graphicsFailed = false;
let desiredRoute = routeFromHash(location.hash);
let currentProgress = 0;
let projectedSignals = [];
const activityRoot = document.querySelector('#activity');
let activityDays = [], activityYear = null, activityDate = null;
const activityView = createActivityView({
  root: activityRoot,
  loadArchive: async signal => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/github-activity.json`, { signal });
    if (!response.ok) throw new Error('Activity archive unavailable');
    return response.json();
  },
  onYearChange: (days, year) => { activityDays = days; activityYear = year; scene?.setActivityDays?.(days, year); },
  onSelectionChange: date => { activityDate = date; scene?.setActivitySelection?.(date); },
});
const signalLayer = createSignalLayer({
  root: document.querySelector('#signal-layer'),
  transmission: document.querySelector('#labs-transmission'),
  fallback: document.querySelector('#signal-fallback'),
  intro: LAB_INTRO,
  signals: LAB_SIGNALS,
  coarsePointer: () => coarsePointer.matches,
});

function applyPage(key) {
  const isActivity = key === 'activity';
  const isDoc = Boolean(key) && !isActivity;
  doc.inert = true;
  activityRoot.inert = true;
  stage.inert = Boolean(key);
  document.body.classList.toggle('is-doc', isDoc);
  document.body.classList.toggle('is-activity', isActivity);
  document.body.classList.toggle('is-home', !key);
  document.body.style.overflow = key ? 'hidden' : '';
  if (isActivity) activityView.enter();
  else activityView.leave();
  if (isDoc) {
    article.innerHTML = pages[key].html;
    article.scrollTop = 0;
  }
  document.title = isActivity ? 'GitHub activity — mamonu' : key ? `${pages[key].title} — mamonu` : 'mamonu — Theodore Manassis';
  document.querySelectorAll('.compact-nav a').forEach(link => {
    if (link.hash === `#${key}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function settled(key) {
  document.body.classList.remove('is-transitioning');
  doc.inert = !key || key === 'activity';
  activityRoot.inert = key !== 'activity';
  if (key === 'activity') activityView.focus();
  else if (key) article.focus({ preventScroll: true });
  else {
    stage.inert = false;
    document.querySelector('.wordmark').focus({ preventScroll: true });
  }
}

function progress(value) {
  currentProgress = value;
  document.documentElement.style.setProperty('--progress', value);
  document.body.classList.toggle('is-deep', value > 0.15);
  document.body.classList.toggle('is-at-end', value > 0.88);
  stage.inert = value > 0.15 || Boolean(desiredRoute);
  document.querySelector('#depth').textContent = String(Math.round(value * 100)).padStart(2, '0');
  signalLayer.update(projectedSignals, value, !desiredRoute, { calm });
}

function navigate(key, push = true) {
  desiredRoute = key;
  signalLayer.update(projectedSignals, currentProgress, !key, { calm });
  const hash = key ? `#${key}` : '#home';
  if (push && location.hash !== hash) history.pushState({}, '', hash);
  if (scene && !graphicsFailed) scene.navigate(key);
  else if (graphicsFailed) {
    applyPage(key);
    doc.style.opacity = key && key !== 'activity' ? '1' : '0';
    doc.style.pointerEvents = key && key !== 'activity' ? 'auto' : 'none';
    if (!key) scrollTo(0, 0);
    settled(key);
  }
}

document.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  event.preventDefault();
  navigate(routeFromHash(link.hash));
});
addEventListener('popstate', () => navigate(routeFromHash(location.hash), false));
addEventListener('hashchange', () => navigate(routeFromHash(location.hash), false));
addEventListener('keydown', event => {
  if (event.key === 'Escape' && desiredRoute) {
    if (desiredRoute === 'activity' && activityView.clearSelection()) return;
    navigate(null);
  }
});

function updateMotion() {
  document.body.classList.toggle('calm', calm);
  motion.innerHTML = calm ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
  motion.setAttribute('aria-pressed', String(calm));
  motion.title = calm ? 'Enable the animated particle journey' : 'Switch to a still scene';
  document.querySelector('#explore-hint').textContent = calm ? 'A MOMENT OF STILLNESS' : 'MOVE TO EXPLORE';
  scene?.setCalm(calm);
  activityView.setCalm(calm);
  signalLayer.update(projectedSignals, currentProgress, !desiredRoute, { calm });
  if (!desiredRoute && calm) scrollTo(0, 0);
}
motion.addEventListener('click', () => { calm = !calm; updateMotion(); });
reducedMotion.addEventListener('change', event => { calm = event.matches; updateMotion(); });
updateMotion();

document.querySelector('#enter').addEventListener('click', () => {
  scrollTo({ top: (document.body.scrollHeight - innerHeight) * .40, behavior: calm ? 'instant' : 'smooth' });
});

function fallback() {
  graphicsFailed = true;
  scene?.dispose();
  document.body.classList.add('no-webgl');
  document.body.classList.remove('is-transitioning');
  document.querySelector('#flash').style.opacity = 0;
  document.querySelector('canvas')?.remove();
  motion.hidden = true;
  status.hidden = false;
  status.textContent = 'The 3D scene is unavailable in this browser. About, Writings, GitHub and mamonulabs links are still available.';
  signalLayer.exposeFallback();
  activityView.setGraphicsAvailable(false);
  progress(0);
  navigate(desiredRoute, false);
}

try {
  const { createScene } = await import('./scene.js');
  scene = createScene({
    initiallyCalm: calm,
    onPage: applyPage,
    onProgress: progress,
    onSignals: next => {
      projectedSignals = next;
      signalLayer.update(projectedSignals, currentProgress, !desiredRoute, { calm });
    },
    onActivity: (points, enabled) => activityView.setProjected(points, enabled && desiredRoute === 'activity'),
    onTransition: () => {
      document.body.classList.add('is-transitioning');
      stage.inert = true;
      doc.inert = true;
      activityRoot.inert = true;
    },
    onSettled: settled,
    onError: fallback,
  });
  if (activityYear) scene.setActivityDays?.(activityDays, activityYear);
  if (activityDate) scene.setActivitySelection?.(activityDate);
  if (desiredRoute) scene.navigate(desiredRoute);
} catch (error) {
  console.error('Unable to initialize the particle scene:', error);
  fallback();
}

if (import.meta.hot) import.meta.hot.dispose(() => { scene?.dispose(); signalLayer.dispose(); activityView.dispose(); });
