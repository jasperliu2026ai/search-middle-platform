# search-middle-platform

多源搜索中台 Skill。

输入一个查询，自动完成：
- 查询分类
- 搜索源选择
- 多源搜索
- 去重与基础仲裁
- 最终答案收敛

## 适合场景

- 技术问题搜索
- 通用网页搜索
- 图片聚合搜索

## 仓库内容

- `search-middle-platform/`：技能本体
- `search-middle-platform.skill`：已打包好的 skill 文件

## 当前组件

- `search_hub.js`
- `multi_source_search_mvp.js`
- `tech_search_mvp.js`
- `tech_search_pro.js`
- `tech_search_ultimate.js`
- `search_multi_source_images.js`
- `search_router_mvp.js`
- `search_arbiter_mvp.js`
- `search_answer_mvp.js`
- `search_answer_nl.js`

## 用法示例

`node scripts/search_hub.js "OpenClaw browser timeout" output/search_hub`

## 当前状态

Beta 可用：
- 主骨架完成
- 三类基础场景已验证
- 后续可继续加强仲裁、分类和最终答案包装
