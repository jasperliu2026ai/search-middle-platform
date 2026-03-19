# 搜索中台 Skill 草案

## 名字

`search-middle-platform`

## 一句话定位

多源搜索、自动路由、结果仲裁、答案收敛的一体化搜索中台 Skill。

## 目标

让用户只丢问题，不用关心走哪种搜索源，系统自动完成：
- 查询类型判断
- 搜索源选择
- 多源结果聚合
- 去重与仲裁
- 最终答案输出

## 当前能力基座

- 通用搜索：`multi_source_search_mvp.js`
- 技术搜索：`tech_search_mvp.js` / `tech_search_pro.js` / `tech_search_ultimate.js`
- 图片搜索：`search_multi_source_images.js`
- 自动路由：`search_router_mvp.js`
- 多路仲裁：`search_arbiter_mvp.js`
- 答案收敛：`search_answer_mvp.js` / `search_answer_nl.js`
- 统一入口：`search_hub.js`

## 建议对外接口

输入：
- `query`
- `mode`（可选：auto / tech / image / general）

输出：
- `route`
- `top results`
- `final answer`
- `raw result path`

## Beta 阶段定义

当前可以作为 Beta 使用，适合：
- 技术问题检索
- 通用网页检索
- 图片聚合搜索

暂不宣称完美：
- 仲裁仍是 MVP 级
- 分类仍较粗
- 部分源稳定性一般
