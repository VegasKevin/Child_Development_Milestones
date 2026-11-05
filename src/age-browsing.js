import { selectChecklist } from './checklist-selection.js';

function lastDay(year, month) {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function calendarDate(year, month, day) {
  if (!Number.isInteger(year) || year < 1 || year > 9999 ||
      !Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(day) || day < 1 || day > lastDay(year, month)) {
    throw new RangeError('Expected a valid calendar date.');
  }
  return { year, month, day };
}

function completedMonths(birth, today) {
  const months = (today.year - birth.year) * 12 + today.month - birth.month;
  return months - (today.day < Math.min(birth.day, lastDay(today.year, today.month)) ? 1 : 0);
}

function birthAge(birth, today) {
  if (!birth || typeof birth !== 'object') throw new RangeError('Birth information is required.');
  const approximate = !Object.hasOwn(birth, 'day');
  const first = calendarDate(birth.year, birth.month, approximate ? 1 : birth.day);
  const future = first.year > today.year || (first.year === today.year &&
    (first.month > today.month || (first.month === today.month && first.day > today.day)));
  if (future) throw new RangeError('Birth information cannot be wholly in the future.');
  const last = approximate ? { ...first, day: first.year === today.year && first.month === today.month
    ? today.day : lastDay(first.year, first.month) } : first;
  return { minMonths: completedMonths(last, today), maxMonths: completedMonths(first, today), approximate };
}

/** today is a device-local YYYY-MM-DD calendar date, never a UTC timestamp. */
export function browseChecklists({ profile, today, temporaryAgeMonths }, checkpoints) {
  if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new RangeError('Today must be a local YYYY-MM-DD calendar date.');
  }
  const date = calendarDate(...today.split('-').map(Number));
  const savedAge = profile ? birthAge(profile.birth, date) : null;
  const age = temporaryAgeMonths !== undefined
    ? { minMonths: temporaryAgeMonths, maxMonths: temporaryAgeMonths, approximate: false }
    : savedAge;
  if (!age) throw new RangeError('A profile or temporary age is required.');
  const selection = selectChecklist(age.minMonths, checkpoints);
  if (age.approximate && selection.status === 'selected') {
    const next = checkpoints.filter(item => item.ageMonths > age.minMonths && item.ageMonths <= age.maxMonths)
      .sort((a, b) => a.ageMonths - b.ageMonths)[0];
    if (next) selection.preview = { checklist: next, label: `${next.ageMonths}-month checklist preview` };
  }
  return { ...selection, age, childId: profile?.id ?? null };
}
