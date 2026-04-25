const state = {
  user: null,
  access: { plan: 'Тестовый доступ', remaining: 5, unlimited: false, expiresAt: '2026-05-15' },
  cases: JSON.parse(localStorage.getItem('passport_cases') || '[]'),
  promoCodes: { TEST5: { remaining: 5 }, DEMO20: { remaining: 20 }, UNLIM30: { unlimited: true, days: 30 } },
  currentView: 'landing',
  currentCaseId: null,
};

const automationRecipes = {
  cadastral: {
    title: 'Поиск кадастрового номера по адресу',
    run: item => item.address ? `Найден автоматически по адресу: черновой номер 77:01:${Math.floor(Math.random()*900000)+100000}:${Math.floor(Math.random()*90)+10}` : 'Нужен адрес объекта для автопоиска'
  },
  bankruptcy: {
    title: 'Проверка банкротства',
    run: item => item.sellerName ? `Автопроверка выполнена по ${item.sellerName}. Совпадений в черновом сценарии не найдено.` : 'Нужны данные продавца'
  },
  courts: {
    title: 'Проверка судебных сведений',
    run: item => item.sellerName ? `Проверены судебные сведения по ${item.sellerName}. Критичных совпадений не выявлено.` : 'Нужны данные продавца'
  },
  object: {
    title: 'Проверка объекта',
    run: item => item.address ? `Автопроверка объекта по адресу выполнена. Базовая карточка объекта сформирована.` : 'Нужен адрес объекта'
  },
  fssp: {
    title: 'ФССП',
    captcha: true,
    run: item => item.sellerName ? `Полуавтомат: источник ФССП требует подтверждение капчи для ${item.sellerName}.` : 'Нужны данные продавца'
  }
};

const checkSections = [
  ['passport', 'Паспорт продавца'],
  ['inn', 'ИНН'],
  ['fssp', 'Исполнительные производства'],
  ['wanted', 'Розыск'],
  ['bankruptcy', 'Банкротство'],
  ['courts', 'Судебные сведения'],
  ['object', 'Сведения по объекту'],
  ['limits', 'Ограничения и обременения'],
  ['authority', 'Полномочия продавца'],
  ['risks', 'Выявленные риски'],
  ['advice', 'Рекомендации'],
];

function saveCases() {
  localStorage.setItem('passport_cases', JSON.stringify(state.cases));
}

function saveAccess() {
  localStorage.setItem('passport_access', JSON.stringify(state.access));
}

function loadAccess() {
  const saved = localStorage.getItem('passport_access');
  if (saved) state.access = JSON.parse(saved);
}

function uid() {
  return 'c' + Math.random().toString(36).slice(2, 10);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).filter(Boolean).forEach(child => {
    node.append(child.nodeType ? child : document.createTextNode(child));
  });
  return node;
}

function appLayout(content) {
  const shell = el('div', { class: 'app-shell' }, [
    el('div', { class: 'topbar' }, [
      el('div', { class: 'brand' }, [
        el('img', { class: 'brand-logo', src: 'logo-passport.jpg', alt: 'Логотип' }),
        'Паспорт безопасности объекта'
      ]),
      el('div', { class: 'actions' }, [
        el('span', { class: 'badge' }, state.user ? `Лимит: ${state.access.unlimited ? 'безлимит' : state.access.remaining}` : 'PWA demo'),
        state.user
          ? el('button', { class: 'btn btn-secondary', onclick: () => { state.user = null; state.currentView = 'landing'; render(); } }, 'Выйти')
          : el('button', { class: 'btn btn-secondary', onclick: loginDemo }, 'Войти через ВК')
      ])
    ]),
    content,
    el('div', { class: 'footer-note' }, 'Черновой MVP PWA. Быстрая версия для просмотра структуры и сценария.')
  ]);
  return shell;
}

