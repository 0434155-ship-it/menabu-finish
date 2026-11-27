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
    const selected = group.querySelector('.hp-variants input:checked');
    if (!selected) return;
    group.querySelectorAll('[data-photo]').forEach(photo => photo.hidden = photo.dataset.photo !== selected.value);
    const weight = group.querySelector('.hp-sizes input:checked');
    if (!weight) return;
    group.querySelectorAll('.hp-variants input').forEach(input => {
      input.closest('label').querySelector('.hp-preview-price').textContent =
        rubles.format(Number(input.dataset[weight.value])) + ' ₽';
    });
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
    const choice = [...groups[index].querySelectorAll('input[name$="-flavor"]')].find(input => input.value === key);
    if (choice) choice.checked = true;
    updateVariant(groups[index]);
    page.querySelector('#hp-collection').scrollIntoView({block:'start'});
  }
  window.addEventListener('hashchange', openLinkedProduct);
  requestAnimationFrame(openLinkedProduct);

  const scene = page.querySelector('[data-depth-scene]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  scene.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const rect = scene.getBoundingClientRect();
    scene.style.setProperty('--tilt-x', ((.5 - (event.clientY - rect.top) / rect.height) * 30).toFixed(1) + 'deg');
    scene.style.setProperty('--tilt-y', (((event.clientX - rect.left) / rect.width - .5) * 40).toFixed(1) + 'deg');
  });
  scene.addEventListener('pointerleave', () => {
    scene.style.removeProperty('--tilt-x');
    scene.style.removeProperty('--tilt-y');
  });
})();
