(() => {
  'use strict';
  const page = document.getElementById('hp-page');
  if (!page) return;
  const embedded = page.hasAttribute('data-embedded');
  const menu = document.getElementById('mobileNav');
  const toggle = document.getElementById('menuToggle');
  if (!embedded && menu && toggle) {
    function setMenu(open) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }
    toggle.addEventListener('click', () => setMenu(menu.hidden));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) {
        setMenu(false);
        toggle.focus();
      }
    });
  }
  const tabs = [...page.querySelectorAll('[role="tab"]')];
  const tablist = page.querySelector('.hp-category-tabs');
  const groups = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const rubles = new Intl.NumberFormat('ru-RU');
  tablist.hidden = false;

  function selectCategory(index) {
    tabs.forEach((tab, position) => {
      const active = index === position;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      groups[position].hidden = !active;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCategory(index));
    tab.addEventListener('keydown', event => {
      const next = {ArrowLeft:(index + tabs.length - 1) % tabs.length, ArrowRight:(index + 1) % tabs.length, Home:0, End:tabs.length - 1}[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectCategory(next);
      tabs[next].focus();
    });
  });

  function updateVariant(group) {
    const selected = group.querySelector('[data-flavor]')?.selectedOptions[0];
    if (!selected) return;
    group.querySelectorAll('[data-photo]').forEach(photo => photo.hidden = photo.dataset.photo !== selected.value);
    group.querySelector('[data-description]').textContent = selected.dataset.description;
    const weight = group.querySelector('.hp-sizes input:checked')?.value || 'base';
    group.querySelector('[data-variant-price]').textContent = rubles.format(Number(selected.dataset[weight])) + ' ₽';
  }

  groups.forEach((group, index) => {
    group.setAttribute('role', 'tabpanel');
    group.setAttribute('aria-labelledby', tabs[index].id);
    updateVariant(group);
    group.addEventListener('change', () => updateVariant(group));
  });
  selectCategory(0);

  function openLinkedProduct() {
    const key = location.hash.slice(1).replace(/^hp-product-/, '');
    const index = groups.findIndex(group => [...group.querySelectorAll('[data-photo]')].some(photo => photo.dataset.photo === key));
    if (index === -1) return;
    selectCategory(index);
    const choice = groups[index].querySelector('[data-flavor]');
    if (choice) choice.value = key;
    updateVariant(groups[index]);
    page.querySelector('#hp-collection').scrollIntoView({block:'start'});
  }
  window.addEventListener('hashchange', openLinkedProduct);
  requestAnimationFrame(openLinkedProduct);

})();
