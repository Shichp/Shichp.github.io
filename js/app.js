(function () {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const menu = $('#menuBtn');
  const nav = $('#nav');
  const mobile = window.matchMedia('(max-width: 650px)');

  function closeMenu(restoreFocus) {
    nav.classList.remove('opened');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '打开导航菜单');
    if (restoreFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('opened', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('opened')) closeMenu(true);
  });
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu(false);
  });
  mobile.addEventListener('change', () => closeMenu(false));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        nav.querySelectorAll('a').forEach((link) => {
          const current = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('active', current);
          if (current) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-14% 0px -65% 0px' });
    document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section));
  }

  const dialog = $('#qrDialog');
  let qrTrigger = null;
  function closeQr() { if (dialog.open) dialog.close(); }
  document.querySelectorAll('[data-open-qr]').forEach((button) => button.addEventListener('click', () => {
    qrTrigger = button;
    closeMenu(false);
    dialog.showModal();
    document.body.classList.add('modal-open');
  }));
  $('[data-close-qr]').addEventListener('click', closeQr);
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeQr();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (qrTrigger && qrTrigger.isConnected) {
      const target = qrTrigger.getClientRects().length ? qrTrigger : menu;
      target.focus({ preventScroll: true });
    }
  });

  const raw = window.KT_PUBLICATIONS;
  const sourceMissing = !raw || typeof raw !== 'object';
  const source = sourceMissing ? {} : raw;
  const types = {
    matches: { title: '对阵待公布', description: '正式对阵表由竞赛组提供，确认后将在这里公示。', caption: '正式对阵公示', headers: ['竞赛项目', '轮次', '对阵双方', '时间与场地', '状态 / 比分'] },
    results: { title: '比赛结果待公布', description: '比赛结果经裁判签认与竞赛组复核后，将在这里统一发布。', caption: '正式比赛结果', headers: ['竞赛项目', '名次', '姓名 / 队伍', '比赛成绩', '积分 / 备注'] },
    winners: { title: '中奖名单待公布', description: '如有经组委会确认的中奖名单，将在这里公布，请留意后续通知。', caption: '正式中奖名单', headers: ['姓名', '所属队伍', '奖品', '公布日期', '备注'] }
  };
  let active = 'matches';
  const filter = $('#projectFilter');
  const search = $('#publicationSearch');
  const panel = $('#publicationPanel');
  const empty = $('#publicationEmpty');
  const tableWrap = $('#publicationTableWrap');
  const tableHead = $('#publicationHead');
  const tableRows = $('#publicationRows');
  const status = $('#publicationStatus');
  const tabs = Array.from(document.querySelectorAll('[data-publication-tab]'));
  const hasValue = (value) => value !== undefined && value !== null && value !== '';
  const safeText = (value) => hasValue(value) ? String(value) : '—';
  const element = (tag, value, className) => {
    const node = document.createElement(tag);
    if (hasValue(value)) node.textContent = String(value);
    if (className) node.className = className;
    return node;
  };
  const values = (row) => Object.values(row).filter((value) => typeof value === 'string' || typeof value === 'number').join(' ').toLocaleLowerCase();
  const projects = new Set(Array.isArray(window.KT_CONFIG?.projects) ? window.KT_CONFIG.projects : []);
  ['matches', 'results'].forEach((kind) => {
    if (Array.isArray(source[kind])) source[kind].forEach((row) => { if (row && typeof row.project === 'string' && row.project.trim()) projects.add(row.project); });
  });
  projects.forEach((name) => {
    const option = element('option', name);
    option.value = name;
    filter.append(option);
  });

  function addCell(row, value, className, secondary) {
    const cell = element('td', value, className);
    if (hasValue(secondary)) cell.append(element('small', secondary));
    row.append(cell);
    return cell;
  }
  function renderRow(data) {
    const row = document.createElement('tr');
    if (active === 'matches') {
      addCell(row, safeText(data.project), 'cell-primary');
      addCell(row, safeText(data.round));
      addCell(row, safeText(data.sideA) + ' vs ' + safeText(data.sideB), 'cell-primary');
      addCell(row, safeText(data.scheduledAt), '', data.venue);
      const score = hasValue(data.scoreA) && hasValue(data.scoreB) ? String(data.scoreA) + ' : ' + String(data.scoreB) : '';
      const cell = addCell(row, score, 'cell-primary', data.winner ? '胜者：' + String(data.winner) : '');
      cell.prepend(element('span', safeText(data.status || (score ? '已结束' : '待比赛')), 'cell-badge'));
      if (score) cell.querySelector('.cell-badge').after(document.createTextNode(' '));
    } else if (active === 'results') {
      addCell(row, safeText(data.project), 'cell-primary');
      addCell(row, hasValue(data.rank) ? '第' + String(data.rank) + '名' : '—', 'cell-primary');
      addCell(row, safeText(data.name), 'cell-primary', data.team);
      addCell(row, safeText(data.score));
      addCell(row, hasValue(data.points) ? String(data.points) + ' 分' : '—', '', data.note);
    } else {
      addCell(row, safeText(data.name), 'cell-primary');
      addCell(row, safeText(data.team));
      addCell(row, safeText(data.prize), 'cell-primary');
      addCell(row, safeText(data.publishedAt));
      addCell(row, safeText(data.note));
    }
    return row;
  }
  function render() {
    const current = types[active];
    const invalid = sourceMissing || !Array.isArray(source[active]) || source[active].some((row) => !row || typeof row !== 'object' || Array.isArray(row));
    const all = invalid ? [] : source[active];
    const keyword = search.value.trim().toLocaleLowerCase();
    const rows = all.filter((row) => (active === 'winners' || filter.value === 'all' || row.project === filter.value) && (!keyword || values(row).includes(keyword)));
    $('#projectFilterField').hidden = active === 'winners';
    filter.disabled = active === 'winners';
    search.placeholder = active === 'winners' ? '搜索姓名、队伍或奖品' : '搜索姓名、队伍或项目';
    search.setAttribute('aria-label', active === 'winners' ? '搜索姓名、队伍或奖品' : '搜索姓名、队伍或项目');
    $('#publicationCaption').textContent = current.caption;
    panel.setAttribute('aria-labelledby', 'tab-' + active);
    tableRows.replaceChildren();
    tableHead.replaceChildren();
    const heading = document.createElement('tr');
    current.headers.forEach((label) => { const th = element('th', label); th.scope = 'col'; heading.append(th); });
    tableHead.append(heading);
    empty.hidden = rows.length > 0;
    tableWrap.hidden = rows.length === 0;
    if (rows.length) {
      const fragment = document.createDocumentFragment();
      rows.forEach((row) => fragment.append(renderRow(row)));
      tableRows.append(fragment);
      status.textContent = '共 ' + all.length + ' 条正式公示，当前显示 ' + rows.length + ' 条';
    } else if (invalid) {
      empty.querySelector('h3').textContent = '公示暂时无法显示';
      empty.querySelector('p').textContent = '公示数据未能正确加载，请稍后刷新页面或联系信息组。';
      status.textContent = '数据读取异常';
    } else if (!all.length) {
      empty.querySelector('h3').textContent = current.title;
      empty.querySelector('p').textContent = current.description;
      status.textContent = active === 'winners' ? '组委会确认后统一公示' : '竞赛组核对后统一发布';
    } else {
      empty.querySelector('h3').textContent = '没有找到匹配的信息';
      empty.querySelector('p').textContent = '请尝试其他项目、姓名或队伍关键词。';
      status.textContent = '共 ' + all.length + ' 条正式公示，当前显示 0 条';
    }
    const updated = $('#publicationUpdated');
    updated.textContent = invalid ? '请稍后重试' : all.length ? source.updatedAt ? '更新：' + String(source.updatedAt) : '已发布正式数据' : '尚未发布正式数据';
    const anyPublished = ['matches', 'results', 'winners'].some((kind) => Array.isArray(source[kind]) && source[kind].length);
    const badge = $('.status-badge');
    badge.replaceChildren(element('i', ''), document.createTextNode(invalid ? '公示数据异常' : anyPublished ? '正式公示' : '等待正式数据'));
  }
  function activate(tab, focus) {
    active = tab.dataset.publicationTab;
    filter.value = 'all';
    search.value = '';
    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    if (focus) tab.focus();
    render();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab, false));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(tabs[next], true);
    });
  });
  filter.addEventListener('change', render);
  search.addEventListener('input', render);
  render();
})();