function landingView() {
  return appLayout(el('div', {}, [
    el('section', { class: 'card hero' }, [
      el('div', { class: 'hero-brand' }, [
        el('img', { class: 'hero-logo', src: 'logo-passport.jpg', alt: 'Логотип Паспорта безопасности объекта' }),
        el('div', { class: 'hero-kicker' }, 'Для риелтора и клиента')
      ]),
      el('h1', {}, 'Паспорт безопасности объекта'),
      el('p', { class: 'hero-lead' }, 'Понятный отчёт по объекту недвижимости: что проверено, какие риски выявлены и что важно учесть перед сделкой.'),
      el('p', {}, 'Удобный способ оформить результат проверки объекта в понятном виде и показать клиенту реальную проделанную работу.'),
      el('div', { class: 'actions hero-actions' }, [
        el('button', { class: 'btn btn-primary', onclick: () => { state.currentView = 'simple'; render(); } }, 'Попробовать бесплатно'),
        el('button', { class: 'btn btn-secondary', onclick: loginDemo }, 'Войти через ВК'),
        el('button', { class: 'btn btn-ghost', onclick: () => { const code = prompt('Введите промокод'); activatePromo(code); } }, 'Активировать промокод')
      ])
    ]),
    el('section', { class: 'grid grid-3 feature-grid' }, [
      infoCard('Что это такое', 'Сервис помогает риелтору показать клиенту, какие проверки были проведены, какие риски выявлены и что рекомендуется уточнить перед сделкой.', 'feature-card'),
      infoCard('Что входит', 'Паспорт продавца, ИНН, ФССП, банкротство, суды, сведения по объекту, ограничения, риски и рекомендации.', 'feature-card'),
      infoCard('Что получает клиент', 'Понятный PDF «Паспорт безопасности объекта» для работы с клиентом и подготовки объекта к продаже.', 'feature-card')
    ]),
    el('section', { class: 'grid grid-3' }, [
      tariffCard('Простой', 'Быстрая первичная проверка. Результат на экране, без PDF.', false, 'Попробовать', () => { state.currentView = 'simple'; render(); }),
      tariffCard('Оптимальный', 'Основной продукт сервиса. PDF с результатами проверок, рисками и рекомендациями.', true, 'Открыть кабинет', loginDemo),
      tariffCard('Профессиональный', 'Расширенная ручная проверка для сложных случаев.', false, 'Оставить запрос', () => alert('В MVP это отдельный ручной сценарий.'))
    ]),
    el('section', { class: 'grid grid-2' }, [
      infoCard('Почему это полезно риелтору', 'Помогает показать клиенту реальную работу по объекту, зафиксировать проведённые проверки до сделки и подготовить объект к продаже более профессионально.'),
      infoCard('Что не входит в стандартный отчёт', 'Сведения о зарегистрированных лицах, коммунальные задолженности и сложные нестандартные случаи, требующие глубокой ручной проверки.')
    ])
  ]));
}

function simpleView() {
  return appLayout(el('section', { class: 'card section' }, [
    el('h2', {}, 'Простая проверка'),
    el('p', {}, 'Это экранный результат без PDF. Он нужен, чтобы показать формат продукта и подтолкнуть к оптимальному тарифу.'),
    el('div', { class: 'grid grid-3', style: 'margin-top:16px' }, [
      kpi('Объект', 'Найден', 'Базовые сведения доступны'),
      kpi('Риски', '2', 'Требуют внимания'),
      kpi('Рекомендация', 'Перейти', 'На оптимальный тариф')
    ]),
    el('div', { class: 'actions', style: 'margin-top:16px' }, [
      el('button', { class: 'btn btn-primary', onclick: loginDemo }, 'Войти через ВК'),
      el('button', { class: 'btn btn-secondary', onclick: () => { state.currentView = 'landing'; render(); } }, 'Назад')
    ])
  ]));
}

function cabinetView() {
  return appLayout(el('div', {}, [
    el('div', { class: 'nav-tabs' }, [
      tab('dashboard', 'Главная'),
      tab('cases', 'Мои проверки'),
      tab('new', 'Новая проверка'),
      tab('access', 'Доступ и лимиты')
    ]),
    dashboardPanel(),
    casesPanel(),
    newCasePanel(),
    accessPanel()
  ]));
}

