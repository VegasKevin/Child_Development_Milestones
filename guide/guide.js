import { releaseOne as catalog } from '/fixtures/synthetic-catalogs.js';
import { validateCatalog, linkedActivities } from '/src/catalog.js';
import { selectChecklist } from '/src/checklist-selection.js';

const app = document.querySelector('#app');
let age = null;
let preview = false;
let libraryFilters = { query: '', age: '', skill: '' };
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;',
  '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const arrow = '<span aria-hidden="true" class="row-arrow">↗</span>';
const back = (href, label) => `<a class="back-link" href="${href}"><span aria-hidden="true">←</span> ${label}</a>`;
const heading = text => `<h1 tabindex="-1" data-view-title>${escape(text)}</h1>`;

function context() {
  const selection = age === null ? null : selectChecklist(age, catalog.checkpoints);
  const checkpoint = selection?.checklist ?? (preview ? selection?.preview?.checklist : null);
  return { selection, checkpoint };
}

function ageLabel(checkpoint) {
  return preview ? `${checkpoint.ageMonths}-month checklist preview` : `Browsing at ${age} ${age === 1 ? 'month' : 'months'}`;
}

function contextBar(checkpoint) {
  return `<div class="context-bar"><span class="age-tag">${escape(ageLabel(checkpoint))}</span><a href="#/">Change age</a></div>`;
}

function sourceDetails(sourceIds) {
  return `<details class="source-details"><summary>About this demo content</summary>
    <p>These are fictional engineering fixtures, not reviewed CDC milestones or activity guidance.</p>
    <ul>${sourceIds.map(id => catalog.sources.find(source => source.id === id)).filter(Boolean)
    .map(source => `<li>${escape(source.title)}<br>${escape(source.reuseInfo)}</li>`).join('')}</ul></details>`;
}

function suitabilityLabel(activity) {
  return activity.suitability.checkpointIds
    ? activity.suitability.checkpointIds.map(id => catalog.checkpoints.find(item => item.id === id).label).join(', ')
    : `${activity.suitability.minMonths} to ${activity.suitability.maxMonths} months`;
}

function libraryScreen() {
  const { query, age: filterAge, skill } = libraryFilters;
  const months = filterAge === '' ? null : Number(filterAge);
  const checkpoint = months === null ? null : selectChecklist(months, catalog.checkpoints).checklist;
  const words = query.toLocaleLowerCase('en').trim().split(/\s+/).filter(Boolean);
  const activities = catalog.activities.filter(activity => {
    const skills = (activity.skillIds ?? []).map(id => catalog.skills.find(item => item.id === id));
    const text = [activity.title, ...activity.materials, ...activity.instructions, ...skills.map(item => item.label)]
      .join(' ').toLocaleLowerCase('en');
    const suitable = months === null || (activity.suitability.checkpointIds
      ? activity.suitability.checkpointIds.includes(checkpoint?.id)
      : months >= activity.suitability.minMonths && months <= activity.suitability.maxMonths);
    return suitable && (!skill || activity.skillIds?.includes(skill)) && words.every(word => text.includes(word));
  });
  const skills = catalog.skills.filter(item => catalog.activities.some(activity => activity.skillIds?.includes(item.id)));
  return `${heading('Activity library')}<p class="lead">Find an activity without choosing a milestone first.</p>
    <form id="library-form" class="library-form" novalidate>
      <div class="keyword-field"><label for="keyword">Search by keyword</label><input type="search" id="keyword" value="${escape(query)}" placeholder="Title, materials or instructions"></div>
      <div class="filter-age"><label for="filter-age">Filter age in months</label><input id="filter-age" type="number" min="0" step="1" inputmode="numeric" value="${escape(filterAge)}" aria-describedby="filter-help filter-error"><p class="form-help" id="filter-help">Optional. Leave blank for all ages.</p></div>
      <div class="library-actions"><button class="primary" type="submit">Search activities</button><button class="clear-button" type="button" id="clear-filters">Clear filters</button></div>
      <p id="filter-error" class="form-error" role="alert"></p>
    </form>
    <div class="library-layout"><section class="skill-panel" aria-labelledby="skills-heading"><h2 id="skills-heading">Explore by skill</h2>
      ${skills.length ? skills.map(item => `<button type="button" class="skill-tile" data-skill="${escape(item.id)}" aria-pressed="${skill === item.id}"><span>${escape(item.label)}</span><span aria-hidden="true">${skill === item.id ? 'Selected' : 'Show activities'}</span></button>`).join('') : '<p>No skill tags are listed in this catalog.</p>'}</section>
      <section class="library-results" aria-labelledby="results-heading"><div class="list-heading"><h2 id="results-heading" tabindex="-1" aria-describedby="result-count" data-result-title>Results</h2><p id="result-count" role="status" aria-live="polite">${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}</p></div>
      <ul class="content-list" aria-label="Activity results">${activities.map(activity => `<li class="library-result"><a class="content-row" href="#/library/activity/${encodeURIComponent(activity.id)}"><span>${escape(activity.title)}</span>${arrow}</a><p>${escape(suitabilityLabel(activity))}</p></li>`).join('')}</ul>
      ${activities.length ? '' : '<div class="empty-results"><h3>No activities match.</h3><p>Try another keyword, adjust the age, or clear the filters.</p></div>'}</section></div>`;
}

