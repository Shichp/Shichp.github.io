'use strict';
(function () {
    const input = document.getElementById('preview-file');
    const status = document.getElementById('preview-status');
    const panel = document.getElementById('preview-results');
    const warnings = document.getElementById('preview-warnings');
    const button = document.getElementById('download-checked');
    let acceptedBuffer = null;
    let selection = 0;
    document.getElementById('project-help').textContent = Object.keys(SportsResults.PROJECTS).join('、');
    input.addEventListener('change', async () => {
        const version = ++selection;
        const file = input.files[0];
        acceptedBuffer = null;
        panel.hidden = true;
        warnings.hidden = true;
        SportsView.setData(null);
        status.className = 'preview-message';
        if (!file) { status.textContent = '请选择 Excel 文件。'; return; }
        status.textContent = '正在读取并校验…';
        try {
            if (!/\.xlsx$/i.test(file.name)) throw new Error('请先在 Excel 中另存为 .xlsx 文件。');
            if (file.size > SportsResults.MAX_BYTES) throw new Error('文件超过 5 MB，请精简后重试。');
            const buffer = await file.arrayBuffer();
            if (version !== selection) return;
            const data = SportsResults.parseBuffer(buffer, window.XLSX);
            if (data.errors.length) throw new Error(`发现 ${data.errors.length} 个问题：\n${data.errors.join('\n')}`);
            status.classList.add('success');
            status.textContent = `校验通过：${file.name}\n${data.totals.matches} 场对阵、${data.totals.teams} 支队伍、${data.totals.individuals} 条个人积分。\n请核对下方预览，再上传 GitHub 发布。`;
            if (data.warnings.length) { warnings.textContent = data.warnings.join('\n'); warnings.hidden = false; }
            SportsView.setData(data);
            acceptedBuffer = buffer;
            panel.hidden = false;
        } catch (error) {
            if (version !== selection) return;
            status.classList.add('error');
            status.textContent = `无法预览：${error.message}`;
        }
    });
    button.addEventListener('click', () => {
        if (!acceptedBuffer) return;
        const blob = new Blob([acceptedBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'results.xlsx';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
})();