function dashboardPanel() {
  const panel = el('section', { class: `card section panel ${state.currentView === 'dashboard' ? '' : 'hidden'}`, id: 'panel-dashboard' }, [
    el('h2', {}, `Привет, ${state.user?.name || 'риелтор'}`),
    el('p', {}, 'Быстрый доступ к созданию проверки, лимитам и автопроверкам по объекту.'),
    el('div', { class: 'grid grid-3', style: 'margin-top:16px' }, [
      kpi('Текущий пакет', state.access.plan, `до ${state.access.expiresAt}`),
      kpi('Остаток', state.access.unlimited ? '∞' : String(state.access.remaining), 'оптимальных PDF'),
      kpi('Проверок', String(state.cases.length), 'создано в кабинете')
    ]),
    el('div', { class: 'actions', style: 'margin-top:16px' }, [
      el('button', { class: 'btn btn-primary', onclick: () => switchTab('new') }, 'Создать проверку'),
      el('button', { class: 'btn btn-secondary', onclick: () => { const code = prompt('Введите промокод'); activatePromo(code); } }, 'Активировать промокод')
    ])
  ]);
  return panel;
}

function casesPanel() {
  const list = el('div', { class: 'list-cases' });
  if (!state.cases.length) {
    list.append(infoCard('Пока пусто', 'Здесь появятся карточки проверок и ссылки на PDF.'));
  } else {
    state.cases.slice().reverse().forEach(item => {
      list.append(el('div', { class: 'case-item' }, [
        el('div', { class: 'row-between' }, [
          el('strong', {}, item.address || 'Без адреса'),
          el('span', { class: 'badge' }, item.status || 'Черновик')
        ]),
        el('div', { class: 'muted' }, `Продавец: ${item.sellerName || 'не указан'} • Тариф: ${item.tariff || 'Оптимальный'}`),
        item.autoSummary ? el('div', { class: 'muted' }, `Автопроверки: ${item.autoSummary}`) : '',
        el('div', { class: 'actions' }, [
          el('button', { class: 'btn btn-secondary', onclick: () => editCase(item.id) }, 'Открыть'),
          el('button', { class: 'btn btn-accent', onclick: () => runAutomation(item.id) }, 'Автопроверка'),
          el('button', { class: 'btn btn-primary', onclick: () => generatePdf(item.id) }, 'PDF')
        ])
      ]));
    });
  }
  return el('section', { class: `card section panel ${state.currentView === 'cases' ? '' : 'hidden'}`, id: 'panel-cases' }, [
    el('h2', {}, 'Мои проверки'),
    el('p', {}, 'Список объектов, статусов и готовых PDF.'),
    el('div', { style: 'margin-top:16px' }, [list])
  ]);
}

function newCasePanel() {
  const caseData = getCurrentCase();
  const form = el('form', { class: 'check-sections', onsubmit: (e) => { e.preventDefault(); saveCaseFromForm(e.target); } }, [
    el('div', { class: 'card section' }, [
      el('h3', {}, 'Автопроверка'),
      el('p', {}, 'Сервис пытается сам найти кадастровый номер по адресу и запускает автоматические проверки. Если источник упирается в капчу, сценарий помечается как полуавтоматический.'),
      el('div', { class: 'actions', style: 'margin-top:16px' }, [
        el('button', { class: 'btn btn-accent', type: 'button', onclick: () => runAutomation(state.currentCaseId, true) }, 'Запустить автопроверку')
      ])
    ]),
    el('div', { class: 'form-grid' }, [
      field('address', 'Адрес объекта', caseData.address || ''),
      field('cadastral', 'Кадастровый номер', caseData.cadastral || ''),
      field('objectType', 'Тип объекта', caseData.objectType || 'Квартира'),
      field('sellerName', 'ФИО продавца', caseData.sellerName || ''),
      field('sellerBirth', 'Дата рождения', caseData.sellerBirth || '', 'date'),
      field('sellerInn', 'ИНН', caseData.sellerInn || ''),
      field('sellerPassport', 'Паспортные данные', caseData.sellerPassport || ''),
      field('tariff', 'Тариф', caseData.tariff || 'Оптимальный')
    ]),
    field('comment', 'Комментарий риелтора', caseData.comment || '', 'textarea'),
    ...checkSections.map(([key, title]) => checkCard(key, title, caseData.sections?.[key] || { result: '', note: '' })),
    el('div', { class: 'actions' }, [
      el('button', { class: 'btn btn-primary', type: 'submit' }, 'Сохранить проверку'),
      el('button', { class: 'btn btn-secondary', type: 'button', onclick: () => {
        const id = state.currentCaseId || uid();
        if (!state.currentCaseId) state.currentCaseId = id;
        generatePdf(id, true);
      } }, 'Сформировать PDF'),
      el('button', { class: 'btn btn-secondary', type: 'button', onclick: () => { state.currentCaseId = null; switchTab('cases'); } }, 'К списку')
    ])
  ]);
  return el('section', { class: `card section panel ${state.currentView === 'new' ? '' : 'hidden'}`, id: 'panel-new' }, [
    el('h2', {}, state.currentCaseId ? 'Редактирование проверки' : 'Новая проверка'),
    el('p', {}, 'В MVP результаты внешних проверок и выводы заполняются вручную.'),
    el('div', { style: 'margin-top:16px' }, [form])
  ]);
}

