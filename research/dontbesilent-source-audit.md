# dontbesilent 素材来源审计与接入边界

更新时间：2026-09-03

## 当前实验基线

- 实验仓库：`macong0508-sys/aima-dontbesilent-experiment-v2`
- 实验分支：`experiment/dontbesilent-integration`
- 稳定仓库：`macong0508-sys/aima-tweet-card-generator`（不修改）
- 当前基线页面：`https://macong0508-sys.github.io/aima-dontbesilent-experiment-v2/`
- 当前基线内容：566 条历史推文、23 张天策背景图。

## 参考来源

1. `line-cell/dontbesilent-tweet-card-studio`
   - 代码：React/Vinext 工作台，MIT License。
   - 结构化推文：`public/posts.json`，当前 1,544 条。
   - 离线发布文案：`public/captions.json`，当前 420 条。
   - 背景图：8 张命名背景 + 110 张旅行背景，共 118 张。
   - 原帖地址字段：`sourceUrl`，必须保留。
2. `dontbesilent2025/dbskill`
   - 含 `books/dontbesilent-开源推文集.md` 和 PDF 阅读版。
   - README 声明其知识来源为 16,152 条公开推文。
   - 该仓库当前标注 CC BY-NC 4.0；本实验按非商业使用处理，并保留来源说明。
   - 这份完整推文集不在本阶段直接并入网页数据，避免体积、重复和内容归属混淆。

## 接入规则

- 现有 23 张背景图继续标记为“天策图库”，不覆盖、不删除。
- 新背景统一标记为“dontbesilent 图库”，并保留原始文件名、来源和标签。
- 第三方推文单独保存，不与 AI马过河自有历史推文直接混成一组。
- 每条第三方推文保留原始 X 链接、主题、格式和标签。
- 以 X 帖子 ID（若缺失则以原始链接）去重。
- 卡片默认仍使用 AI马过河的头像、昵称和账号；界面必须显示素材来源，避免把第三方原文误标成原创。
- 发布文案和话题标签只作为编辑建议，用户可以修改；不自动生成未经核实的经历、收入或效果描述。
- 所有图片和文字素材在浏览器内使用，不上传用户图片，不引入 API Key。

## 字段映射

| dontbesilent 字段 | 实验版字段 | 处理 |
|---|---|---|
| id | id | 原样保留并用于去重 |
| date | date | 原样保留 |
| text | text | 原样保留，允许临时编辑 |
| sourceUrl | sourceUrl | 原样保留并提供“查看原帖” |
| topic | topic/category | 映射到中文分类 |
| format | format | 原样保留 |
| tags | tags | 原样保留并用于搜索、话题建议 |
| metrics | metrics | 缺失时使用版式演示数据，不冒充真实数据 |

## 本阶段验收

- 审计文件写入实验分支；
- 现有 `main` 分支无变化；
- 118 张背景、1,544 条推文、420 条文案的数量均已由上游仓库核对；
- 下一阶段只增加素材和清单，不替换现有页面架构。
