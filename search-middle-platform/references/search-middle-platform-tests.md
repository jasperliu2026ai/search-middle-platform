# 搜索中台测试用例（Beta）

## 1. 技术搜索

查询：`OpenClaw browser timeout`
期望：
- 自动路由到 `tech`
- 返回 GitHub / docs / 技术网页结果
- 生成统一答案文件

## 2. 通用搜索

查询：`杭州今天天气怎么样`
期望：
- 自动路由到 `general`
- 返回网页结果
- 不报错

## 3. 图片搜索

查询：`美女 写真`
期望：
- 自动路由到 `image`
- 返回图片 URL 聚合结果
- 合并去重数量 > 0

## 4. 技术社区结果

查询：`playwright timeout issue`
期望：
- 结果中应包含 GitHub issue / Stack Overflow / docs 候选

## 5. 降级能力

前提：不设置 `GITHUB_TOKEN` / `BRAVE_API_KEY`
期望：
- 系统仍能完成搜索
- 只是少部分源跳过，不整体失败

## 6. 统一入口

命令：`node search_hub.js "OpenClaw browser timeout" output/search_hub_test`
期望：
- 生成 `final.json`
- 包含 `query` / `route` / `answer`
