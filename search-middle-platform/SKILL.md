---
name: search-middle-platform
description: 多源搜索中台 Skill，用于技术搜索、通用网页搜索、图片聚合搜索中的查询分类、搜索路由、结果聚合、去重仲裁和答案收敛。当任务不只是一次单源快速查询，而是需要根据问题类型选择路线、整合多个来源并输出更收敛的最终答案时使用。
---

# Search Middle Platform

把单个查询送进一条结构化的搜索流水线。

## 它做什么

给定一个查询，这个 skill 可以：
- 判断查询类型
- 选择搜索路线
- 执行一条或多条搜索流程
- 对结果做去重和基础仲裁
- 生成最终答案

## 当前支持的路线

- `tech`
- `general`
- `image`

## 当前组件

- `scripts/search_hub.js`
- `scripts/multi_source_search_mvp.js`
- `scripts/tech_search_mvp.js`
- `scripts/tech_search_pro.js`
- `scripts/tech_search_ultimate.js`
- `scripts/search_multi_source_images.js`
- `scripts/search_router_mvp.js`
- `scripts/search_arbiter_mvp.js`
- `scripts/search_answer_mvp.js`
- `scripts/search_answer_nl.js`

## 统一入口

使用统一入口脚本：
- `node scripts/search_hub.js "<query>" <output-dir>`

示例：
- `node scripts/search_hub.js "OpenClaw browser timeout" output/search_hub`

## 推荐工作流

1. 判断查询属于 `tech`、`general` 还是 `image`
2. 路由到对应的搜索流程
3. 聚合并标准化原始结果
4. 做基础仲裁
5. 返回最终答案和原始输出路径（如果需要）

## 参考文档

按需阅读：
- `references/search-middle-platform-skill.md`
- `references/search-middle-platform-tests.md`

## 当前状态

这是一个 Beta skill：
- 核心骨架已经完成
- 三类基础场景已经验证
- 仲裁、分类和答案包装仍可继续增强