function dashboard() {
  const { selection, checkpoint } = context();
  const categories = checkpoint ? catalog.categories.filter(category => catalog.milestones.some(milestone =>
    milestone.checkpointId === checkpoint.id && milestone.categoryId === category.id)) : [];
  let content = '<h2 tabindex="-1" data-result-title>Start with an age.</h2><p>Enter an age in months to explore a checklist.</p>';
  if (selection) {
    if (checkpoint) {
      content = `<div class="section-heading"><h2 tabindex="-1" data-result-title>${escape(preview ? selection.preview.label : checkpoint.label)}</h2>
        <p>${preview ? 'An optional look ahead. This is a preview, not the applicable checklist.' : 'Explore a category, then open a behavior to find its linked activities.'}</p></div>
        <div class="category-grid">${categories.map(category => {
          const count = catalog.milestones.filter(milestone => milestone.checkpointId === checkpoint.id && milestone.categoryId === category.id).length;
          return `<a class="category-tile" href="#/category/${encodeURIComponent(category.id)}">
            <span class="tile-symbol" aria-hidden="true">✳</span><h3>${escape(category.label)}</h3>
            <span>${count} ${count === 1 ? 'behavior' : 'behaviors'}</span><span class="tile-bottom">View behaviors ${arrow}</span></a>`;
        }).join('')}</div>`;
    } else {
      content = `<h2 tabindex="-1" data-result-title>${selection.status === 'below-coverage' ? 'A little early for this checklist.' : 'Outside checklist coverage.'}</h2>
        <p>${escape(selection.message)}</p>${selection.preview ? '<button class="preview-button" id="preview">Preview the 2-month checklist</button>' : '<p>Choose an age from 2 to 71 months to browse this demo.</p>'}`;
    }
  }
  return `${heading('Milestones')}<p class="lead">An age. A checklist. One thing to explore.</p>
    <div class="browse-layout"><section class="age-panel" aria-labelledby="age-heading"><div class="panel-symbol" aria-hidden="true">✳</div>
      <h2 id="age-heading">Browse by age</h2><p>No child profile needed.</p>
      <form id="age-form" novalidate><label for="age">Age in months</label>
        <div class="age-input"><input id="age" name="age" type="number" inputmode="numeric" min="0" step="1" value="${age ?? ''}" aria-describedby="age-help age-error"><span>months</span></div>
        <p class="form-help" id="age-help">Use whole months, for example 6.</p><p id="age-error" class="form-error" role="alert"></p>
        <button class="primary" type="submit">Browse milestones</button></form>
      <p class="temporary-note">This age is temporary. Reloading starts fresh.</p></section>
      <section class="checklist-panel" aria-label="Checklist">${content}
        <p class="catalog-note">Demo checkpoints: 2, 4, 6 and 60 months.<br>This is an incomplete fictional catalog.</p></section></div>`;
}

function categoryScreen(category, checkpoint) {
  const milestones = catalog.milestones.filter(milestone => milestone.categoryId === category.id && milestone.checkpointId === checkpoint.id);
  return `${back('#/', 'Back to milestones')}${contextBar(checkpoint)}${heading(category.label)}
    <p class="lead">${escape(checkpoint.label)}. Open a behavior to explore it.</p>
    <ul class="content-list behavior-list">${milestones.map(milestone => `<li><a class="content-row" href="#/milestone/${encodeURIComponent(milestone.id)}"><span>${escape(milestone.sourceStatement)}</span>${arrow}</a></li>`).join('')}</ul>`;
}