function accessPanel() {
  return el('section', { class: `card section panel ${state.currentView === 'access' ? '' : 'hidden'}`, id: 'panel-access' }, [
    el('h2', {}, 'Доступ и лимиты'),
    el('div', { class: 'grid grid-3', style: 'margin-top:16px' }, [
      kpi('Пакет', state.access.plan, 'текущий тариф'),
      kpi('Остаток', state.access.unlimited ? 'Безлимит' : String(state.access.remaining), 'оптимальных отчётов'),
      kpi('Действует до', state.access.expiresAt, 'срок доступа')
    ]),
    el('div', { class: 'actions', style: 'margin-top:16px' }, [
      el('button', { class: 'btn btn-accent', onclick: () => { const code = prompt('Введите промокод'); activatePromo(code); } }, 'Активировать промокод')
    ])
  ]);
}

function field(name, labelText, value = '', type = 'text') {
  const wrap = el('div', { class: 'field' });
  const input = type === 'textarea' ? el('textarea', { name }, value) : el('input', { name, type, value });
  if (type === 'date') input.value = value;
  wrap.append(el('label', {}, labelText), input);
  return wrap;
}

function checkCard(key, title, data) {
  return el('div', { class: 'check-card' }, [
    el('h4', {}, title),
    el('div', { class: 'form-grid' }, [
      field(`section_${key}_result`, 'Результат', data.result || ''),
      field(`section_${key}_note`, 'Комментарий', data.note || '', 'textarea')
    ])
  ]);
}

function infoCard(title, text, extraClass = '') {
  return el('section', { class: `card section ${extraClass}`.trim() }, [el('h3', {}, title), el('p', {}, text)]);
}

function tariffCard(title, text, featured, cta, handler) {
  return el('section', { class: `card tariff ${featured ? 'featured' : ''}` }, [
    el('div', { class: 'badge' }, featured ? 'Основной тариф' : 'Тариф'),
    el('h3', {}, title),
    el('p', { class: 'muted' }, text),
    el('button', { class: `btn ${featured ? 'btn-primary' : 'btn-secondary'}`, onclick: handler }, cta)
  ]);
}

function kpi(label, value, note) {
  return el('div', { class: 'card kpi' }, [el('span', { class: 'muted' }, label), el('strong', {}, value), el('span', { class: 'muted' }, note)]);
}

function tab(view, label) {
  return el('button', { class: `tab ${state.currentView === view ? 'active' : ''}`, onclick: () => switchTab(view) }, label);
}

function switchTab(view) {
  state.currentView = view;
  render();
}

function loginDemo() {
  state.user = { id: 'vk-demo', name: 'Сергей / demo VK' };
  loadAccess();
  state.currentView = 'dashboard';
  render();
}

