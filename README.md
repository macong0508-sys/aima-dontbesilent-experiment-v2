# AI马过河抖音图文卡片生成器

AI马过河抖音图文卡片生成器。选择内容、背景和卡片样式后，可以直接导出 3:4 竖图，并生成配套发布文案。

在线体验：[AI马过河抖音图文卡片生成器](https://macong0508-sys.github.io/aima-dontbesilent-experiment-v2/)

## 功能

- 2,102 条中文成品素材，支持分类、搜索和随机抽取；其中 578 条提炼自天策飞书核心内容库
- 2,110 条历史推文，可按来源、主题搜索和改写（天策原推 566 条 + dontbesilent 1,544 条）
- 8 种 AI 主题改写结构
- 白色、黑色推文卡片
- 自定义头像、显示名称、用户名和发布日期
- 评论、转发、点赞、浏览、收藏五项稳定展示数据，可一键换一组
- 抖音 3:4 海报与纯卡片两种输出
- 无需切换模式即可直接导出纯推文卡片，图片高度随正文自动增长
- 长文自动调整字号和卡片尺寸，避免正文被截断
- 自定义背景、本地上传或使用网络图片
- 141 张内置背景，分为天策图库 23 张与 dontbesilent 图库 118 张，支持搜索、分类、随机切换和分批加载
- 鼠标拖动卡片，调整位置、大小、透明度和旋转角度，并可一键适配画布或居中重置
- 自动生成一句发布文案和 3～5 个话题标签，内置 420 条离线发布文案
- 一键导出 PNG，全程在浏览器本地运行
- 手机端调用系统分享面板保存到相册，不支持文件分享时提供长按保存兜底

## 安装

需要先安装 [Node.js 20 或更高版本](https://nodejs.org/)。

```bash
git clone https://github.com/macong0508-sys/aima-dontbesilent-experiment-v2.git
cd aima-dontbesilent-experiment-v2
npm install
npm run dev
```

启动后打开终端显示的本地网址，通常是：

```text
http://localhost:5173
```

## 构建

```bash
npm run build
npm run test:sites
```

构建产物位于 `dist/`。

## 自定义成自己的版本

- 修改头像、名字和账号：直接在网页的“检查并下载”区域设置；也可以替换默认头像 `public/assets/aimaguohe-avatar.jpg`
- 修改历史内容：替换 `src/tweets.json`
- 修改基础 AI 素材库：编辑 `src/content-sources.json`
- 更新飞书精选素材：运行 `node scripts/extract-feishu-materials.mjs <lark-fetch.json>`，结果写入 `src/feishu-content-sources.json`
- 修改背景：替换 `public/backgrounds/` 中的图片并更新 `src/App.jsx`

## 内容与数据边界

- 工具本身不需要 OpenAI API Key，也不会上传用户编辑的正文。
- 历史推文来自公开内容归档，仅作为作者自己的内容素材使用。
- 卡片互动数字用于视觉排版演示，不代表真实社交平台数据。
- 发布内容前应人工检查事实、个人经历、收益表述和平台规则。
- 不要把他人的内容替换成自己的署名，也不要编造使用效果或收入结果。
- 仓库内图片素材请在商业使用前自行确认授权范围；你也可以替换成自己的图片。

`npm run build` 默认使用仓库自带的公开推文数据。如果你拥有自己的 X 数据归档，可以把包含 `tweets.js` 和 `note-tweet.js` 的目录传给同步脚本：

```bash
TIANCE_X_ARCHIVE_DIR=/你的归档/data npm run data:sync
```

## 技术栈

- React 19
- Vite 6
- html-to-image
- Phosphor Icons

## 许可证

代码使用 [MIT License](./LICENSE) 开源。
