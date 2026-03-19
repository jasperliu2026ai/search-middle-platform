# Search Middle Platform

一套面向 Agent 的多源搜索中台 Skill，用来做路由、聚合、仲裁和答案收敛。

`search-middle-platform` 不是单次“搜一下”的脚本，而是一套把搜索流程中台化的能力骨架。
它适合那些不满足于单源搜索、需要根据查询类型切路线、需要对结果做聚合和仲裁、最后还要产出更收敛答案的场景。

## 概览

这个仓库打包了 `search-middle-platform` Skill 本体，以及当前 Beta 工作流用到的脚本和文档。

## 架构图

![Search Middle Platform Architecture](docs/architecture-diagram.png)

它特别适合这些任务：
- 技术问题排障与检索
- 通用网页搜索的多源聚合
- 图片搜索与图片结果聚合
- 需要“搜索 + 仲裁 + 答案收敛”的 Agent 工作流

## 仓库结构

- `search-middle-platform/`：可安装的 skill 目录
- `search-middle-platform/SKILL.md`：技能定义文件
- `search-middle-platform/scripts/`：搜索流程脚本
- `search-middle-platform/references/`：补充文档和历史说明
- `search-middle-platform.skill`：打包好的可分发 skill 文件

## 当前流水线形态

当前实现遵循这样一条链路：

`入口 → 路由 → 搜索执行 → 仲裁 → 答案收敛`

主要组件：
- `scripts/search_hub.js`：统一入口
- `scripts/search_router_mvp.js`：路由选择
- `scripts/multi_source_search_mvp.js`：通用多源搜索
- `scripts/tech_search_mvp.js`：基础技术搜索
- `scripts/tech_search_pro.js`：增强技术搜索
- `scripts/tech_search_ultimate.js`：扩展技术搜索
- `scripts/search_multi_source_images.js`：图片聚合搜索
- `scripts/search_arbiter_mvp.js`：基础结果仲裁
- `scripts/search_answer_mvp.js`：答案收敛输出
- `scripts/search_answer_nl.js`：自然语言答案包装

## 当前支持的路线

- `tech`
- `general`
- `image`

## 如何触发这个 Skill

这个 skill 有两种使用方式：

### 方式一：让 Agent 自动触发

当 `search-middle-platform` 被放进 Agent 的 skills 目录并成功加载后，用户提出以下类型任务时，Agent 应自动触发这个 skill：
- 技术问题搜索
- 通用网页搜索
- 图片聚合搜索
- 需要查询分类和搜索路由的任务
- 需要多源搜索、结果聚合、去重仲裁、答案收敛的任务

典型触发示例：
- “帮我查一下 OpenClaw browser timeout 怎么解决”
- “帮我搜索一下这个问题的资料，并综合多个来源给我结论”
- “帮我找这个关键词相关图片”
- “帮我做一个多源搜索，再把答案整理出来”

### 方式二：手动运行脚本

如果不通过 Agent 自动触发，也可以直接手动运行统一入口脚本。

从仓库根目录运行：

`node search-middle-platform/scripts/search_hub.js "OpenClaw browser timeout" output/search_hub`

或者从 skill 目录运行：

`node scripts/search_hub.js "OpenClaw browser timeout" output/search_hub`

### 适合触发的场景

- 不满足于单一搜索源
- 希望根据问题类型自动选择搜索路线
- 希望对多源结果做聚合和仲裁
- 希望最后拿到更收敛的答案，而不是一堆原始搜索结果

### 不太适合触发的场景

- 只需要一次非常简单的单源快速查询
- 不需要多源聚合
- 不需要仲裁和答案收敛
- 查询目标已经非常明确，直接用单一数据源更省

## 这套 Skill 能做什么

给定一个查询，当前系统可以：
- 判断查询属于哪一类
- 选择合适的搜索路线
- 执行对应的搜索流程
- 对原始结果做标准化和去重
- 做轻量仲裁
- 生成更收敛的最终答案

## 安装方式

### 方式一：直接使用 skill 目录

把 `search-middle-platform/` 放进你的 Agent skills 目录里，然后按你自己的 skills 工作流加载它。

### 方式二：直接导入打包文件

使用仓库里的：
- `search-middle-platform.skill`

把它导入支持 AgentSkills 的环境即可。

## 设计目标

这套项目希望做到：
- 对外只有一个简单入口
- 对内有明确的路由层
- 搜索源和搜索路线可以复用
- 仲裁层清晰可见
- 答案收敛层独立存在

## 当前状态

这是一个 Beta 仓库。

已经成立的部分：
- 整体架构骨架已经搭起来了
- 三类基础场景已经验证过
- 已经可以拿来做真实实验和内部使用

还需要继续加强的部分：
- 仲裁质量还不够强
- 分类逻辑还能继续收紧
- 各路线输出 schema 还不够统一
- 自动化测试还不够
- 公共工具层和 source adapter 抽象还可以更好

## 文档

- 中文文档入口：`docs/README.zh-CN.md`
- 架构说明：`docs/architecture.md`
- 流程图说明：`docs/flowchart.md`
- Mermaid 源文件：`docs/flowchart.mmd`
- 架构图 Mermaid：`docs/architecture-diagram.mmd`
- 架构图 PNG：`docs/architecture-diagram.png`
- 路线图：`docs/ROADMAP.md`
- 待办清单：`docs/TODO.md`
- 里程碑：`docs/MILESTONES.md`

## 相关仓库

这套搜索中台被 `team-mode-skill` 作为推荐搜索底座引用：
- `https://github.com/jasperliu2026ai/team-mode-skill`

## 可扩展方向

后续接入这套仓库时，常见扩展方向包括：
- 在路由层后面增加更多搜索源
- 为所有路线定义统一输出结构
- 增加可信度评分与排序逻辑
- 优化答案收敛逻辑和输出格式
- 给关键脚本补最小回归测试

## License

MIT
