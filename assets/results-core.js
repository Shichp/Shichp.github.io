/* Shared Excel parsing and validation. Works in browsers and Node.js. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.SportsResults = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const PROJECTS = {
        '羽毛球-男单': 'badminton-ms', '羽毛球-女单': 'badminton-ws',
        '羽毛球-男双': 'badminton-md', '羽毛球-女双': 'badminton-wd',
        '羽毛球-混双': 'badminton-xd', '乒乓球-男单': 'pingpong-ms',
        '乒乓球-女单': 'pingpong-ws', '乒乓球-男双': 'pingpong-md',
        '乒乓球-女双': 'pingpong-wd', '乒乓球-混双': 'pingpong-xd',
        '篮球对抗': 'basketball', '三分投篮': 'three-point', '篮球接力': 'basketball-relay',
        '沙包存活': 'sandbag', '五人六足': 'six-leg', '一分钟踢毽子': 'shuttlecock'
    };
    const HEADERS = {
        '对阵成绩': ['项目', '轮次', '选手A', '选手B', '比分A', '比分B', '胜者'],
        '团体积分': ['战队名称', '有效到场人数', '成绩积分'],
        '个人积分': ['姓名', '所属战队', '单项积分', '破纪录加分']
    };
    const MAX_BYTES = 5 * 1024 * 1024;
    const MAX_ROWS = 20000;
    const text = value => value == null ? '' : String(value).trim();
    const hasValue = value => value !== null && value !== undefined && value !== '';

    function readWorkbook(workbook, XLSX) {
        const errors = [], warnings = [];
        if (!workbook || !workbook.Sheets) throw new Error('无法读取 Excel 工作簿。');
        const matches = Object.fromEntries(Object.values(PROJECTS).map(id => [id, []]));
        const teams = [], individuals = [];

        function sheetRows(name) {
            const sheet = workbook.Sheets[name];
            if (!sheet) { errors.push(`缺少工作表「${name}」，请保留模板中的三个工作表。`); return []; }
            const ref = sheet['!ref'];
            if (!ref) { errors.push(`「${name}」为空，第一行应是列标题。`); return []; }
            const area = XLSX.utils.decode_range(ref);
            if (area.e.r >= MAX_ROWS || area.e.c > 100) {
                errors.push(`「${name}」范围过大，请删除多余的行列；最多 ${MAX_ROWS - 1} 条数据。`);
                return [];
            }
            const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: true, raw: true, range: 0 });
            const titles = (grid[0] || []).map(text);
            const expected = HEADERS[name];
            expected.forEach(title => {
                if (!titles.includes(title)) errors.push(`「${name}」第一行缺少列「${title}」。`);
                if (titles.filter(t => t === title).length > 1) errors.push(`「${name}」列「${title}」重复。`);
            });
            if (expected.some(title => !titles.includes(title) || titles.filter(t => t === title).length > 1)) return [];
            return grid.slice(1).flatMap((cells, index) => {
                if (!cells.some(hasValue)) return [];
                const row = { _row: index + 2, _sheet: name };
                expected.forEach(title => {
                    const col = titles.indexOf(title);
                    const cell = sheet[XLSX.utils.encode_cell({ r: index + 1, c: col })];
                    if (cell && cell.f) errors.push(`「${name}」第 ${row._row} 行「${title}」含公式，请在 Excel 中复制并粘贴为值。`);
                    if (cell && cell.t === 'e') errors.push(`「${name}」第 ${row._row} 行「${title}」包含 Excel 错误。`);
                    row[title] = cells[col];
                });
                return [row];
            });
        }

        function number(row, title, optional = false, integer = false) {
            const raw = row[title];
            const value = typeof raw === 'string' ? raw.trim() : raw;
            if (value == null || value === '') {
                if (!optional) errors.push(`「${row._sheet}」第 ${row._row} 行「${title}」为空；没有积分或人数时请填 0。`);
                return null;
            }
            const validType = typeof value === 'number' || (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value));
            const result = Number(value);
            if (!validType || !Number.isFinite(result) || result < 0 || (integer && !Number.isSafeInteger(result))) {
                errors.push(`「${row._sheet}」第 ${row._row} 行「${title}」必须是非负${integer ? '整数' : '数字'}。`);
                return null;
            }
            return result;
        }

        const matchKeys = new Set();
        sheetRows('对阵成绩').forEach(row => {
            const project = text(row['项目']);
            const id = PROJECTS[project] || (Object.values(PROJECTS).includes(project) ? project : null);
            if (!id) errors.push(`「对阵成绩」第 ${row._row} 行项目「${project}」无法识别，请参考填写示例中的项目列表。`);
            const round = text(row['轮次']), nameA = text(row['选手A']), nameB = text(row['选手B']);
            if (!round || !nameA || !nameB) errors.push(`「对阵成绩」第 ${row._row} 行的轮次、选手A、选手B均需填写。`);
            if (nameA && nameA === nameB) errors.push(`「对阵成绩」第 ${row._row} 行双方名称相同。`);
            const scoreA = number(row, '比分A', true), scoreB = number(row, '比分B', true);
            const winner = text(row['胜者']).toUpperCase() || null;
            if ((scoreA === null) !== (scoreB === null)) errors.push(`「对阵成绩」第 ${row._row} 行比分需成对填写，未赛时两项都留空。`);
            if (winner && !['A', 'B', '弃权'].includes(winner)) errors.push(`「对阵成绩」第 ${row._row} 行胜者只能填 A、B、弃权或留空。`);
            if (winner === 'A' && !(scoreA !== null && scoreB !== null && scoreA > scoreB)) errors.push(`「对阵成绩」第 ${row._row} 行胜者为 A，比分A应大于比分B。`);
            if (winner === 'B' && !(scoreA !== null && scoreB !== null && scoreB > scoreA)) errors.push(`「对阵成绩」第 ${row._row} 行胜者为 B，比分B应大于比分A。`);
            const key = JSON.stringify([id, round, ...[nameA, nameB].sort()]);
            if (matchKeys.has(key)) errors.push(`「对阵成绩」第 ${row._row} 行与已有记录重复（同项目、轮次、双方）。`);
            matchKeys.add(key);
            if (id) matches[id].push({ project: id, round, nameA, nameB, scoreA, scoreB, winner });
        });
        const teamKeys = new Set();
        sheetRows('团体积分').forEach(row => {
            const name = text(row['战队名称']);
            if (!name) errors.push(`「团体积分」第 ${row._row} 行战队名称为空。`);
            if (teamKeys.has(name)) errors.push(`「团体积分」第 ${row._row} 行战队「${name}」重复。`);
            teamKeys.add(name);
            teams.push({ name, attendance: number(row, '有效到场人数', false, true), scorePoints: number(row, '成绩积分') });
        });
        const personKeys = new Set();
        sheetRows('个人积分').forEach(row => {
            const name = text(row['姓名']), team = text(row['所属战队']);
            if (!name || !team) errors.push(`「个人积分」第 ${row._row} 行姓名和所属战队均需填写。`);
            const key = JSON.stringify([name, team]);
            if (personKeys.has(key)) errors.push(`「个人积分」第 ${row._row} 行同名、同战队的记录重复。`);
            personKeys.add(key);
            individuals.push({ name, team, scorePoints: number(row, '单项积分'), recordBonus: number(row, '破纪录加分') });
        });
        const totals = { matches: Object.values(matches).reduce((n, rows) => n + rows.length, 0), teams: teams.length, individuals: individuals.length };
        if (!totals.matches && !totals.teams && !totals.individuals) warnings.push('三个数据表均没有记录，发布后网站将显示“成绩尚未发布”。');
        const knownTeams = new Set(teams.map(t => t.name));
        individuals.forEach(person => {
            if (knownTeams.size && !knownTeams.has(person.team)) warnings.push(`个人「${person.name}」的所属战队「${person.team}」未出现在团体积分表，请核对队名。`);
        });
        return { matches, teams, individuals, totals, errors, warnings };
    }

    function parseBuffer(buffer, XLSX) {
        if (!XLSX) throw new Error('Excel 读取组件未加载，请检查 assets/vendor 文件是否上传完整。');
        if ((buffer.byteLength || buffer.length || 0) > MAX_BYTES) throw new Error('Excel 文件超过 5 MB，请删除无用内容后重试。');
        const data = new Uint8Array(buffer);
        if (data[0] !== 0x50 || data[1] !== 0x4b) throw new Error('请使用真正的 .xlsx 文件；旧版 .xls 请先在 Excel 中另存为 .xlsx。');
        return readWorkbook(XLSX.read(data, { type: 'array', cellFormula: true }), XLSX);
    }

    function ranked(rows, totalOf) {
        const sorted = rows.map(row => ({ ...row, total: totalOf(row) })).sort((a, b) => b.total - a.total);
        let rank = 0;
        return sorted.map((row, index) => {
            if (!index || row.total !== sorted[index - 1].total) rank = index + 1;
            return { ...row, rank };
        });
    }
    const rankTeams = rows => ranked(rows, row => row.attendance * 3 + row.scorePoints);
    const rankIndividuals = rows => ranked(rows, row => row.scorePoints + row.recordBonus);
    return { PROJECTS, HEADERS, MAX_BYTES, parseBuffer, readWorkbook, rankTeams, rankIndividuals };
});
