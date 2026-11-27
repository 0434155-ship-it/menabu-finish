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

  const formatter = new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Moscow'}).format(new Date());

  function product(group) {
    const form = group.querySelector('form');
    const option = form.querySelector('[data-flavor]')?.selectedOptions[0];
    const weight = form.querySelector('.hp-sizes input:checked');
    return {
      id: option?.value || form.dataset.item,
      name: group.dataset.category === 'panettones' ? 'Панеттоне — ' + option.textContent.trim()
        : option?.textContent.trim() || group.querySelector('h3').textContent,
      size: weight?.nextElementSibling.textContent || option?.dataset.weight || '1 шт.',
      price: Number((option || form).dataset[weight?.value || 'base']),
      description: option?.dataset.description,
      displayWeight: option?.dataset.weight
    };
  }

  function alignCarousel(group) {
    const figure = group.querySelector('[data-photo]:not([hidden])');
    const controls = group.querySelector('.hp-carousel-controls');
    const image = figure?.querySelector('img');
    if (!image || group.hidden) return;
    const bounds = figure.getBoundingClientRect();
    if (!bounds.width) return;
    const photoWidth = controls.classList.contains('hp-carousel-portrait') || !image.naturalHeight
      ? bounds.width : Math.min(bounds.width, image.clientHeight * image.naturalWidth / image.naturalHeight);
    if (photoWidth > 0) controls.style.width = photoWidth + 'px';
  }

  function showPhoto(group, offset = 0) {
    const id = product(group).id;
    const figures = [...group.querySelectorAll('[data-photo]')];
    const matching = figures.filter(figure => figure.dataset.photo === id);
    const current = matching.findIndex(figure => !figure.hidden);
    const index = (Math.max(current, 0) + offset + matching.length) % matching.length;
    figures.forEach(figure => figure.hidden = figure !== matching[index]);
    const controls = group.querySelector('.hp-carousel-controls');
    controls.classList.toggle('hp-carousel-portrait', matching[index].classList.contains('hp-image-fruit') || matching[index].classList.contains('hp-image-fruit-whole') || matching[index].classList.contains('hp-image-chocolate') || matching[index].classList.contains('hp-image-blueberry'));
    controls.hidden = matching.length < 2;
    controls.querySelector('[data-carousel-caption]').textContent =
      matching[index].querySelector('img').alt + ' · ' + (index + 1) + '/' + matching.length;
    alignCarousel(group);
  }

  function updateProduct(group) {
    const item = product(group);
    const description = group.querySelector('p[data-description]');
    if (description) description.textContent = item.description;
    const weightLabel = group.querySelector('[data-weight-label]');
    if (weightLabel) weightLabel.textContent = item.displayWeight || 'уточняется';
    group.querySelector('[data-variant-price]').textContent = rubles.format(item.price) + ' ₽';
    showPhoto(group);
  }

  groups.forEach((group, index) => {
    group.setAttribute('role', 'tabpanel');
    group.setAttribute('aria-labelledby', tabs[index].id);
    const form = group.querySelector('form');
    const quantity = form.elements.quantity;
    const pickup = form.elements.pickup;
    if (!pickup.min || pickup.min < today) pickup.min = today;
    form.querySelector('[type=submit]').disabled = false;
    function updateQuantity() {
      form.querySelector('[data-quantity-step="-1"]').disabled = !quantity.value || quantity.valueAsNumber <= 1;
      form.querySelector('[data-quantity-step="1"]').disabled = quantity.valueAsNumber >= 999;
    }
    updateProduct(group);
    updateQuantity();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => alignCarousel(group));
      group.querySelectorAll('[data-photo] img').forEach(image => observer.observe(image));
    }

    group.querySelectorAll('[data-step]').forEach(button => {
      button.addEventListener('click', () => showPhoto(group, Number(button.dataset.step)));
    });
    form.querySelectorAll('[data-quantity-step]').forEach(button => {
      button.addEventListener('click', () => {
        if (button.dataset.quantityStep === '1') quantity.stepUp(); else quantity.stepDown();
        updateQuantity();
      });
    });
    quantity.addEventListener('input', updateQuantity);
    form.addEventListener('change', event => {
      if (event.target.matches('[data-flavor], .hp-sizes input')) updateProduct(group);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const item = product(group);
      addHolidayPreorder({
        id: 'holiday-' + item.id, name: item.name, vl: item.size, price: item.price,
        pickupDate: pickup.value, opt: formatter.format(pickup.valueAsDate), pre: 'holiday'
      }, quantity.valueAsNumber);
    });
  });
  selectCategory(0);

  function openLinkedProduct() {
    const key = location.hash.slice(1).replace(/^hp-product-/, '');
    const index = groups.findIndex(group => [...group.querySelectorAll('[data-photo]')].some(photo => photo.dataset.photo === key));
    if (index === -1) return;
    selectCategory(index);
    const choice = groups[index].querySelector('[data-flavor]');
    if (choice) choice.value = key;
    updateProduct(groups[index]);
    page.querySelector('#hp-collection').scrollIntoView({block:'start'});
  }
  window.addEventListener('hashchange', openLinkedProduct);
  requestAnimationFrame(openLinkedProduct);

  const pickupPhoto = page.querySelector('.hp-pickup-motion');
  if (pickupPhoto && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      pickupPhoto.classList.add('hp-pickup-in-view');
      observer.disconnect();
    }, {threshold: .35});
    observer.observe(pickupPhoto);
  }
})();
