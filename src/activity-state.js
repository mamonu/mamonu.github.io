import { validateArchive, getYears, getYearDays } from './activity-data.js';

export function createActivityController({ loadArchive, onChange = () => {} }) {
  let state = { active: false, status: 'idle', archive: null, years: [], days: [], year: null, date: null, pinned: false };
  let pending = null, disposed = false;
  const abort = new AbortController();
  const emit = patch => { if (!disposed) { state = { ...state, ...patch }; onChange(state); } };
  function selectYear(year) {
    if (disposed || !state.years.includes(year)) return;
    const days = getYearDays(state.archive, year);
    emit({ year, days, date: days.at(-1)?.date ?? null, pinned: false });
  }
  function selectDate(date, pinned = true) {
    if (disposed || !state.days.some(day => day.date === date)) return;
    emit({ date, pinned });
  }
  return {
    get state() { return state; },
    async enter() {
      if (disposed) return;
      emit({ active: true });
      if (state.archive) return;
      if (!pending) {
        emit({ status: 'loading' });
        pending = (async () => {
          try {
            const archive = validateArchive(await loadArchive(abort.signal));
            if (disposed) return;
            const years = getYears(archive), year = years[0] ?? null;
            const days = year ? getYearDays(archive, year) : [];
            emit({ archive, years, year, days, date: days.at(-1)?.date ?? null, status: days.length ? 'ready' : 'empty' });
          } catch { emit({ status: 'error' }); }
          finally { pending = null; }
        })();
      }
      await pending;
    },
    leave() { emit({ active: false, pinned: false }); },
    selectYear,
    selectDate,
    previewDate(date) { if (!state.pinned) selectDate(date, false); },
    step(direction) {
      const index = state.days.findIndex(day => day.date === state.date);
      const day = state.days[Math.max(0, Math.min(state.days.length - 1, index + direction))];
      if (day) selectDate(day.date);
    },
    clearSelection() {
      if (disposed || !state.pinned) return false;
      emit({ pinned: false });
      return true;
    },
    dispose() { disposed = true; abort.abort(); },
  };
}