function milestoneScreen(milestone, checkpoint) {
  const activities = linkedActivities(catalog, milestone.id);
  return `${back(`#/category/${encodeURIComponent(milestone.categoryId)}`, 'Back to category')}${contextBar(checkpoint)}
    <p class="content-label">Behavior</p>${heading(milestone.sourceStatement)}
    <section class="explanation"><h2>What this means</h2><p>${escape(milestone.explanation)}</p>
      <h3>For example</h3><ul>${milestone.examples.map(example => `<li>${escape(example)}</li>`).join('')}</ul></section>
    <section class="activities"><div class="list-heading"><h2>Activities to explore</h2><span>${activities.length} linked</span></div>
      ${activities.length ? `<ul class="content-list" aria-label="Linked activities">${activities.map(activity => `<li><a class="content-row" href="#/activity/${encodeURIComponent(activity.id)}/${encodeURIComponent(milestone.id)}"><span>${escape(activity.title)}</span>${arrow}</a></li>`).join('')}</ul>` : '<p>No activities are linked to this behavior yet.</p>'}</section>
    ${sourceDetails(milestone.sourceIds)}`;
}

function activityScreen(activity, milestone, checkpoint) {
  return `${milestone ? back(`#/milestone/${encodeURIComponent(milestone.id)}`, 'Back to behavior') + contextBar(checkpoint) : back('#/library', 'Back to activity library')}
    <div class="activity-heading"><p class="content-label">Activity</p>${heading(activity.title)}
      ${milestone ? `<p>Linked to ${escape(milestone.sourceStatement)}</p>` : ''}<p>Listed for: ${escape(suitabilityLabel(activity))}</p></div>
    <section class="activity-section"><h2>Materials</h2>${activity.materials.length ? `<ul>${activity.materials.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : '<p>No materials listed.</p>'}</section>
    <section class="activity-section"><h2>Steps</h2><ol class="steps">${activity.instructions.map(item => `<li>${escape(item)}</li>`).join('')}</ol></section>
    <section class="safety"><h2>Safety notes</h2>${activity.safetyWarnings.length ? `<ul>${activity.safetyWarnings.map(warning => `<li>${escape(warning)}</li>`).join('')}</ul>` : '<p>No safety warnings listed in this fictional demo.</p>'}</section>
    ${sourceDetails(activity.sourceIds)}`;
}

function unavailable() {
  return `${back('#/', 'Back to milestones')}${heading('Page unavailable')}<p>Choose an age, then open a behavior from its checklist.</p>`;
}

function render(focusResult = false) {
  const { checkpoint } = context();
  const [type, id, from] = location.hash.slice(1).split('/').filter(Boolean);
  let content;
  if (!type) content = dashboard();
  else if (type === 'library') {
    const activity = id === 'activity' && catalog.activities.find(item => item.id === from);
    content = !id ? libraryScreen() : activity ? activityScreen(activity) : unavailable();
  }
  else if (!checkpoint) content = unavailable();
  else if (type === 'category') {
    const category = catalog.categories.find(item => item.id === id);
    const hasMilestones = catalog.milestones.some(item => item.categoryId === id && item.checkpointId === checkpoint.id);
    content = category && hasMilestones ? categoryScreen(category, checkpoint) : unavailable();
  } else if (type === 'milestone') {
    const milestone = catalog.milestones.find(item => item.id === id && item.checkpointId === checkpoint.id);
    content = milestone ? milestoneScreen(milestone, checkpoint) : unavailable();
  } else if (type === 'activity') {
    const milestone = catalog.milestones.find(item => item.id === from && item.checkpointId === checkpoint.id);
    const activity = milestone && linkedActivities(catalog, milestone.id).find(item => item.id === id);
    content = activity ? activityScreen(activity, milestone, checkpoint) : unavailable();
  } else content = unavailable();
  app.innerHTML = `<header class="site-header"><a class="brand" href="#/" aria-label="Milestone guide home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Milestone guide</a><nav aria-label="Main navigation"><a href="#/" ${type !== 'library' ? 'aria-current="page"' : ''}>Milestones</a><a href="#/library" ${type === 'library' ? 'aria-current="page"' : ''}>Search</a></nav><span class="demo-tag">Local demo</span></header>
    <main id="main" tabindex="-1" class="${type && !(type === 'library' && !id) ? 'detail' : ''}">${content}</main>
    <footer>Made for exploring the flow. All checklist and activity content here is fictional.</footer>`;
  document.querySelector('#age-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.querySelector('#age');
    const value = input.value.trim();
    const months = Number(value);
    if (!value || !Number.isSafeInteger(months) || months < 0) {
      document.querySelector('#age-error').textContent = 'Enter a whole number of months, zero or above.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    age = months;
    preview = false;
    render(true);
  });
  document.querySelector('#preview')?.addEventListener('click', () => { preview = true; render(true); });
  function applyLibraryFilters(skill = libraryFilters.skill) {
    const input = document.querySelector('#filter-age');
    const value = input.value.trim();
    if (input.validity.badInput || (value && (!Number.isSafeInteger(Number(value)) || Number(value) < 0))) {
      document.querySelector('#filter-error').textContent = 'Enter a whole number of months, zero or above, or leave age blank.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    libraryFilters = { query: document.querySelector('#keyword').value, age: value, skill };
    render(true);
  }
  document.querySelector('#library-form')?.addEventListener('submit', event => { event.preventDefault(); applyLibraryFilters(); });
  document.querySelectorAll('[data-skill]').forEach(button => button.addEventListener('click', () => {
    applyLibraryFilters(libraryFilters.skill === button.dataset.skill ? '' : button.dataset.skill);
  }));
  document.querySelector('#clear-filters')?.addEventListener('click', () => {
    libraryFilters = { query: '', age: '', skill: '' };
    render(true);
  });
  if (focusResult) document.querySelector('[data-result-title]')?.focus();
  else if (location.hash) document.querySelector('[data-view-title]')?.focus();
}

try {
  validateCatalog(catalog);
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    document.querySelector('main')?.focus();
  });
  render();
  window.addEventListener('hashchange', () => render());
} catch {
  app.innerHTML = '<main><h1>Demo content is unavailable</h1><p>The fictional catalog could not be loaded. Reload to try again.</p></main>';
}
