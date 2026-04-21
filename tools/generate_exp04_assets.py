from pathlib import Path
import textwrap


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs" / "coursework" / "exp04"


def dedent(text: str) -> str:
    return textwrap.dedent(text).strip() + "\n"


def write(rel_path: str, content: str) -> None:
    path = BASE / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dedent(content), encoding="utf-8")


def write_raw(rel_path: str, content: str) -> None:
    path = BASE / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def svg_wrap(width: int, height: int, body: str, bg: str = "#f8fafc") -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="{bg}"/>
  <style>
    .title {{ font: 700 26px 'Microsoft YaHei', sans-serif; fill: #0f172a; }}
    .subtitle {{ font: 500 14px 'Microsoft YaHei', sans-serif; fill: #475569; }}
    .label {{ font: 600 16px 'Microsoft YaHei', sans-serif; fill: #0f172a; }}
    .small {{ font: 500 12px 'Microsoft YaHei', sans-serif; fill: #475569; }}
    .tiny {{ font: 500 11px 'Microsoft YaHei', sans-serif; fill: #64748b; }}
    .box {{ fill: white; stroke: #94a3b8; stroke-width: 2; rx: 18; ry: 18; }}
    .wire {{ fill: #ffffff; stroke: #64748b; stroke-width: 2; rx: 12; ry: 12; }}
    .accent {{ fill: #dbeafe; stroke: #60a5fa; stroke-width: 2; rx: 14; ry: 14; }}
    .accent2 {{ fill: #dcfce7; stroke: #34d399; stroke-width: 2; rx: 14; ry: 14; }}
    .accent3 {{ fill: #fef3c7; stroke: #f59e0b; stroke-width: 2; rx: 14; ry: 14; }}
    .accent4 {{ fill: #fee2e2; stroke: #f87171; stroke-width: 2; rx: 14; ry: 14; }}
    .line {{ stroke: #64748b; stroke-width: 2.4; fill: none; marker-end: url(#arrow); }}
  </style>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
    </marker>
  </defs>
  {body}
</svg>"""


def wireframe_svg(title: str, blocks: list[tuple[int, int, int, int, str, str]]) -> str:
    body = [
        f'<text x="40" y="50" class="title">{title} 线框图</text>',
        '<text x="40" y="78" class="subtitle">低保真结构示意，聚焦布局、信息层级与交互区</text>',
        '<rect x="80" y="110" width="360" height="740" class="wire" fill="#fff"/>',
        '<rect x="100" y="130" width="320" height="42" class="wire"/>',
        '<text x="210" y="156" class="small">顶部状态/标题栏</text>',
    ]
    for x, y, w, h, label, desc in blocks:
        body.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" class="wire"/>')
        body.append(f'<text x="{x + 18}" y="{y + 28}" class="label">{label}</text>')
        body.append(f'<text x="{x + 18}" y="{y + 56}" class="small">{desc}</text>')
    return svg_wrap(520, 900, "\n  ".join(body), "#f1f5f9")


def mockup_base(title: str, subtitle: str, bg1: str, bg2: str, accent: str) -> str:
    return f"""
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="980" viewBox="0 0 560 980">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{bg1}"/>
      <stop offset="100%" stop-color="{bg2}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <style>
    .title {{ font: 700 28px 'Microsoft YaHei', sans-serif; fill: #0f172a; }}
    .sub {{ font: 500 14px 'Microsoft YaHei', sans-serif; fill: #334155; }}
    .white {{ fill: rgba(255,255,255,0.86); stroke: rgba(255,255,255,0.7); stroke-width: 1.2; rx: 24; ry: 24; filter: url(#shadow); }}
    .pill {{ fill: {accent}; rx: 16; ry: 16; }}
    .txt {{ font: 600 17px 'Microsoft YaHei', sans-serif; fill: #0f172a; }}
    .small {{ font: 500 13px 'Microsoft YaHei', sans-serif; fill: #475569; }}
    .tiny {{ font: 500 11px 'Microsoft YaHei', sans-serif; fill: #64748b; }}
  </style>
  <text x="52" y="64" class="title">{title}</text>
  <text x="52" y="92" class="sub">{subtitle}</text>
"""


def generate_docs() -> None:
    write(
        "assets/architecture/system-architecture.mmd",
        """
        flowchart LR
            subgraph Client["微信小程序前端 miniapp"]
                H[首页\\npages/home]
                L[日志打卡\\npages/log]
                R[碳报告\\npages/report]
                A[小碳问答\\npages/agent]
                U[请求封装\\nutils/request]
                H --> U
                L --> U
                R --> U
                A --> U
            end

            subgraph Server["Node.js + Express 后端 server"]
                APP[应用入口\\napp.js / server.js]
                ROUTE[路由层\\nroutes/*.js]
                CTRL[控制器层\\ncontrollers/*.js]
                SERVICE[业务服务层\\nappDataService.js]
                AGENT[Agent 服务\\nagentService.js]
                KNOW[知识检索\\nknowledgeService.js]
                MW[中间件\\nauthContext / errorHandler]
                APP --> MW --> ROUTE --> CTRL
                CTRL --> SERVICE
                CTRL --> AGENT
                AGENT --> KNOW
            end

            subgraph Data["数据与外部能力"]
                MYSQL[(MySQL\\ndatabase/schema.sql)]
                MOCK[(Mock Store\\nmockStore.js)]
                KB[(Markdown 知识库\\nknowledge/*.md)]
                OPENAI[(OpenAI 兼容模型 API)]
                SERVICE --> MYSQL
                SERVICE --> MOCK
                KNOW --> KB
                AGENT --> OPENAI
            end

            U -->|REST / JSON| APP
        """,
    )

    write(
        "assets/architecture/core-business-flow.mmd",
        """
        flowchart TD
            U1[用户进入首页] --> U2[点击日志打卡入口]
            U2 --> U3[选择低碳行为]
            U3 --> U4[POST /api/behaviors]
            U4 --> U5[appDataService 校验行为目录]
            U5 --> U6{MySQL 可用?}
            U6 -- 是 --> U7[写入 behavior_records / point_logs\\n更新 point_accounts 和 users]
            U6 -- 否 --> U8[回退 mockStore 返回演示结果]
            U7 --> U9[返回积分与减碳结果]
            U8 --> U9
            U9 --> U10[日志页弹出奖励 Toast]
            U10 --> U11[报告页请求 /api/reports/weekly-overview]
            U11 --> U12[聚合近 7 天行为记录]
            U12 --> U13[生成周报指标与趋势图]
            U13 --> U14[用户点击“让小碳解读报告”]
            U14 --> U15[POST /api/agent/chat]
            U15 --> U16[knowledgeService 检索知识片段]
            U16 --> U17[agentService 组织 prompt]
            U17 --> U18[调用模型 API 返回答案与建议问题]
            U18 --> U19[Agent 页面展示对话结果]
        """,
    )

    write(
        "assets/ui-flows/core-user-flow.mmd",
        """
        flowchart LR
            H[首页] -->|马上记录| L[日志打卡页]
            L -->|选择行为卡片| T[奖励 Toast]
            T -->|完成记录| R[碳报告页]
            R -->|解读报告| A[小碳问答页]
            A -->|追问积分/规则/互助| A
        """,
    )

    write(
        "design.md",
        """
        # 实验四设计说明（碳迹同行 Agent）

        ## 1. 设计目标
        - 在不修改现有项目代码和原有文档的前提下，补齐“架构设计与 UI 设计”课程作业所需的完整材料。
        - 设计内容完全基于当前项目真实结构：微信小程序前端、Node.js/Express 后端、MySQL/Mock 双数据源、Markdown 知识库与 Agent 问答能力。
        - 所有新增内容单独存放于 `docs/coursework/exp04/`，满足“文件只能增加、不删除、不覆盖”的约束。

        ## 2. 作业交付范围
        - 实验报告正文。
        - 系统整体架构图。
        - 核心业务流程图。
        - 至少 3 个核心页面线框图。
        - 至少 3 个核心页面高保真设计稿。
        - 核心用户流程图与关键交互说明。
        - 导出与提交说明。

        ## 3. 页面选择
        本次 UI 设计聚焦项目最具代表性的 4 个核心页面：
        1. 首页：展示积分、成就、快捷入口和 AI 引导。
        2. 日志打卡页：完成低碳行为记录，是业务主入口。
        3. 碳报告页：展示周减碳数据、趋势和报告解读入口。
        4. 小碳问答页：体现项目 AI 特色与知识问答能力。

        ## 4. 架构定位
        采用适合课程实验与当前实现状态的分层架构：
        - 表现层：微信小程序页面与组件。
        - 接口层：Express 路由与控制器。
        - 业务层：行为、积分、商品、报告、Agent 服务。
        - 数据层：MySQL 与 Mock Store。
        - 智能知识层：knowledgeService + 本地 Markdown 知识库 + OpenAI 兼容模型接口。

        ## 5. 设计原则
        - 真实性：描述必须与当前代码结构一致，不虚构不存在的系统边界。
        - 完整性：覆盖老师要求的背景、架构、流程、UI、交互与检查清单。
        - 可提交：报告可直接补姓名班级后导出 PDF。
        - 可复用：同时保留 `.mmd` 可编辑源文件与 `.svg` 成图。
        """,
    )

    write(
        "implementation-plan.md",
        """
        # 实验四作业包生成实施计划

        > 本文件是为当前课程作业交付准备的执行说明，不改原项目代码，只新增材料文件。

        ## Task 1: 归档交付目录
        - 创建 `docs/coursework/exp04/` 及其子目录。
        - 子目录覆盖架构图、流程图、线框图、高保真稿与说明文档。

        ## Task 2: 生成架构材料
        - 编写系统整体架构图源文件。
        - 编写核心业务流程图源文件。
        - 生成可直接插入报告的 SVG 图形文件。

        ## Task 3: 生成 UI 设计材料
        - 选定首页、日志打卡、碳报告、小碳问答四个核心页面。
        - 为每个页面生成线框图。
        - 为每个页面生成高保真设计稿。
        - 生成核心用户流程图。

        ## Task 4: 编写完整实验报告
        - 依据老师模板补齐项目背景、需求分析、架构决策、技术选型、组件职责、交互关系、UI 设计和检查清单。
        - 所有个人信息字段使用“[待填写]”占位，便于后续手工补充。

        ## Task 5: 交付自检
        - 检查至少包含 1 张架构图、1 张流程图、4 张线框图、4 张高保真设计稿。
        - 检查报告已覆盖老师列出的全部章节。
        - 补充 PDF 导出和命名说明。
        """,
    )

    # report.md and README.md are large enough to keep as raw strings for readability.
    write_raw("report.md", REPORT_MD)
    write(
        "README.md",
        """
        # 实验四作业包说明

        本目录是“架构设计与 UI 设计”课程作业的完整新增交付包，基于当前项目 `碳迹同行 Agent` 生成，不修改原项目文件。

        ## 目录结构
        - `report.md`：完整实验报告正文。
        - `design.md`：本次作业设计说明。
        - `implementation-plan.md`：作业材料生成实施计划。
        - `assets/architecture/`：架构图与业务流程图。
        - `assets/ui-wireframes/`：核心页面线框图。
        - `assets/ui-mockups/`：核心页面高保真设计稿。
        - `assets/ui-flows/`：核心用户流程图。

        ## 你最后只需要做的事
        1. 打开 `report.md`。
        2. 把“[待填写]”的班级、姓名、日期补上。
        3. 用 Typora、Markdown 编辑器或 Word 导出为 PDF。
        4. 命名为：`SE_Exp04碳迹同行Agent组长姓名.pdf`。

        ## 建议导出方式
        - Typora：打开 `report.md` -> 导出 -> PDF。
        - Word：将 Markdown 内容复制到 Word，保留图片，再导出 PDF。

        ## 说明
        - 图表源文件同时提供了 `.mmd` 版本，方便你后续编辑。
        - 全部文件均为新增文件，没有改动原项目任意已有文件。
        """,
    )


REPORT_MD = """
# 佛山大学 软件工程实验四：架构设计与UI设计

> 项目名称：碳迹同行 Agent  
> 专业班级：[待填写]  
> 组长姓名：[待填写]  
> 组员姓名：[待填写]  
> 指导教师：张友红  
> 提交日期：[待填写]

---

## 1 项目背景与需求分析

### 1.1 项目名称
碳迹同行 Agent

### 1.2 项目简介
“碳迹同行 Agent”是一个面向校园低碳生活场景的微信小程序项目，围绕“低碳行为记录—积分激励—数据反馈—AI问答支持”的闭环开展设计与实现。目标用户为高校学生，系统希望通过便捷的行为打卡、积分商城、周报反馈和智能答疑，降低低碳行为参与门槛，提升绿色生活方式的持续性与可见性。当前项目已具备可运行的小程序前端、Node.js/Express 后端、MySQL 建表脚本、Mock 演示数据机制以及基于本地 Markdown 知识库的轻量 RAG 能力，适合作为课程实验中的完整软件设计案例。

### 1.3 目标用户
- 校园学生：记录低碳行为、查看积分与周报、获取绿色行动建议。
- 校园运营/活动组织者：通过积分激励与活动引导提升参与度。
- 项目开发者：验证小程序、后端、数据库和 AI 助手协同工作的系统设计方案。

### 1.4 核心功能模块

| 模块名称 | 功能描述 | 优先级 |
|---|---|---|
| 首页看板 | 展示积分、减碳成果、挑战入口、近期成就和新闻提示 | 高 |
| 日志打卡 | 记录绿色出行、自带水杯、光盘行动等行为，并累计积分与减碳量 | 高 |
| 碳报告 | 根据用户近 7 天行为生成周报、趋势图和高亮总结 | 高 |
| 小碳问答 Agent | 回答积分规则、行为打卡、商城兑换、互助信息和隐私合规相关问题 | 高 |
| 广场互助 | 提供教材流转、闲置交换、互助认领等信息展示 | 中 |
| 积分商城 | 使用积分兑换校园权益或绿色周边商品 | 中 |
| 个人中心 | 展示个人资料、积分账户、兑换记录等信息 | 中 |

### 1.5 需求概述
1. 系统需要支持用户快速完成低碳行为记录，并即时反馈积分与减碳成果。
2. 系统需要提供结构清晰的数据回顾能力，让用户能看到自己的周度表现趋势。
3. 系统需要保留可扩展的业务边界，支持商城、广场互助和 AI 问答模块持续演进。
4. 系统需要在数据库不可用时仍保持可演示性，因此必须支持 Mock 数据回退。
5. 系统需要通过 AI 助手提升项目特色，但回答必须建立在项目知识库与当前业务规则基础上。

## 2 架构设计决策

### 2.1 架构风格选择

**选择的架构风格：分层架构（表现层 + 接口层 + 业务层 + 数据层 + 智能知识层）**

#### 决策理由
- **性能考量**：当前业务量主要集中于查询用户信息、提交行为记录、聚合周报和单轮 Agent 问答，请求规模适中。相比微服务，单体分层架构减少网络调用与部署复杂度，更适合课程实验和校园应用初期。
- **扩展性需求**：虽然目前采用单体后端，但通过路由、控制器、服务、数据访问和知识服务拆分职责，后续可按模块拆分出独立服务，例如将 Agent、商城、广场互助逐步独立。
- **团队技术栈**：项目当前实现基于微信小程序原生技术、Node.js、Express 与 MySQL，团队学习与维护成本较低，符合课程项目开发节奏。
- **成本预算**：单体部署资源需求小，开发、调试、联调和演示成本低；同时使用 Markdown 知识库与轻量检索代替向量数据库，可有效控制复杂度。
- **其他因素**：分层架构职责清晰，便于课程评审时展示系统边界、数据流向与模块关系；同时在 MySQL 不可用时接入 Mock Store，可以提高系统可维护性和演示稳定性。

### 2.2 技术选型说明

| 技术层级 | 选型方案 | 备选方案 | 选择理由 |
|---|---|---|---|
| 前端框架 | 微信小程序原生（WXML/WXSS/TS） | Vue3、React | 目标平台即微信小程序，原生方案适配性最好，学习成本低 |
| 后端框架 | Node.js + Express | Spring Boot、Django | 当前仓库已采用 Express，路由组织清晰，适合轻量 REST API |
| 数据库 | MySQL | PostgreSQL、MongoDB | 结构化数据关系明确，适合用户、积分、订单、行为记录等表设计 |
| 缓存 | 无（当前阶段） | Redis | 当前访问规模较小，课程实验阶段无需额外引入缓存中间件 |
| 消息队列 | 无（当前阶段） | RabbitMQ、Kafka | 当前交互以同步接口为主，没有异步削峰或复杂事件流需求 |
| 搜索引擎 | 无（当前阶段） | Elasticsearch | 当前知识检索采用本地 Markdown + 关键词匹配，规模较小 |
| 部署方式 | 传统 Node.js 开发部署 | Docker、K8s | 课程实验环境下部署和展示要求简单，传统部署即可满足 |
| AI 能力 | OpenAI 兼容 API + 本地知识库 | 纯规则问答 | 能体现项目特色，同时保留 RAG 增强和后续升级空间 |

## 3 架构图表

### 3.1 系统整体架构图

图表类型：分层组件图  
图表文件：

![系统整体架构图](./assets/architecture/system-architecture.svg)

图表说明：系统由微信小程序前端、Express 接口服务、业务服务层、MySQL/Mock 双数据源以及本地知识库与模型服务共同组成，形成一个适合校园低碳场景的轻量分层架构。

### 3.2 核心业务流程图

业务场景：低碳行为打卡—积分累计—周报生成—Agent 解读  
图表类型：流程图  
图表文件：

![核心业务流程图](./assets/architecture/core-business-flow.svg)

流程说明：
1. 用户从首页进入日志打卡页。
2. 用户选择具体低碳行为并提交。
3. 后端校验行为目录并根据数据源状态写入 MySQL 或回退 Mock。
4. 系统返回积分奖励与减碳结果，在前端弹出反馈提示。
5. 报告页聚合近 7 天记录，形成趋势图和周度摘要。
6. 用户可继续进入 Agent 页面，让“小碳”基于知识库和模型对周报进行解读。

## 4 架构详细说明

### 4.1 组件职责定义

| 组件名称 | 所属层级 | 核心职责 | 关键接口/方法 |
|---|---|---|---|
| `miniapp/pages/home` | 前端表现层 | 展示首页概览、积分、挑战入口和快捷导航 | `loadHomeData()`、`recordNow()`、`openVoiceAssistant()` |
| `miniapp/pages/log` | 前端表现层 | 提供行为打卡交互、调用行为提交接口、弹出奖励提示 | `loadBehaviorCatalog()`、`selectBehavior()`、`showRewardToast()` |
| `miniapp/pages/report` | 前端表现层 | 展示周报指标、趋势图、最佳减碳日与 Agent 入口 | `loadReportData()`、`buildTrendBars()`、`openAgent()` |
| `miniapp/pages/agent` | 前端表现层 | 提供对话式问答界面、建议问题和消息滚动体验 | `sendMessage()`、`tapSuggestion()` |
| `server/src/routes` | 接口层 | 负责按业务模块拆分 REST 路由 | `/users`、`/behaviors`、`/reports`、`/agent` |
| `server/src/controllers` | 接口层 | 接收请求、调用服务层、组织返回结果 | 行为、报告、商城、Agent 等控制器 |
| `appDataService.js` | 业务服务层 | 统一处理用户、积分、行为、商品、周报相关业务逻辑 | `getCurrentUser()`、`submitBehavior()`、`getWeeklyOverview()`、`redeemProduct()` |
| `agentService.js` | 智能服务层 | 负责构造模型消息、调用模型接口、返回建议追问 | `chat()`、`buildMessages()`、`buildSuggestions()` |
| `knowledgeService.js` | 知识检索层 | 从 Markdown 知识库中切块并检索相关片段 | `retrieveRelevantChunks()`、`formatChunksForPrompt()` |
| `mockStore.js` | 数据回退层 | 在数据库不可用时提供演示数据与交互结果 | `submitBehavior()`、`redeemProduct()` 等 |
| MySQL 数据库 | 数据层 | 持久化用户、积分、行为记录、订单、商品等结构化数据 | `users`、`point_accounts`、`behavior_records`、`orders` |
| Markdown 知识库 | 知识数据层 | 存放积分规则、FAQ、隐私政策和低碳常识内容 | `knowledge/*.md` |

### 4.2 组件交互关系

**交互场景 1：低碳行为打卡**
- 调用链：`日志打卡页` → `utils/request` → `POST /api/behaviors` → `behaviorController` → `appDataService.submitBehavior()` → `MySQL / mockStore`
- 协议：RESTful
- 数据格式：JSON
- 说明：前端提交行为编码与名称，服务层匹配行为目录，完成积分计算、用户总积分与总减碳量更新，并返回奖励结果。

**交互场景 2：周报查看**
- 调用链：`报告页` → `GET /api/reports/weekly-overview` → `reportController` → `appDataService.getWeeklyOverview()` → `MySQL / mockStore`
- 协议：RESTful
- 数据格式：JSON
- 说明：服务层聚合近 7 天行为记录，返回周标签、总减碳量、总积分、行为次数和趋势数组，由前端生成趋势柱状图。

**交互场景 3：Agent 问答**
- 调用链：`Agent 页` → `POST /api/agent/chat` → `agentController` → `agentService.chat()` → `knowledgeService.retrieveRelevantChunks()` → `OpenAI 兼容 API`
- 协议：RESTful
- 数据格式：JSON
- 说明：服务层先在本地知识库中检索相关片段，再组织成系统提示词和用户消息发送给模型，最后返回答案、建议问题与引用来源。

### 4.3 关键数据流说明
1. **行为记录数据流**：前端提交行为码 → 服务层计算积分与减碳值 → 更新用户总积分/总减碳量 → 记录积分日志 → 返回前端提示。
2. **周报数据流**：后端从近 7 天行为记录中按日期统计 → 汇总趋势数组与总量 → 前端绘制数据卡片和柱状图。
3. **知识问答数据流**：用户输入问题 → 本地知识库切块检索 → 将相关片段拼接进 prompt → 模型生成回答 → 前端展示结果与追问建议。

### 4.4 技术考量
- **双数据源策略**：`appDataService` 内通过 `isDbAvailable()` 判断当前数据源状态，在数据库不可用时自动回退 Mock，这一策略兼顾了开发演示稳定性与真实落库扩展性。
- **前后端解耦**：小程序页面只负责表现与交互，统一通过 `request.ts` 调用后端接口，便于后续替换服务地址或扩展鉴权逻辑。
- **Agent 模块可演进性**：当前使用本地 Markdown + 关键词检索，虽不如向量搜索强大，但足够支撑课程实验展示；后续可升级为向量数据库和重排序方案。
- **可维护性**：按路由、控制器、服务、数据访问拆分文件，便于定位问题和模块扩展。

## 5 UI 视觉设计

### 5.1 设计范围界定

本次 UI 设计聚焦项目最具业务代表性的页面，不包含“登录/注册/通用设置页”等老师说明可豁免的通用页面。

| 页面名称 | 页面类型 | 设计重点 | 优先级 |
|---|---|---|---|
| 首页 | 看板/入口页 | 数据概览、功能导航、AI引导、视觉品牌统一 | 高 |
| 日志打卡页 | 行为操作页 | 快速记录、即时反馈、低认知负担交互 | 高 |
| 碳报告页 | 数据分析页 | 指标卡片、趋势展示、报告解读入口 | 高 |
| 小碳问答页 | 对话页 | 消息层级、建议问题、输入区可用性 | 高 |

### 5.2 核心页面设计

#### 5.2.1 页面一：首页

页面定位：作为系统主入口，向用户展示当前积分、减碳成果、校园挑战、近期成就和快速导航，并通过 AI 入口引导用户进行后续记录与问答。

线框图：

![首页线框图](./assets/ui-wireframes/home-wireframe.svg)

高保真设计稿：

![首页高保真设计稿](./assets/ui-mockups/home-mockup.svg)

页面元素说明：

| 元素名称 | 元素类型 | 位置 | 交互说明 | 备注 |
|---|---|---|---|---|
| 品牌栏 | 顶部栏 | 顶部 | 展示品牌与通知入口 | 强化应用识别 |
| 积分环形区 | 数据卡片 | 首屏中心 | 展示积分与完成度，吸引用户关注核心目标 | 首页视觉中心 |
| AI 建议卡 | 对话卡片 | 首屏下方 | 点击“马上记录”跳转日志页 | 强化 Agent 引导 |
| 快捷功能区 | 导航卡片 | 中部 | 点击跳转不同业务模块 | 缩短任务路径 |
| 近期成就区 | 内容列表 | 中下部 | 浏览近期成果与累计收益 | 提升成就感 |
| 底部导航 | 导航栏 | 底部 | 在首页、日志、广场、商城、报告、我的之间切换 | 全局导航 |

交互逻辑：
1. 进入页面：自动并行请求用户信息、积分账户与周报概览。
2. 点击“马上记录”：跳转到日志打卡页。
3. 点击快捷卡片：进入对应业务页面。
4. 下拉刷新：重新请求首页数据并更新概览。
5. 异常状态：当接口失败时通过 Toast 提示“首页数据加载失败”。

#### 5.2.2 页面二：日志打卡页

页面定位：系统核心业务页面，用户通过选择低碳行为类型完成打卡，系统即时反馈积分和减碳值。

线框图：

![日志打卡线框图](./assets/ui-wireframes/log-wireframe.svg)

高保真设计稿：

![日志打卡高保真设计稿](./assets/ui-mockups/log-mockup.svg)

页面元素说明：

| 元素名称 | 元素类型 | 位置 | 交互说明 | 备注 |
|---|---|---|---|---|
| 页面标题区 | 说明区 | 顶部 | 提示页面目标与示例输入 | 降低理解门槛 |
| AI 圆球 | 视觉装饰/入口 | 中部上方 | 强化智能助手存在感 | 品牌化视觉 |
| 语音按钮 | 主操作按钮 | 中部 | 当前点击显示“下一步接入”提示 | 为后续扩展预留 |
| 快捷记录卡片 | 卡片按钮 | 中下部 | 点击后调用行为提交接口 | 关键操作区 |
| 奖励 Toast | 浮层反馈 | 顶部浮层 | 成功后显示积分与减碳奖励 | 强化即时反馈 |
| 底部导航 | 导航栏 | 底部 | 页面切换 | 全局一致性 |

交互逻辑：
1. 进入页面：请求行为目录，映射行为名称与减碳值。
2. 点击行为卡片：发送 `POST /api/behaviors` 请求。
3. 提交成功：弹出奖励 Toast，展示获得积分与减碳量。
4. 点击“小碳问答”：跳转到 Agent 页咨询规则问题。
5. 异常状态：提交失败时提示“提交失败，请稍后再试”。

#### 5.2.3 页面三：碳报告页

页面定位：数据反馈页面，用于向用户展示近 7 天的减碳表现、积分增长与行为次数，并引导进一步解读报告。

线框图：

![碳报告线框图](./assets/ui-wireframes/report-wireframe.svg)

高保真设计稿：

![碳报告高保真设计稿](./assets/ui-mockups/report-mockup.svg)

页面元素说明：

| 元素名称 | 元素类型 | 位置 | 交互说明 | 备注 |
|---|---|---|---|---|
| 周报主卡 | 核心数据卡 | 顶部 | 展示本周总减碳量与变化趋势 | 报告主视觉 |
| 指标卡片组 | 数据卡片 | 中部 | 展示本周减碳、积分、行为次数 | 结构化呈现 |
| 趋势柱状图 | 图表区 | 中下部 | 展示最近 5 天减碳趋势 | 数据分析核心 |
| 亮点卡片 | 提示卡片 | 中下部 | 展示最佳减碳日 | 提升解读性 |
| Agent 解读卡 | 跳转卡片 | 下部 | 点击进入问答页 | 数据分析延展 |
| 行动按钮 | 按钮组 | 底部前 | 海报分享 / 报告解读 | 二次传播与持续使用 |

交互逻辑：
1. 进入页面：请求周报接口，构建指标、趋势柱和亮点信息。
2. 下拉刷新：重新请求最新周报数据。
3. 点击“让小碳解读报告”：跳转到 Agent 页。
4. 点击“生成分享海报”：当前提示“下一步接入”，保留扩展空间。
5. 异常状态：接口失败时提示“报告数据加载失败”。

#### 5.2.4 页面四：小碳问答页

页面定位：项目特色页面，提供与业务规则、低碳知识、商城兑换、隐私合规等相关的对话式问答体验。

线框图：

![小碳问答线框图](./assets/ui-wireframes/agent-wireframe.svg)

高保真设计稿：

![小碳问答高保真设计稿](./assets/ui-mockups/agent-mockup.svg)

页面元素说明：

| 元素名称 | 元素类型 | 位置 | 交互说明 | 备注 |
|---|---|---|---|---|
| 返回按钮 | 图标按钮 | 顶部左侧 | 返回上一页；失败时回到首页 | 保证路径可逆 |
| 欢迎提示卡 | 信息卡片 | 顶部 | 说明问答能力范围 | 新手引导 |
| 消息列表 | 对话容器 | 中部 | 展示用户消息与助手消息 | 核心内容区 |
| 建议问题芯片 | 辅助按钮 | 助手消息下方 | 点击后自动发送问题 | 降低提问成本 |
| 输入框 | 表单输入 | 底部 | 输入文本后发送 | 单轮交互主入口 |
| 发送按钮 | 按钮 | 底部右侧 | 触发提问请求 | 交互闭环 |

交互逻辑：
1. 进入页面：展示欢迎语和推荐问题。
2. 点击推荐问题：自动发起一次问答请求。
3. 输入并发送：调用 `POST /api/agent/chat`，先插入等待消息，再替换为真实回答。
4. 响应成功：展示答案与新的建议追问。
5. 异常状态：返回友好兜底回答，并给出重新提问建议。

### 5.3 交互流程设计

#### 5.3.1 核心用户流程图

流程名称：从首页进入日志打卡，再查看周报并使用 Agent 解读  
图表文件：

![核心用户流程图](./assets/ui-flows/core-user-flow.svg)

流程说明：
1. 用户先在首页查看当前数据和 AI 提示。
2. 用户通过“马上记录”或快捷入口进入日志打卡页。
3. 完成行为提交后，系统通过奖励 Toast 给予即时反馈。
4. 用户进入碳报告页查看累计结果和趋势变化。
5. 用户点击“让小碳解读报告”进入 Agent 页进行深入了解与追问。

#### 5.3.2 关键交互说明

**交互 1：行为打卡即时反馈**
- 触发方式：点击任意行为卡片。
- 交互反馈：提交成功后顶部弹出奖励 Toast，展示积分与减碳数值。
- 状态变化：页面从“可提交”切换为“提交中”，完成后恢复可交互状态。
- 异常处理：当接口失败时弹出 Toast 提示，不中断页面浏览。

**交互 2：周报趋势解读**
- 触发方式：进入报告页或下拉刷新。
- 交互反馈：更新指标卡片、趋势柱状图与最佳减碳日。
- 状态变化：页面根据后端数据重绘统计结果。
- 异常处理：接口失败时保留当前页面结构，仅提示加载失败。

**交互 3：Agent 智能追问**
- 触发方式：点击建议问题芯片或手动输入后点击发送。
- 交互反馈：先显示“整理回答中”的等待态，再展示正式答案和新的建议问题。
- 状态变化：输入框清空、发送按钮进入禁用态，直到接口返回。
- 异常处理：使用兜底回复和替代建议问题，避免页面出现空白状态。

## 6 UI 设计文件清单

### 6.1 线框图
- 首页：`assets/ui-wireframes/home-wireframe.svg`
- 日志打卡页：`assets/ui-wireframes/log-wireframe.svg`
- 碳报告页：`assets/ui-wireframes/report-wireframe.svg`
- 小碳问答页：`assets/ui-wireframes/agent-wireframe.svg`

### 6.2 高保真设计稿
- 首页：`assets/ui-mockups/home-mockup.svg`
- 日志打卡页：`assets/ui-mockups/log-mockup.svg`
- 碳报告页：`assets/ui-mockups/report-mockup.svg`
- 小碳问答页：`assets/ui-mockups/agent-mockup.svg`

### 6.3 图表与流程图
- 系统整体架构图：`assets/architecture/system-architecture.svg`
- 核心业务流程图：`assets/architecture/core-business-flow.svg`
- 核心用户流程图：`assets/ui-flows/core-user-flow.svg`

## 7 实验结论

本次实验围绕“碳迹同行 Agent”项目完成了系统架构设计与核心功能 UI 设计。架构上，项目采用适合课程实验与校园应用初期的分层架构，通过小程序前端、Express 后端、MySQL/Mock 双数据源与 Agent/RAG 能力构建出一个可运行、可演示、可扩展的低碳生活服务系统。UI 设计上，围绕首页、日志打卡、碳报告和小碳问答四个关键页面完成了从线框图到高保真稿的设计，重点突出“低认知负担、即时反馈、品牌一致性和智能引导”四项原则。整体设计既符合当前项目实现状态，也为后续完善真实登录、真实落库、商城闭环和向量检索升级提供了清晰蓝图。

## 8 提交前检查清单

### 8.1 架构设计部分
- [x] 包含系统架构拓扑图
- [x] 包含至少一个核心流程图
- [x] 架构描述文档完整（含决策理由、组件说明、交互流程）
- [x] 图表清晰可读，并提供对应说明

### 8.2 UI 设计部分
- [x] 包含至少 3 个核心页面的线框图
- [x] 包含至少 3 个核心页面的高保真设计稿
- [x] 包含关键交互逻辑说明
- [x] 包含核心用户流程图

### 8.3 导出说明
- [ ] 将首页信息中的专业班级、姓名、日期补充完整
- [ ] 在支持 Markdown 导出的工具中导出为 PDF
- [ ] 按老师要求命名为 `SE_Exp04项目名称组长姓名.pdf`
"""


def generate_svgs() -> None:
    system_arch_svg = svg_wrap(
        1400,
        900,
        """
  <text x="60" y="60" class="title">碳迹同行 Agent 系统整体架构图</text>
  <text x="60" y="90" class="subtitle">分层架构：微信小程序前端 + Express 后端 + MySQL/Mock 双数据源 + 知识库 RAG</text>
  <rect x="60" y="140" width="320" height="620" class="accent"/>
  <text x="90" y="180" class="label">表现层：微信小程序前端</text>
  <rect x="90" y="220" width="260" height="90" class="box"/>
  <text x="115" y="255" class="label">首页 /home</text>
  <text x="115" y="282" class="small">积分看板、挑战入口、AI 引导</text>
  <rect x="90" y="330" width="260" height="90" class="box"/>
  <text x="115" y="365" class="label">日志打卡 /log</text>
  <text x="115" y="392" class="small">选择行为、提交打卡、奖励反馈</text>
  <rect x="90" y="440" width="260" height="90" class="box"/>
  <text x="115" y="475" class="label">碳报告 /report</text>
  <text x="115" y="502" class="small">周报统计、趋势图、亮点总结</text>
  <rect x="90" y="550" width="260" height="90" class="box"/>
  <text x="115" y="585" class="label">小碳问答 /agent</text>
  <text x="115" y="612" class="small">对话问答、建议问题、消息流</text>
  <rect x="90" y="660" width="260" height="70" class="wire"/>
  <text x="115" y="700" class="label">utils/request 统一请求封装</text>

  <rect x="470" y="140" width="430" height="620" class="accent2"/>
  <text x="500" y="180" class="label">接口与业务层：Node.js + Express</text>
  <rect x="500" y="220" width="370" height="70" class="box"/>
  <text x="525" y="262" class="label">app.js / server.js 应用入口</text>
  <rect x="500" y="310" width="170" height="90" class="box"/>
  <text x="525" y="345" class="label">路由层 routes</text>
  <text x="525" y="372" class="small">health / users / behaviors / reports / agent</text>
  <rect x="700" y="310" width="170" height="90" class="box"/>
  <text x="725" y="345" class="label">控制器层</text>
  <text x="725" y="372" class="small">参数校验、响应组织</text>
  <rect x="500" y="430" width="370" height="120" class="box"/>
  <text x="525" y="470" class="label">业务服务 appDataService</text>
  <text x="525" y="498" class="small">用户 / 积分 / 行为 / 商品 / 周报 / 数据源切换</text>
  <rect x="500" y="570" width="170" height="120" class="box"/>
  <text x="525" y="610" class="label">Agent 服务</text>
  <text x="525" y="638" class="small">prompt 构造、模型调用</text>
  <rect x="700" y="570" width="170" height="120" class="box"/>
  <text x="725" y="610" class="label">knowledgeService</text>
  <text x="725" y="638" class="small">知识切块、关键词检索</text>

  <rect x="980" y="140" width="360" height="620" class="accent3"/>
  <text x="1010" y="180" class="label">数据与外部能力层</text>
  <rect x="1010" y="230" width="300" height="110" class="box"/>
  <text x="1040" y="270" class="label">MySQL</text>
  <text x="1040" y="298" class="small">users / point_accounts / behavior_records / orders</text>
  <rect x="1010" y="370" width="300" height="90" class="box"/>
  <text x="1040" y="408" class="label">mockStore</text>
  <text x="1040" y="435" class="small">数据库不可用时的演示数据回退</text>
  <rect x="1010" y="490" width="300" height="90" class="box"/>
  <text x="1040" y="528" class="label">Markdown 知识库</text>
  <text x="1040" y="555" class="small">rules / faq / privacy / rewards / carbon_basics</text>
  <rect x="1010" y="610" width="300" height="90" class="box"/>
  <text x="1040" y="648" class="label">OpenAI 兼容模型 API</text>
  <text x="1040" y="675" class="small">生成自然语言回答与建议追问</text>

  <path d="M350 695 L500 695" class="line"/>
  <path d="M670 355 L700 355" class="line"/>
  <path d="M585 290 L585 310" class="line"/>
  <path d="M785 400 L785 430" class="line"/>
  <path d="M685 550 L685 570" class="line"/>
  <path d="M870 490 L1010 285" class="line"/>
  <path d="M870 490 L1010 415" class="line"/>
  <path d="M870 630 L1010 535" class="line"/>
  <path d="M670 630 L1010 655" class="line"/>
        """,
    )
    write_raw("assets/architecture/system-architecture.svg", system_arch_svg)

    core_business_svg = svg_wrap(
        1500,
        860,
        """
  <text x="60" y="60" class="title">核心业务流程图：日志打卡 → 周报生成 → Agent 解读</text>
  <text x="60" y="90" class="subtitle">展示行为记录、数据聚合和问答增强的端到端流程</text>
  <rect x="70" y="180" width="180" height="70" class="box"/><text x="102" y="223" class="label">1. 首页进入日志页</text>
  <rect x="300" y="180" width="180" height="70" class="box"/><text x="332" y="223" class="label">2. 选择行为卡片</text>
  <rect x="530" y="180" width="220" height="70" class="box"/><text x="562" y="223" class="label">3. POST /api/behaviors</text>
  <rect x="820" y="150" width="260" height="90" class="accent2"/><text x="850" y="190" class="label">4. appDataService 匹配行为目录</text><text x="850" y="218" class="small">计算积分与减碳值</text>
  <rect x="1150" y="145" width="220" height="100" class="accent3"/><text x="1206" y="188" class="label">5. 判断数据源状态</text><text x="1195" y="216" class="small">MySQL 可用 / Mock 回退</text>
  <rect x="1130" y="320" width="240" height="100" class="box"/><text x="1180" y="360" class="label">6A. MySQL 持久化</text><text x="1165" y="388" class="small">写行为、积分日志、账户余额</text>
  <rect x="820" y="320" width="240" height="100" class="box"/><text x="875" y="360" class="label">6B. mockStore 回退</text><text x="860" y="388" class="small">返回演示数据，保证可联调</text>
  <rect x="500" y="340" width="240" height="80" class="box"/><text x="548" y="385" class="label">7. 返回奖励结果</text>
  <rect x="220" y="340" width="220" height="80" class="box"/><text x="250" y="385" class="label">8. 前端弹出奖励 Toast</text>
  <rect x="60" y="520" width="220" height="80" class="box"/><text x="95" y="565" class="label">9. 进入碳报告页</text>
  <rect x="340" y="520" width="260" height="80" class="box"/><text x="375" y="565" class="label">10. GET /reports/weekly-overview</text>
  <rect x="660" y="500" width="260" height="120" class="accent2"/><text x="695" y="548" class="label">11. 聚合近 7 天行为记录</text><text x="695" y="576" class="small">统计总减碳、积分、次数与趋势</text>
  <rect x="980" y="520" width="220" height="80" class="box"/><text x="1017" y="565" class="label">12. 周报可视化展示</text>
  <rect x="1260" y="520" width="200" height="80" class="box"/><text x="1288" y="565" class="label">13. 点击 AI 解读</text>
  <rect x="1080" y="700" width="200" height="80" class="box"/><text x="1115" y="745" class="label">14. POST /agent/chat</text>
  <rect x="820" y="680" width="200" height="120" class="accent2"/><text x="850" y="725" class="label">15. 检索知识片段</text><text x="850" y="753" class="small">rules / faq / privacy 等</text>
  <rect x="560" y="700" width="200" height="80" class="box"/><text x="585" y="745" class="label">16. 调用模型生成回答</text>
  <rect x="280" y="700" width="220" height="80" class="box"/><text x="312" y="745" class="label">17. 展示答案与建议追问</text>
  <path d="M250 215 L300 215" class="line"/>
  <path d="M480 215 L530 215" class="line"/>
  <path d="M750 215 L820 195" class="line"/>
  <path d="M1080 195 L1150 195" class="line"/>
  <path d="M1260 245 L1260 320" class="line"/>
  <path d="M1150 195 L940 320" class="line"/>
  <path d="M820 370 L740 380" class="line"/>
  <path d="M1130 370 L740 380" class="line"/>
  <path d="M500 380 L440 380" class="line"/>
  <path d="M220 420 L170 520" class="line"/>
  <path d="M280 560 L340 560" class="line"/>
  <path d="M600 560 L660 560" class="line"/>
  <path d="M920 560 L980 560" class="line"/>
  <path d="M1200 560 L1260 560" class="line"/>
  <path d="M1360 600 L1180 700" class="line"/>
  <path d="M1080 740 L1020 740" class="line"/>
  <path d="M820 740 L760 740" class="line"/>
  <path d="M560 740 L500 740" class="line"/>
        """,
    )
    write_raw("assets/architecture/core-business-flow.svg", core_business_svg)

    core_ui_flow_svg = svg_wrap(
        1200,
        430,
        """
  <text x="60" y="60" class="title">核心用户流程图</text>
  <text x="60" y="90" class="subtitle">首页 → 日志打卡 → 碳报告 → 小碳问答</text>
  <rect x="70" y="170" width="180" height="100" class="accent"/>
  <text x="128" y="220" class="label">首页</text>
  <text x="108" y="248" class="small">查看积分与挑战入口</text>
  <rect x="330" y="170" width="200" height="100" class="accent2"/>
  <text x="390" y="220" class="label">日志打卡页</text>
  <text x="375" y="248" class="small">选择行为并提交记录</text>
  <rect x="610" y="170" width="200" height="100" class="accent3"/>
  <text x="670" y="220" class="label">碳报告页</text>
  <text x="655" y="248" class="small">查看周报和趋势变化</text>
  <rect x="890" y="170" width="220" height="100" class="accent4"/>
  <text x="955" y="220" class="label">小碳问答页</text>
  <text x="940" y="248" class="small">解读报告并继续追问</text>
  <path d="M250 220 L330 220" class="line"/>
  <path d="M530 220 L610 220" class="line"/>
  <path d="M810 220 L890 220" class="line"/>
  <text x="270" y="205" class="tiny">马上记录</text>
  <text x="560" y="205" class="tiny">完成打卡后查看结果</text>
  <text x="830" y="205" class="tiny">让小碳解读报告</text>
        """,
    )
    write_raw("assets/ui-flows/core-user-flow.svg", core_ui_flow_svg)

    write_raw(
        "assets/ui-wireframes/home-wireframe.svg",
        wireframe_svg(
            "首页",
            [
                (110, 200, 300, 170, "积分环形区", "积分/完成度/趋势信息"),
                (110, 390, 300, 140, "AI 建议卡片", "马上记录 / 稍后提醒"),
                (110, 550, 145, 110, "快捷卡片 A", "旧物回收"),
                (265, 550, 145, 110, "快捷卡片 B", "校园森林"),
                (110, 680, 300, 110, "近期成就列表", "展示最近两条成果"),
                (110, 805, 300, 28, "底部导航栏", "首页/日志/广场/商城/报告/我的"),
            ],
        ),
    )
    write_raw(
        "assets/ui-wireframes/log-wireframe.svg",
        wireframe_svg(
            "日志打卡页",
            [
                (110, 200, 300, 150, "页面引导区", "标题 + 副标题 + AI 圆球"),
                (170, 365, 180, 86, "语音记录按钮", "主操作占位"),
                (110, 470, 300, 56, "隐私提示胶囊", "语音仅本地处理"),
                (110, 550, 300, 76, "小碳问答入口卡", "跳转问答页"),
                (110, 650, 145, 120, "行为卡片 1-3", "绿色出行 / 自带水杯 / 自带餐具"),
                (265, 650, 145, 120, "行为卡片 4-6", "步行上楼 / 光盘行动 / 无纸笔记"),
                (110, 805, 300, 28, "底部导航栏", "全局导航"),
            ],
        ),
    )
    write_raw(
        "assets/ui-wireframes/report-wireframe.svg",
        wireframe_svg(
            "碳报告页",
            [
                (110, 200, 300, 120, "周报主卡", "减碳总量 + 趋势"),
                (110, 340, 95, 90, "指标卡 1", "本周减碳"),
                (212, 340, 95, 90, "指标卡 2", "本周积分"),
                (315, 340, 95, 90, "指标卡 3", "行为次数"),
                (110, 455, 300, 180, "趋势图区域", "最近 5 天柱状图"),
                (110, 650, 300, 76, "本周亮点卡", "最佳减碳日"),
                (110, 742, 300, 58, "Agent 解读入口", "让小碳解读报告"),
                (110, 805, 300, 28, "底部导航栏", "全局导航"),
            ],
        ),
    )
    write_raw(
        "assets/ui-wireframes/agent-wireframe.svg",
        wireframe_svg(
            "小碳问答页",
            [
                (110, 200, 300, 100, "欢迎提示卡", "说明支持的提问范围"),
                (110, 320, 300, 340, "消息列表区", "助手消息 / 用户消息 / 建议问题"),
                (110, 680, 300, 60, "输入区域", "输入框 + 发送按钮"),
                (110, 805, 300, 28, "底部输入固定区", "持续提问"),
            ],
        ),
    )

    home_mock = mockup_base("首页高保真稿", "视觉关键词：数据看板、绿色未来感、AI 陪伴", "#e0f2fe", "#f0fdf4", "#bbf7d0") + """
  <circle cx="440" cy="120" r="70" fill="#93c5fd" opacity="0.35"/>
  <circle cx="110" cy="180" r="54" fill="#86efac" opacity="0.30"/>
  <rect x="40" y="120" width="480" height="180" class="white"/>
  <circle cx="160" cy="210" r="72" fill="#0f766e" opacity="0.08"/>
  <circle cx="160" cy="210" r="55" fill="none" stroke="#0f766e" stroke-width="12" opacity="0.35"/>
  <text x="130" y="204" class="txt" style="font-size:34px;">1284</text>
  <text x="148" y="232" class="small">今日目标 80%</text>
  <text x="270" y="182" class="txt">碳迹同行</text>
  <text x="270" y="215" class="small">离下一份绿色权益又近了一步</text>
  <rect x="270" y="235" width="132" height="34" class="pill"/>
  <text x="292" y="257" class="tiny">较昨日提升 +12%</text>
  <rect x="40" y="330" width="480" height="160" class="white"/>
  <circle cx="110" cy="410" r="34" fill="#0ea5e9" opacity="0.18"/>
  <text x="86" y="418" class="txt">AI</text>
  <text x="165" y="385" class="txt">小碳建议</text>
  <text x="165" y="415" class="small">检测到你今天步行了 3 公里，是否立即记录？</text>
  <rect x="165" y="440" width="120" height="34" class="pill"/>
  <rect x="300" y="440" width="120" height="34" fill="#e2e8f0" rx="16" ry="16"/>
  <text x="193" y="462" class="tiny">马上记录</text>
  <text x="331" y="462" class="tiny">稍后再说</text>
  <rect x="40" y="520" width="230" height="150" class="white"/>
  <rect x="290" y="520" width="230" height="150" class="white"/>
  <text x="68" y="566" class="txt">旧物回收</text>
  <text x="68" y="595" class="small">一键进入可回收物记录</text>
  <text x="318" y="566" class="txt">校园森林</text>
  <text x="318" y="595" class="small">查看树木认养与绿色活动</text>
  <rect x="40" y="700" width="480" height="180" class="white"/>
  <text x="68" y="745" class="txt">近期成就</text>
  <rect x="68" y="770" width="424" height="42" fill="#f8fafc" rx="14" ry="14"/>
  <rect x="68" y="825" width="424" height="42" fill="#f8fafc" rx="14" ry="14"/>
  <text x="88" y="797" class="small">本周减碳累计 +24.8kg</text>
  <text x="88" y="852" class="small">积分账户余额 1284 分</text>
  <rect x="40" y="910" width="480" height="44" fill="rgba(255,255,255,0.75)" rx="22" ry="22"/>
  <text x="92" y="938" class="tiny">首页</text><text x="172" y="938" class="tiny">日志</text><text x="252" y="938" class="tiny">广场</text><text x="332" y="938" class="tiny">商城</text><text x="412" y="938" class="tiny">报告</text>
</svg>
"""
    write_raw("assets/ui-mockups/home-mockup.svg", home_mock)

    log_mock = mockup_base("日志打卡高保真稿", "视觉关键词：低门槛操作、即时奖励、可信反馈", "#ecfeff", "#ecfccb", "#86efac") + """
  <circle cx="420" cy="130" r="76" fill="#5eead4" opacity="0.30"/>
  <rect x="40" y="120" width="480" height="240" class="white"/>
  <text x="72" y="172" class="txt">告诉小碳你今天的减碳行为</text>
  <text x="72" y="202" class="small">例如：今天在食堂使用了自带餐具</text>
  <circle cx="280" cy="275" r="56" fill="#0f766e" opacity="0.10"/>
  <circle cx="280" cy="275" r="44" fill="#0ea5e9" opacity="0.16"/>
  <text x="256" y="283" class="txt">AI</text>
  <rect x="170" y="390" width="220" height="84" class="white"/>
  <circle cx="280" cy="432" r="28" fill="#14b8a6" opacity="0.20"/>
  <text x="248" y="440" class="txt">语音记录</text>
  <rect x="74" y="500" width="412" height="44" fill="#dcfce7" rx="22" ry="22"/>
  <text x="106" y="528" class="tiny">隐私声明：语音仅在本地处理，不上传云端</text>
  <rect x="40" y="570" width="480" height="78" class="white"/>
  <text x="72" y="617" class="txt">小碳问答</text>
  <text x="190" y="617" class="small">AI 助手陪你聊减碳心得</text>
  <rect x="40" y="675" width="230" height="120" class="white"/>
  <rect x="290" y="675" width="230" height="120" class="white"/>
  <text x="70" y="718" class="txt">绿色出行</text>
  <text x="70" y="745" class="small">+120g</text>
  <text x="320" y="718" class="txt">自带水杯</text>
  <text x="320" y="745" class="small">+40g</text>
  <rect x="40" y="812" width="230" height="120" class="white"/>
  <rect x="290" y="812" width="230" height="120" class="white"/>
  <text x="70" y="855" class="txt">光盘行动</text>
  <text x="70" y="882" class="small">+150g</text>
  <text x="320" y="855" class="txt">无纸笔记</text>
  <text x="320" y="882" class="small">+200g</text>
</svg>
"""
    write_raw("assets/ui-mockups/log-mockup.svg", log_mock)

    report_mock = mockup_base("碳报告高保真稿", "视觉关键词：数据故事化、层级清晰、趋势突出", "#eff6ff", "#dcfce7", "#fde68a") + """
  <rect x="40" y="120" width="480" height="170" class="white"/>
  <text x="70" y="170" class="tiny">WEEKLY OVERVIEW</text>
  <text x="70" y="220" class="txt" style="font-size:42px;">24.8 kg</text>
  <text x="70" y="250" class="small">本周累计碳减排</text>
  <rect x="70" y="265" width="140" height="30" class="pill"/>
  <text x="92" y="284" class="tiny">较上一日变化 +12%</text>
  <rect x="40" y="320" width="145" height="110" class="white"/>
  <rect x="207" y="320" width="145" height="110" class="white"/>
  <rect x="374" y="320" width="145" height="110" class="white"/>
  <text x="66" y="365" class="txt">24.8 kg</text><text x="66" y="392" class="small">本周减碳</text>
  <text x="233" y="365" class="txt">126 分</text><text x="233" y="392" class="small">本周积分</text>
  <text x="400" y="365" class="txt">18 次</text><text x="400" y="392" class="small">行为次数</text>
  <rect x="40" y="460" width="480" height="250" class="white"/>
  <text x="70" y="505" class="txt">周减碳趋势</text>
  <line x1="80" y1="665" x2="480" y2="665" stroke="#94a3b8" stroke-width="2"/>
  <rect x="110" y="590" width="36" height="75" fill="#bfdbfe" rx="12" ry="12"/>
  <rect x="180" y="560" width="36" height="105" fill="#bfdbfe" rx="12" ry="12"/>
  <rect x="250" y="535" width="36" height="130" fill="#bfdbfe" rx="12" ry="12"/>
  <rect x="320" y="505" width="36" height="160" fill="#34d399" rx="12" ry="12"/>
  <rect x="390" y="555" width="36" height="110" fill="#bfdbfe" rx="12" ry="12"/>
  <text x="112" y="690" class="tiny">周一</text><text x="182" y="690" class="tiny">周二</text><text x="252" y="690" class="tiny">周三</text><text x="322" y="690" class="tiny">周四</text><text x="392" y="690" class="tiny">周五</text>
  <rect x="40" y="740" width="480" height="70" class="white"/>
  <text x="70" y="783" class="txt">本周最佳减碳日：周五 · 5.4kg</text>
  <rect x="40" y="835" width="480" height="84" class="white"/>
  <text x="70" y="882" class="txt">让小碳解读这份周报</text>
  <text x="70" y="907" class="small">看看你这周最值得继续坚持的低碳行为</text>
</svg>
"""
    write_raw("assets/ui-mockups/report-mockup.svg", report_mock)

    agent_mock = mockup_base("小碳问答高保真稿", "视觉关键词：对话友好、建议清晰、输入聚焦", "#f8fafc", "#dbeafe", "#bfdbfe") + """
  <rect x="40" y="120" width="480" height="110" class="white"/>
  <text x="70" y="168" class="tiny">ALWAYS READY</text>
  <text x="70" y="200" class="txt">问积分、问规则、问上线准备，都可以问小碳</text>
  <rect x="40" y="260" width="330" height="110" class="white"/>
  <text x="68" y="308" class="small">你好，我是小碳。你可以直接问我积分规则、行为打卡、</text>
  <text x="68" y="334" class="small">商城兑换、教材互助和隐私合规。</text>
  <rect x="62" y="380" width="118" height="34" class="pill"/>
  <rect x="194" y="380" width="126" height="34" fill="#e2e8f0" rx="16" ry="16"/>
  <text x="84" y="402" class="tiny">为什么没加分</text>
  <text x="214" y="402" class="tiny">商城兑换规则</text>
  <rect x="190" y="440" width="330" height="76" fill="#dbeafe" rx="22" ry="22"/>
  <text x="214" y="485" class="small">为什么今天没有加分？</text>
  <rect x="40" y="540" width="360" height="132" class="white"/>
  <text x="68" y="585" class="small">如果你已经成功提交行为记录，但积分没有更新，</text>
  <text x="68" y="611" class="small">可能是网络请求失败、重复提交被拦截，或当前还在</text>
  <text x="68" y="637" class="small">Mock 演示数据模式。建议先检查日志页是否显示奖励 Toast。</text>
  <rect x="40" y="860" width="480" height="72" class="white"/>
  <rect x="62" y="878" width="360" height="36" fill="#f8fafc" rx="18" ry="18"/>
  <circle cx="470" cy="896" r="18" fill="#0ea5e9"/>
  <text x="85" y="901" class="tiny">向小碳提问...</text>
  <text x="463" y="901" class="tiny" style="fill:white;">发</text>
</svg>
"""
    write_raw("assets/ui-mockups/agent-mockup.svg", agent_mock)


def main() -> None:
    BASE.mkdir(parents=True, exist_ok=True)
    generate_docs()
    generate_svgs()
    print(f"Generated exp04 coursework package at: {BASE}")


if __name__ == "__main__":
    main()
