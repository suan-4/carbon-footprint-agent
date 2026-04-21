# 碳迹同行 Agent

面向校园低碳场景的微信小程序项目，核心目标是把“低碳打卡、积分激励、校园互助、积分商城、周报分析、AI 问答”做成一条可运行的业务闭环。

当前仓库已经不是纯静态原型，而是一个可运行的半成品工程，包含：

- 微信小程序前端 `miniapp/`
- Node.js + Express 后端 `server/`
- MySQL 数据库脚本 `database/`
- Agent 与本地知识库 `knowledge/`
- 早期高保真 HTML 原型 `src/html_page/`

## 当前完成度

已完成并验证的部分：

- 微信小程序工程已建立，主要页面已迁移为原生小程序页面
- 微信登录已接入真实 `wx.login -> code2Session`
- 后端已接入 MySQL，支持真实用户、真实会话、真实积分账户
- 行为打卡会真实写入数据库，并同步更新积分、减碳值、积分日志
- 商城兑换会真实扣减积分、生成订单、写入积分日志
- 商城已支持 `physical`、`virtual`、`badge` 三类商品
- 广场支持真实认领，已补齐“完成认领 -> 发放积分 -> 关闭需求”闭环
- 报告接口可基于真实打卡数据生成周概览
- Agent 已接入 OpenAI 兼容接口，并接入本地 Markdown 知识库的轻量 RAG

仍未完成的部分：

- 真实线上 HTTPS 域名与真机可访问部署
- 小程序审核需要的隐私政策、服务类目、备案与提交材料
- 广场发帖、审核、联系、取消、后台管理等完整运营流程
- 商城核销、发货、履约、后台管理
- 向量数据库版 RAG、召回优化、引用质量评估
- 管理后台与运营数据面板

## 目录结构

```text
.
├── miniapp/                     # 微信小程序前端
├── server/                      # Node.js + Express 后端
├── database/                    # MySQL 建表与种子数据
├── knowledge/                   # Agent 本地知识库
├── docs/                        # 项目说明文档
├── src/html_page/               # 早期 HTML 原型
├── 项目交接报告.md              # 给队友的交接文档
└── README.md
```

## 技术栈

- 前端：微信小程序原生开发，TypeScript + WXML + WXSS
- 后端：Node.js + Express
- 数据库：MySQL 8
- AI：OpenAI 兼容接口
- RAG：本地 Markdown 切块 + 关键词检索

## 已有页面

- `pages/home` 首页
- `pages/log` 日志打卡
- `pages/plaza` 广场互助
- `pages/mall` 积分商城
- `pages/report` 碳报告
- `pages/profile` 我的
- `pages/redemptions` 我的兑换
- `pages/agent` 小碳问答
- `pages/settings` 接口环境
- `pages/privacy` 隐私政策
- `pages/agreement` 用户协议

## 主要接口

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `GET /api/users/me/points`
- `GET /api/users/me/redemptions`
- `GET /api/behaviors/catalog`
- `POST /api/behaviors`
- `GET /api/products`
- `POST /api/products/:id/redeem`
- `GET /api/reports/weekly-overview`
- `GET /api/plaza/feed`
- `POST /api/plaza/posts/:id/claim`
- `POST /api/plaza/posts/:id/complete`
- `POST /api/agent/chat`

## 快速启动

### 1. 初始化数据库

先确保本机 MySQL 可连接，然后执行：

```sql
CREATE DATABASE IF NOT EXISTS carbon_agent DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carbon_agent;
SOURCE C:/Users/何/Desktop/work/computer/大模型/项目/碳足迹Agent/database/schema.sql;
SOURCE C:/Users/何/Desktop/work/computer/大模型/项目/碳足迹Agent/database/seed.sql;
```

### 2. 配置后端环境变量

进入后端目录：

```powershell
cd server
```

复制配置模板：

```powershell
Copy-Item .env.example .env
```

至少确认这些配置项正确：

- `PORT`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

### 3. 启动后端

```powershell
cd server
npm install
npm run dev
```

检查健康状态：

```text
http://localhost:3000/
http://localhost:3000/api/health
```

检查当前环境配置：

```powershell
cd server
npm run doctor
```

### 4. 启动小程序

用微信开发者工具打开：

```text
miniapp/
```

注意：

- `miniapp/project.config.json` 里的 `appid` 要和你当前使用的小程序一致
- 当前默认请求地址是 `http://localhost:3000/api`
- 可在“我的 -> 接口环境”中切换为自定义地址
- 这只适合开发者工具本地调试，真机与上线要换成正式 HTTPS 域名

## 当前验证结果

本仓库最近已验证通过：

- `cd server && npm test`
- `cd miniapp && .\node_modules\.bin\tsc --noEmit -p tsconfig.json`

并且已经手工验证过：

- 真实微信登录
- 用户信息读取
- 行为打卡写库
- 周报统计
- 商城兑换写库
- 广场认领与完成认领写库

## Agent 与知识库

核心文件：

- `server/src/services/agentService.js`
- `server/src/services/knowledgeService.js`

当前知识库目录：

- `knowledge/faq.md`
- `knowledge/rules.md`
- `knowledge/rewards.md`
- `knowledge/privacy.md`
- `knowledge/carbon_basics.md`

当前 RAG 方案是轻量版，不是向量库方案。实现方式是：

- 读取本地 Markdown 文件
- 按标题结构切块
- 基于关键词匹配召回
- 将命中片段拼入 Prompt

## 下一步建议

如果目标是尽快上线，建议按这个顺序继续：

1. 部署后端到可被真机访问的 HTTPS 域名
2. 把小程序请求地址从 `localhost` 换成正式域名
3. 补齐隐私政策、用户协议、审核资料
4. 完成广场发帖与商城核销后台
5. 优化 Agent 的知识库质量和 RAG 召回