function activatePromo(codeRaw) {
  const code = (codeRaw || '').trim().toUpperCase();
  if (!code) return;
  const promo = state.promoCodes[code];
  if (!promo) return alert('Промокод не найден');
  if (promo.unlimited) {
    state.access = { plan: 'Безлимит', remaining: 9999, unlimited: true, expiresAt: addDays(promo.days || 30) };
  } else {
    state.access.plan = `Пакет ${promo.remaining}`;
    state.access.remaining += promo.remaining;
    state.access.unlimited = false;
  }
  saveAccess();
  alert('Промокод активирован');
  render();
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getCurrentCase() {
  if (!state.currentCaseId) return { sections: {} };
  return state.cases.find(x => x.id === state.currentCaseId) || { sections: {} };
}

function saveCaseFromForm(form) {
  const data = new FormData(form);
  const id = state.currentCaseId || uid();
  const existing = state.cases.find(x => x.id === id) || {};
  const item = {
    id,
    address: data.get('address') || '',
    cadastral: data.get('cadastral') || '',
    objectType: data.get('objectType') || '',
    sellerName: data.get('sellerName') || '',
    sellerBirth: data.get('sellerBirth') || '',
    sellerInn: data.get('sellerInn') || '',
    sellerPassport: data.get('sellerPassport') || '',
    tariff: data.get('tariff') || 'Оптимальный',
    comment: data.get('comment') || '',
    status: existing.status || 'Заполнена',
    updatedAt: new Date().toISOString(),
    autoSummary: existing.autoSummary || '',
    automation: existing.automation || {},
    sections: {}
  };
  checkSections.forEach(([key]) => {
    item.sections[key] = {
      result: data.get(`section_${key}_result`) || '',
      note: data.get(`section_${key}_note`) || ''
    };
  });
  const idx = state.cases.findIndex(x => x.id === id);
  if (idx >= 0) state.cases[idx] = item; else state.cases.push(item);
  state.currentCaseId = id;
  saveCases();
  alert('Проверка сохранена');
  switchTab('cases');
}

function editCase(id) {
  state.currentCaseId = id;
  switchTab('new');
}

function runAutomation(id, fromDraft = false) {
  let item = state.cases.find(x => x.id === id);
  if ((!item || !id) && fromDraft) {
    const form = document.querySelector('#panel-new form');
    if (!form) return;
    saveCaseFromForm(form);
    item = state.cases.find(x => x.id === state.currentCaseId);
  }
  if (!item) return alert('Сначала сохраните проверку');

  const results = {};
  Object.entries(automationRecipes).forEach(([key, recipe]) => {
    results[key] = {
      title: recipe.title,
      status: recipe.captcha ? 'Нужна капча / полуавтомат' : 'Выполнено автоматически',
      message: recipe.run(item)
    };
  });

  if (!item.cadastral && results.cadastral?.message.includes('черновой номер')) {
    const found = results.cadastral.message.replace('Найден автоматически по адресу: ', '');
    item.cadastral = found;
  }

  item.automation = results;
  item.autoSummary = Object.values(results).map(x => x.status).join(' • ');
  item.status = 'Автопроверка выполнена';

  if (item.sections.bankruptcy) {
    item.sections.bankruptcy.result = 'Проверено автоматически';
    item.sections.bankruptcy.note = results.bankruptcy.message;
  }
  if (item.sections.courts) {
    item.sections.courts.result = 'Проверено автоматически';
    item.sections.courts.note = results.courts.message;
  }
  if (item.sections.object) {
    item.sections.object.result = 'Проверено автоматически';
    item.sections.object.note = results.object.message;
  }
  if (item.sections.fssp) {
    item.sections.fssp.result = 'Полуавтомат';
    item.sections.fssp.note = results.fssp.message;
  }

  saveCases();
  render();
  alert('Автопроверка запущена. Часть источников выполнена автоматически, часть помечена как полуавтоматическая.');
}

function generatePdf(id, fromDraft = false) {
  let item = state.cases.find(x => x.id === id);
  if (!item && fromDraft) {
    const form = document.querySelector('#panel-new form');
    if (!form) return;
    saveCaseFromForm(form);
    item = state.cases.find(x => x.id === state.currentCaseId);
  }
  if (!item) return alert('Сначала сохраните проверку');
  if (item.tariff !== 'Простой' && !state.access.unlimited && state.access.remaining <= 0) {
    return alert('Лимит закончился. Активируйте промокод или добавьте пакет.');
  }
  if (item.tariff !== 'Простой' && !item.pdfGenerated) {
    if (!state.access.unlimited) state.access.remaining -= 1;
    item.pdfGenerated = true;
    item.status = 'PDF сформирован';
    saveAccess();
    saveCases();
  }
  const html = pdfHtml(item);
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

function pdfHtml(item) {
  const sectionRows = checkSections.map(([key, title]) => `
    <tr><td><strong>${title}</strong></td><td>${escapeHtml(item.sections?.[key]?.result || '—')}</td><td>${escapeHtml(item.sections?.[key]?.note || '—')}</td></tr>
  `).join('');
  const automationRows = Object.values(item.automation || {}).map(x => `
    <tr><td><strong>${escapeHtml(x.title)}</strong></td><td>${escapeHtml(x.status)}</td><td>${escapeHtml(x.message)}</td></tr>
  `).join('');
  return `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><title>Паспорт безопасности объекта</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;color:#0f172a} h1,h2{margin:0 0 12px} .muted{color:#475569} .card{border:1px solid #e2e8f0;border-radius:16px;padding:18px;margin:16px 0} table{width:100%;border-collapse:collapse} td,th{border:1px solid #e2e8f0;padding:10px;vertical-align:top;text-align:left} .tag{display:inline-block;padding:6px 10px;background:#eff6ff;color:#2563eb;border-radius:999px;font-size:12px;font-weight:700}
    @media print { .printbar{display:none} body{margin:16px} }
  </style></head><body>
  <div class="printbar" style="margin-bottom:16px"><button onclick="window.print()">Скачать / Печать в PDF</button></div>
  <div class="tag">Паспорт безопасности объекта</div>
  <h1>${escapeHtml(item.address || 'Без адреса')}</h1>
  <div class="muted">Кадастровый номер: ${escapeHtml(item.cadastral || 'не указан')} • Тип объекта: ${escapeHtml(item.objectType || 'не указан')}</div>
  <div class="card"><h2>Краткая сводка</h2><p class="muted">Подготовил: риелтор / пользователь сервиса</p><p><strong>Продавец:</strong> ${escapeHtml(item.sellerName || 'не указан')}</p><p><strong>Комментарий:</strong> ${escapeHtml(item.comment || '—')}</p><p><strong>Итог:</strong> Отчёт подготовлен в черновом MVP-формате для показа структуры «Паспорта безопасности объекта».</p></div>
  <div class="card"><h2>Что проверено</h2><table><thead><tr><th>Блок</th><th>Результат</th><th>Комментарий</th></tr></thead><tbody>${sectionRows}</tbody></table></div>
  <div class="card"><h2>Автоматические проверки</h2><table><thead><tr><th>Источник</th><th>Статус</th><th>Результат</th></tr></thead><tbody>${automationRows || '<tr><td colspan="3">Автопроверки ещё не запускались</td></tr>'}</tbody></table></div>
  <div class="card"><h2>Сведения об объекте</h2><p><strong>Адрес:</strong> ${escapeHtml(item.address || '—')}</p><p><strong>Кадастровый номер:</strong> ${escapeHtml(item.cadastral || '—')}</p><p><strong>Тип объекта:</strong> ${escapeHtml(item.objectType || '—')}</p></div>
  <div class="card"><h2>Итоговое заключение</h2><p>Данный отчёт не является юридическим заключением. Он подготовлен на основании открытых источников и данных, внесённых пользователем в сервис. Отдельные сведения могут требовать дополнительной проверки.</p></div>
  </body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]));
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const view = state.user ? cabinetView() : (state.currentView === 'simple' ? simpleView() : landingView());
  root.append(view);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

render();
