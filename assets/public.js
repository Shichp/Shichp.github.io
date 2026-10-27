'use strict';
(function () {
    const core = window.SportsResults;
    const labels = Object.fromEntries(Object.entries(core.PROJECTS).map(([label, id]) => [id, label]));
    const select = document.getElementById('match-project');
    Object.entries(core.PROJECTS).forEach(([label, id]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = label;
        select.appendChild(option);
    });
    let current = null;
    let officialLoaded = false;
    let loading = false;
    const bodyOf = id => document.getElementById(id);

    function empty(tbody, columns, message) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = columns;
        cell.className = 'empty-cell';
        cell.textContent = message;
        row.appendChild(cell);
        tbody.replaceChildren(row);
    }
    function tableRow(values, classes = {}) {
        const row = document.createElement('tr');
        values.forEach((value, index) => {
            const cell = document.createElement('td');
            cell.textContent = value == null ? '—' : String(value);
            if (classes[index]) cell.className = classes[index];
            row.appendChild(cell);
        });
        return row;
    }
    function renderMatches() {
        const tbody = bodyOf('match-table-body');
        const project = select.value;
        const keyword = bodyOf('search-input').value.trim().toLocaleLowerCase();
        const all = current ? Object.values(current.matches).flat() : [];
        const rows = all.filter(match => (project === 'all' || match.project === project)
            && [match.nameA, match.nameB, match.round, labels[match.project]].some(value => value.toLocaleLowerCase().includes(keyword)));
        if (!rows.length) {
            empty(tbody, 6, !current ? '成绩暂不可用，请查看上方提示。' : !all.length ? '成绩尚未发布。' : '没有找到符合条件的对阵。');
            return;
        }
        const fragment = document.createDocumentFragment();
        rows.forEach(match => {
            let status = match.scoreA === null ? '未赛' : '待确认';
            let statusClass = 'status-pending';
            if (match.winner === 'A' || match.winner === 'B') {
                status = `${match.winner === 'A' ? match.nameA : match.nameB} 胜`;
                statusClass = 'status-win';
            } else if (match.winner === '弃权') { status = '弃权'; statusClass = 'status-lose'; }
            fragment.appendChild(tableRow([
                labels[match.project], match.round, match.nameA,
                match.scoreA === null ? '—' : `${match.scoreA} : ${match.scoreB}`,
                match.nameB, status
            ], { 2: match.winner === 'A' ? 'points-highlight' : '', 4: match.winner === 'B' ? 'points-highlight' : '', 5: statusClass }));
        });
        tbody.replaceChildren(fragment);
    }
    function renderPoints() {
        const teamBody = bodyOf('team-points-body'), personBody = bodyOf('individual-points-body');
        if (!current || !current.teams.length) empty(teamBody, 6, current ? '团体积分尚未发布。' : '积分暂不可用。');
        else teamBody.replaceChildren(...core.rankTeams(current.teams).map(team => tableRow([
            team.rank, team.name, team.attendance, team.attendance * 3, team.scorePoints, team.total
        ], { 0: 'points-rank', 5: 'points-rank' })));
        if (!current || !current.individuals.length) empty(personBody, 6, current ? '个人积分尚未发布。' : '积分暂不可用。');
        else personBody.replaceChildren(...core.rankIndividuals(current.individuals).map(person => tableRow([
            person.rank, person.name, person.team, person.scorePoints, person.recordBonus, person.total
        ], { 0: 'points-rank', 5: 'points-rank' })));
    }
    function setData(data) { current = data; renderMatches(); renderPoints(); }
    function switchPointsTab(event, tabId) {
        document.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === tabId));
        document.querySelectorAll('.tab-btn').forEach(button => {
            const active = button === event.currentTarget;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }
    async function loadResults() {
        if (loading) return;
        loading = true;
        const button = bodyOf('refresh-results');
        const panel = bodyOf('publication');
        const title = bodyOf('publication-title'), detail = bodyOf('publication-detail'), time = bodyOf('publication-time');
        button.disabled = true;
        button.textContent = '正在刷新…';
        panel.classList.remove('error');
        title.textContent = '正在读取最新成绩…';
        try {
            if (location.protocol === 'file:') throw new Error('本地预览请使用发布包中的“启动本地预览.cmd”；检查 Excel 可打开“成绩更新与预览”页面。');
            const url = new URL('data/results.xlsx', location.href);
            url.searchParams.set('v', String(Date.now()));
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`成绩文件读取失败（HTTP ${response.status}），请检查仓库 data/results.xlsx 是否存在。`);
            if (Number(response.headers.get('Content-Length')) > core.MAX_BYTES) throw new Error('成绩文件超过 5 MB，请联系信息组精简文件。');
            const parsed = core.parseBuffer(await response.arrayBuffer(), window.XLSX);
            if (parsed.errors.length) throw new Error(`成绩文件未通过校验，请联系信息组更正。${parsed.errors.slice(0, 3).join(' ')}`);
            setData(parsed);
            officialLoaded = true;
            title.textContent = parsed.totals.matches || parsed.totals.teams || parsed.totals.individuals ? '最新成绩已加载' : '成绩尚未发布';
            detail.textContent = `已发布 ${parsed.totals.matches} 场对阵、${parsed.totals.teams} 支队伍积分、${parsed.totals.individuals} 条个人积分。成绩由信息组统一更新。`;
            const modified = response.headers.get('Last-Modified');
            time.textContent = modified && !Number.isNaN(Date.parse(modified))
                ? `文件发布时间：${new Date(modified).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}（北京时间）`
                : '';
        } catch (error) {
            panel.classList.add('error');
            title.textContent = officialLoaded ? '刷新失败，当前保留上次加载的成绩' : '成绩暂时无法加载';
            detail.textContent = error.message;
            if (!officialLoaded) { setData(null); time.textContent = ''; }
        } finally {
            loading = false;
            button.disabled = false;
            button.textContent = '刷新成绩';
        }
    }
    window.renderMatches = renderMatches;
    window.switchPointsTab = switchPointsTab;
    window.SportsView = { setData };
    if (document.body.dataset.mode !== 'preview') {
        bodyOf('refresh-results').addEventListener('click', loadResults);
        loadResults();
    }
})();
