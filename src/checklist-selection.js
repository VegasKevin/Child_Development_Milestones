/**
 * Select from an already published catalog using an exact age in months.
 * Catalog validation and birth-date arithmetic belong to separate slices.
 * This function never changes the age, catalog, or personal records.
 */
export function selectChecklist(ageMonths, publishedChecklists) {
  if (!Number.isSafeInteger(ageMonths) || ageMonths < 0) {
    throw new RangeError('Age must be a nonnegative safe integer in months.');
  }

  if (ageMonths >= 72) {
    return {
      status: 'outside-coverage',
      checklist: null,
      preview: null,
      message: 'Checklist coverage ends at 72 months.',
    };
  }

  if (ageMonths < 2) {
    const preview = publishedChecklists.find(checklist => checklist.ageMonths === 2);
    return {
      status: 'below-coverage',
      checklist: null,
      preview: preview ? { checklist: preview, label: '2-month checklist preview' } : null,
      message: 'Checklist coverage begins at 2 months.',
    };
  }

  const checklist = publishedChecklists.reduce((selected, candidate) =>
    candidate.ageMonths <= ageMonths &&
    (!selected || candidate.ageMonths > selected.ageMonths) ? candidate : selected,
  null);

  return {
    status: checklist ? 'selected' : 'unavailable',
    checklist,
    preview: null,
    message: checklist ? null : 'No applicable published checklist is available.',
  };
}
