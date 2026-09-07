import { createActivityController } from './activity-state.js';
import { pickActivityDay } from './activity-layout.js';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const formatDate = date => dateFormat.format(new Date(`${date}T00:00:00Z`));

export function createActivityView({ root, loadArchive, onYearChange = () => {}, onSelectionChange = () => {} }) {
  root.innerHTML = `<div class="activity-heading activity-panel">
    <h1 tabindex="-1">GitHub activity</h1>
    <a class="activity-profile" href="https://github.com/mamonu" target="_blank" rel="noopener noreferrer" aria-label="Open mamonu on GitHub">@mamonu ↗</a>
  </div>
  <div class="activity-years activity-panel"><label class="sr-only" for="activity-year">Year</label><select id="activity-year" disabled></select><p class="activity-year-total"></p></div>
  <p class="activity-message activity-panel" role="status"></p><button class="activity-retry activity-panel" type="button" hidden>Try again</button>
  <div class="activity-months" aria-hidden="true"></div>
  <section class="activity-inspector activity-panel" aria-label="Explore daily contributions" hidden>
    <div class="activity-reading"><output class="activity-count"></output><p class="activity-date-copy"></p><span class="activity-pin"></span></div>
    <div class="activity-date-controls"><label class="sr-only" for="activity-date">Choose a day</label><div class="activity-date-row"><button type="button" class="activity-prev" aria-label="Previous observed day">←</button><input id="activity-date" type="date"><button type="button" class="activity-next" aria-label="Next observed day">→</button></div><p class="activity-date-help" role="status"></p><button type="button" class="activity-table-toggle" aria-expanded="false">Daily table</button></div>
  </section>
  <section class="activity-table-wrap activity-panel" aria-label="Daily contribution table" hidden><h2></h2><p class="activity-coverage"></p><table><thead><tr><th scope="col">Day</th><th scope="col">Contributions</th></tr></thead><tbody></tbody></table></section>
  <p class="activity-legend"><span></span> 1 star = 1 day <i>·</i> Brighter = more activity <i>·</i> Lines = active streaks</p>
  <p class="activity-live sr-only" aria-live="polite"></p>`;
  const find = selector => root.querySelector(selector);
  const yearSelect = find('#activity-year'), dateInput = find('#activity-date');
  const inspector = find('.activity-inspector'), tableWrap = find('.activity-table-wrap');
  let graphics = true, showTable = false, lastYear = null, lastArchive = null, lastDate = null, lastMonth = null;
  let projected = [], pickingEnabled = false;
  const monthLabels = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const month of monthNames) {
    const label = document.createElement('span'); label.className = 'activity-month'; label.textContent = month; label.hidden = true;
    find('.activity-months').append(label); monthLabels.push(label);
  }
  const listeners = new AbortController();
  function render(state) {
    root.hidden = !state.active;
    const ready = state.status === 'ready';
    yearSelect.disabled = !ready;
    inspector.hidden = !ready;
    find('.activity-retry').hidden = state.status !== 'error';
    find('.activity-message').textContent = ({ idle: '', loading: 'Loading activity…', ready: '', empty: 'No activity saved yet.', error: 'Couldn’t load activity. Try again or visit GitHub.' })[state.status];
    root.classList.toggle('activity-with-table', ready && (showTable || !graphics));
    tableWrap.hidden = !ready || (!showTable && graphics);
    find('.activity-table-toggle').textContent = showTable ? 'Close table' : 'Daily table';
    find('.activity-table-toggle').setAttribute('aria-expanded', String(!tableWrap.hidden));
    find('.activity-table-toggle').hidden = !graphics;
    find('.activity-legend').hidden = !ready || !graphics || showTable;
    if (!ready) return;
    if (lastArchive !== state.archive) {
      yearSelect.replaceChildren(...state.years.map(year => new Option(String(year), String(year))));
    }
    if (lastYear !== state.year || lastArchive !== state.archive) {
      yearSelect.value = String(state.year);
      dateInput.min = state.days[0].date;
      dateInput.max = state.days.at(-1).date;
      const total = state.days.reduce((sum, day) => sum + day.count, 0);
      find('.activity-year-total').textContent = `${total.toLocaleString('en-GB')} contributions`;
      find('.activity-coverage').textContent = `Archive ${state.archive.days[0].date.slice(0, 4)}–${state.archive.days.at(-1).date.slice(0, 4)} · Updated ${formatDate(state.archive.updatedAt.slice(0, 10))}`;
      onYearChange(state.days, state.year);
      lastMonth = null;
    }
    const day = state.days.find(day => day.date === state.date);
    dateInput.value = state.date;
    const index = state.days.indexOf(day);
    find('.activity-prev').disabled = index <= 0;
    find('.activity-next').disabled = index >= state.days.length - 1;
    find('.activity-count').textContent = `${day.count.toLocaleString('en-GB')} ${day.count === 1 ? 'contribution' : 'contributions'}`;
    find('.activity-date-copy').textContent = formatDate(day.date);
    find('.activity-pin').textContent = state.pinned ? 'Selected · Esc to clear' : '';
    if (lastDate !== state.date) {
      onSelectionChange(state.date);
      if (state.pinned) find('.activity-live').textContent = `${formatDate(day.date)}: ${day.count} contributions`;
    }
    const month = state.date.slice(0, 7);
    if (lastMonth !== month || lastArchive !== state.archive) {
      tableWrap.querySelector('h2').textContent = monthFormat.format(new Date(`${state.date}T00:00:00Z`));
      const body = tableWrap.querySelector('tbody');
      body.replaceChildren(...state.days.filter(day => day.date.startsWith(month)).map(day => {
        const row = document.createElement('tr');
        const dateCell = document.createElement('th'); dateCell.scope = 'row'; dateCell.textContent = formatDate(day.date);
        const countCell = document.createElement('td'); countCell.textContent = String(day.count);
        row.append(dateCell, countCell);
        return row;
      }));
      lastMonth = month;
    }
    lastYear = state.year; lastArchive = state.archive; lastDate = state.date;
  }
  const controller = createActivityController({ loadArchive, onChange: render });
  const on = (element, type, handler) => element.addEventListener(type, handler, { signal: listeners.signal });
  on(yearSelect, 'change', () => { find('.activity-date-help').textContent = ''; controller.selectYear(Number(yearSelect.value)); });
  on(dateInput, 'change', () => {
    const valid = controller.state.days.some(day => day.date === dateInput.value);
    find('.activity-date-help').textContent = valid ? '' : 'That day has not been archived. Choose an observed day.';
    if (valid) controller.selectDate(dateInput.value);
  });
  on(find('.activity-prev'), 'click', () => controller.step(-1));
  on(find('.activity-next'), 'click', () => controller.step(1));
  on(find('.activity-retry'), 'click', () => controller.enter());
  on(find('.activity-table-toggle'), 'click', () => { showTable = !showTable; render(controller.state); });
  function pointAt(event) {
    if (!controller.state.active || !pickingEnabled || !graphics || showTable || root.inert || event.target.closest?.('a, button, input, select, .activity-panel')) return null;
    return pickActivityDay(projected, { x: event.clientX, y: event.clientY }, event.pointerType === 'touch' ? 22 : 12);
  }
  on(window, 'pointermove', event => {
    if (event.pointerType === 'touch') return;
    const date = pointAt(event); if (date && date !== controller.state.date) controller.previewDate(date);
  });
  let pressed = null;
  on(window, 'pointerdown', event => { pressed = { x: event.clientX, y: event.clientY, date: pointAt(event) }; });
  on(window, 'pointerup', event => {
    if (pressed?.date && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) < 10 && pointAt(event)) controller.selectDate(pressed.date);
    pressed = null;
  });
  on(window, 'pointercancel', () => { pressed = null; });
  return {
    enter: () => controller.enter(),
    leave: () => controller.leave(),
    focus: () => { if (controller.state.active) find('h1').focus({ preventScroll: true }); },
    clearSelection: () => controller.clearSelection(),
    setProjected(points, enabled) {
      projected = points; pickingEnabled = enabled;
      const months = new Map(points.filter(point => point.kind === 'month').map(point => [point.month, point]));
      for (let i = 0; i < monthLabels.length; i++) {
        const point = months.get(i + 1), label = monthLabels[i];
        label.hidden = !enabled || !point?.visible || !graphics;
        if (!label.hidden) {
          label.style.left = `${point.x}px`; label.style.top = `${point.y}px`;
          label.classList.toggle('activity-month-empty', !point.hasData);
        }
      }
    },
    setCalm(value) { root.classList.toggle('activity-calm', value); },
    setGraphicsAvailable(value) { graphics = value; root.classList.toggle('activity-no-graphics', !value); render(controller.state); },
    dispose() { controller.dispose(); listeners.abort(); },
  };
}
