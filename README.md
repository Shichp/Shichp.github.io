# 空天杯运动会网站 · GitHub Pages 发布版

这是可直接上传 GitHub Pages 的静态版本。保留原网站的蓝白视觉、赛程、项目与积分规则，提供对阵筛选、姓名/队伍搜索、团体与个人积分查询。

**成绩更新方式：替换仓库中的 `data/results.xlsx`，GitHub Pages 重新发布后，全体访问者读取同一份成绩。** 不需要购买独立域名，也不需要安装 Node.js 或自行租服务器。

## 第一次上线

1. 注册或登录 GitHub，创建一个仓库，例如 `sports`。使用 GitHub Free 时选择 **Public（公开）**。可以勾选添加 README，以便直接上传文件。
2. 在仓库首页选择 **Add file → Upload files**。
3. 打开这个“GitHub-Pages发布版”文件夹，把**里面的文件和子文件夹**拖入上传区。不要上传压缩包，也不要把外层文件夹一起套进去。
4. 提交到 `main` 分支。上传后，仓库根目录应能直接看到 `index.html`，以及 `assets`、`data`、`templates` 文件夹。
5. 打开仓库 **Settings → Pages**。在 **Build and deployment** 中选择：
   - Source：**Deploy from a branch**
   - Branch：**main**
   - Folder：**/(root)**
   - 点击 **Save**。自定义域名留空即可。
6. 等待仓库 **Actions** 中的 `pages build and deployment` 成功。回到 **Settings → Pages** 查看并打开实际生成的网址。
7. 通常网址是 `https://你的用户名.github.io/sports/`。把实际网址制作成二维码，或直接分享链接。

正确的仓库结构：

```text
sports/
  index.html
  manage.html
  README.md
  .nojekyll
  启动本地预览.cmd
  assets/
    site.css
    public.js
    manage.js
    results-core.js
    wican-lab-mark.png
    vendor/
      xlsx.full.min.js
      SHEETJS-LICENSE.txt
      README.txt
  data/
    results.xlsx
  templates/
    填写示例.xlsx
```

`.nojekyll` 是随包提供的空文件，可一并上传。浏览器没有显示它时，本网站的普通 HTML、JS、CSS 和 Excel 文件仍可按上述分支方式发布。

## 每次更新 Excel 成绩

1. 打开网站底部的 **信息组 · 成绩更新与 Excel 预览**。本地也可以直接双击 `manage.html`。
2. 点击 **下载当前成绩表**，在 Excel 中编辑。第一次下载得到空表；不熟悉格式时，先参考 **下载填写示例**。
3. 保留三个工作表及其第一行标题。填写完整、最新的对阵和积分。
4. 保存为 `.xlsx`。需要用公式计算时，发布前将相应区域复制并“粘贴为值”。
5. 在预览页选择这份 Excel。修正所有错误，并核对对阵、团体积分、个人积分三处预览。黄色提示也请核对。
6. 点击 **下载待上传文件 results.xlsx**。浏览器可能在重复下载时加 `(1)` 后缀，上传前请改回准确的 `results.xlsx`。
7. 登录 GitHub，进入仓库的 **data 文件夹**，点击 **Add file → Upload files**。上传刚才核对的 `results.xlsx`，替换同名文件。
8. 填写更新说明，例如“11月7日 15:00 羽毛球成绩更新”，提交到发布分支 `main`。如果仓库要求走其他分支，合并到 `main` 后才发布。
9. 等待 **Actions** 中的 Pages 发布成功，再回到网站点击 **刷新成绩**，或重新打开页面，核对正式结果。

每次上传的是**完整最新版本**，不自动合并旧成绩。不发布某张表时，保留标题行、删除其全部数据行；这会让对应列表变为空。删除整个工作表则无法通过校验。

选择 Excel、预览和下载都只发生在当前浏览器。**只有上传 GitHub 并提交到发布分支后，其他人才能看到更新。** 该页面不收集 GitHub 密码或令牌，发布权限由仓库写入权限控制。

## Excel 格式

第一行必须为列标题，列的先后顺序可调整，标题文字不能改。允许额外的“填写说明”工作表。每个文件不超过 5 MB，每个数据表最多 19,999 条数据。

### 对阵成绩

| 项目 | 轮次 | 选手A | 选手B | 比分A | 比分B | 胜者 |
|---|---|---|---|---|---|---|
| 羽毛球-男单 | 胜者组首轮 | 示例甲 | 示例乙 | 2 | 1 | A |

上表是填写示例，不是真实赛事成绩。

- 未赛时，双方比分与胜者均留空，轮次与双方名称仍需填写。
- 比赛完成后填写双方比分，胜者填 `A` 或 `B`，胜者应有更高比分。
- 弃权填 `弃权`；如无比分，双方比分都留空。
- 比分已有但胜者留空时，网站显示“待确认”。
- 同项目、同轮次、同一对选手不能重复，即使交换 A/B 顺序也视作重复。二次交手请使用不同的轮次名称。
- 名称中的 `/` 可用于双打组合。显示按原文处理，姓名、队名等不会作为 HTML 执行。
- 支持的项目名称见 Excel 的“填写说明”及预览页底部列表。对阵格式适用于双方对抗；趣味项目可先通过积分表展示积分，不会从原始成绩自动推断名次。

### 团体积分

列标题：`战队名称`、`有效到场人数`、`成绩积分`。

- 人数必须是非负整数；人数、成绩积分不能为空，没有时填 `0`。
- 团体总分 = 有效到场人数 × 3 + 成绩积分。
- 每队一行，队名不可重复。到场人数由负责人核定，不连接签到系统。

### 个人积分

列标题：`姓名`、`所属战队`、`单项积分`、`破纪录加分`。

- 积分必须是非负数字，没有时填 `0`。
- 个人总积分 = 单项积分 + 破纪录加分。
- 同一人、同一队伍一行，多个项目的积分先由负责人汇总后填写。
- 网站按总分从高到低排序，同分并列（如 1、1、3）；这是网页展示方式，最终名次以组委会确认为准。
- 网站不根据比赛比分自动分配积分。现有赛制和计分规则仍展示在“比赛规则”中，由负责人据此核定 Excel。

## 本地检查

- **检查 Excel：** 双击 `manage.html` 即可，不需要开启服务。
- **预览完整网站：** Windows 双击 `启动本地预览.cmd`，按窗口提示打开 `http://127.0.0.1:8000`。此方式需要电脑已有 Python。
- 直接双击 `index.html` 时，浏览器可能禁止读取本地 Excel；页面会提供说明。这不影响 GitHub Pages 上的正常读取。
- 首次发布前，用电脑和现场实际手机网络分别测试赛程、规则、筛选、积分、Excel 下载和刷新。

## 内容修改与范围

- 赛事名称、时间、地点、赛制、积分规则保留自原 `index.html`，上线前由负责人核对。修改这些内容时编辑发布版 `index.html`，再上传同名文件。
- `data/results.xlsx` 初始没有正式成绩，线上显示“成绩尚未发布”。`templates/填写示例.xlsx` 含明确标注的演示数据，仅用于参考。
- 本版为公开查询网站，原来的在线签到、共享抽奖、管理员登录和 Node.js 服务未包含在发布包中。原“空天杯网址”目录保留，可继续用于本地系统。
- 请上传本发布包，不要把原本地系统目录一起上传；其运行程序、签到数据和会话数据都不是本版网站所需的文件。
- Excel 读取库随包提供，不依赖外部 CDN，手机也可在浏览器内读取公开的成绩表。

## 常见问题

- **上传后没更新：** 确认替换的是 `data/results.xlsx`，而非根目录、其他分支或 `results (1).xlsx`；确认 Actions 发布成功。GitHub 官方说明，提交后的发布可能需要约 10 分钟。然后点击“刷新成绩”或重新打开网页。
- **页面提示成绩文件校验失败：** 仓库分支发布本身不会校验 Excel。请先在预览页修正后重新上传；需要恢复时，通过仓库历史下载此前的 `results.xlsx`，再替换上传。
- **404：** 确认 `index.html` 在发布源根目录，Pages 使用正确的分支和 `/(root)`；以 Settings → Pages 显示的网址为准。
- **规则链接或图片失效：** 保持发布包内相对路径和文件名不变，整套上传 `assets` 文件夹。本版兼容带仓库名的项目网址。
- **预览正确，但其他人还看不到：** 本地预览不会发布。需要拥有仓库写入权限的负责人完成 GitHub 提交，并等待 Pages 部署完成。

## GitHub 官方参考

- [GitHub Pages 简介与免费账户适用范围](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [配置发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [上传文件到仓库](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [创建 Pages 网站及发布等待时间](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

本说明按 2026-10-27 查阅的 GitHub 官方流程编写；界面名称可能随 GitHub 更新调整。
