# 架构重构设计

## 核心问题

**原设计的问题**：
- Skill 包含课程内容（lesson-l0/SKILL.md）
- 教学方法与课程内容耦合
- 无法复用 Skill 到其他学习项目

**新设计的目标**：
- Skill = 通用学习教练（方法1/2/3协议）
- 课程内容 = 项目资源（独立于 Skill）
- 任何项目都可以引入 Skill 进行学习

---

## 架构对比

### 原架构（错误）

```
State-driven-progressive-learning-system/
├── skills/
│   ├── master-learning-coordinator/     # Master
│   ├── lesson-l0-agent-essence/         # ❌ 课程内容在 Skill 里
│   ├── lesson-l1-cognitive-architecture/
│   └── lesson-l2-memory-system/
└── ...
```

**问题**：
- Skill 和课程内容绑定
- 换个学习主题需要重写所有 Lesson Skills

---

### 新架构（正确）

```
# Skill（全局安装，通用）
~/.config/agents/skills/
└── progressive-learning-coach/
    └── SKILL.md                          # 通用学习教练

# 项目A：学习 Agent 架构
D:/projects/learning-agent-architecture/
├── .learning/
│   ├── learning-state.json               # 学习状态
│   └── memory-store.json                 # 记忆存储
├── syllabus.yaml                         # 课程大纲
└── lessons/
    ├── l0-agent-essence.md               # 课程内容
    ├── l1-cognitive-architecture.md
    └── ...

# 项目B：学习 Python（复用同一个 Skill）
D:/projects/learning-python/
├── .learning/
│   ├── learning-state.json
│   └── memory-store.json
├── syllabus.yaml                         # 完全不同的课程
└── lessons/
    ├── l0-python-basics.md
    ├── l1-data-structures.md
    └── ...
```

**优势**：
- Skill 可复用于任何学习项目
- 项目只包含课程内容和学习状态
- 更换学习主题 = 新建项目 + 写 syllabus

---

## Skill 职责

### Progressive Learning Coach Skill

**核心功能**：
1. 读取项目中的 `syllabus.yaml`
2. 管理 `learning-state.json`
3. 执行方法1（心智模型构建）
4. 执行方法2（结构化学习）
5. 执行方法3（对抗测试）
6. 协调课程进度

**触发条件**：
- 用户说"开始学习"、"继续"、"查看进度"
- 检测到 `.learning/` 目录存在或需要创建

---

## 课程内容格式

### syllabus.yaml

```yaml
meta:
  domain: "llm_agent_architecture"  # 学习领域
  total_lessons: 12                  # 总课程数
  estimated_total_hours: 35          # 预计总时长

# 课程大纲
syllabus:
  - id: "L0"
    title: "Agent 本质论"
    subtitle: "理解 Agent = 状态机 + 工具调用 + 环境反馈"
    estimated_hours: 2
    todos_count: 5
    file: "lessons/l0-agent-essence.md"
    prerequisites: []                 # 前置课程
    core_points:                      # 核心掌握点
      - "Agent 三要素定义"
      - "感知-思考-行动循环"
      - "工具调用必要性"
      - "环境反馈作用"
    
  - id: "L1"
    title: "认知架构"
    subtitle: "ReAct vs Reflexion"
    estimated_hours: 3
    todos_count: 7
    file: "lessons/l1-cognitive-architecture.md"
    prerequisites: ["L0"]
    core_points:
      - "ReAct 循环机制"
      - "显式思考价值"
      - "Reflexion 三层结构"
      - "ReAct 局限性"
      
  - id: "L2"
    title: "记忆系统"
    subtitle: "从短期到长期"
    estimated_hours: 3
    todos_count: 6
    file: "lessons/l2-memory-system.md"
    prerequisites: ["L1"]
    core_points:
      - "三层记忆模型"
      - "Vector Store 原理"
      - "记忆策略设计"
      - "性能瓶颈分析"

# 学习方法配置（可选，使用默认值）
learning_config:
  method1_mental_model:
    enabled: true
    duration_ratio: 0.2
  method2_structured:
    enabled: true
    duration_ratio: 0.5
    sq3r_enabled: true
    project_based_enabled: true
  method3_adversarial:
    enabled: true
    duration_ratio: 0.3
    socratic_enabled: true
    counterfactual_enabled: true
    fault_injection_enabled: true

# 艾宾浩斯复习配置（分钟）
review_schedule: [20, 60, 540, 1440, 2880, 8640, 44640]
```

### lessons/l0-agent-essence.md

```markdown
# Lesson L0: Agent 本质论

## 学习目标

- 🔴 **核心**: 用自己的话解释 Agent 与其他 AI 系统的本质区别
- 🔴 **核心**: 画出 Agent 的感知-思考-行动循环
- 🔴 **核心**: 识别一个系统是否为 Agent（判断三要素）
- 🟠 **重点**: 讨论 System Prompt 与 Fine-tuning 的差异
- 🟡 **了解**: Agent 概念的历史演变

## TODO 清单

### TODO-1: 概念辨析 - 什么是 Agent？（🔴）

**目标**: 建立对 Agent 本质的准确理解

**内容**:
1. 阅读材料：对比 Agent vs LLM vs RAG vs Workflow
2. 完成对比表格
3. 费曼检验：一句话解释

**产出**:
- 对比表格
- 费曼解释

**完成检查**:
- [ ] 能准确说出 Agent 三要素
- [ ] 能举例说明什么不是 Agent
- [ ] 费曼解释没有术语堆砌

---

### TODO-2: 心智模型 - Agent 架构拆解（🔴）

**目标**: 掌握 Agent 的基础架构模型

**内容**:
1. 画出感知-思考-行动循环图
2. 为每个环节定义
3. 实现最简 Agent 伪代码

**产出**:
- 架构图
- 定义说明
- 伪代码

**完成检查**:
- [ ] 架构图包含四个核心组件
- [ ] 能解释为什么记忆是跨循环的
- [ ] 伪代码展示了循环结构

---

### TODO-3: 专家共识与分歧（🔴）

**目标**: 理解领域专家对 Agent 的共识和争议

**内容**:
1. 提取 5 个专家共识
2. 探讨 3 个专家分歧
3. 选择立场并说明理由

**产出**:
- 共识理解笔记
- 分歧立场选择

**完成检查**:
- [ ] 能用自己的话复述共识点
- [ ] 立场选择有明确理由

---

### TODO-4: MVP 实战 - 实现天气查询 Agent（🔴）

**目标**: 用代码实现一个可运行的简单 Agent

**内容**:
1. 实现天气查询 Agent
2. 展示完整循环
3. 包含错误处理

**产出**:
- 可运行代码
- 运行截图

**完成检查**:
- [ ] 代码能正确运行
- [ ] 展示了完整的感知-思考-行动流程
- [ ] 有基本的错误处理

---

### TODO-5: 深度测试与对抗（🔴）

**目标**: 通过对抗测试暴露理解盲区

**内容**:
1. 5 道深度测试题
2. 3 个反事实情境
3. 苏格拉底诘问

**产出**:
- 测试题答案
- 反事实分析
- 诘问思考记录

**完成检查**:
- [ ] 5 道测试题回答正确
- [ ] 反事实分析考虑边界条件
- [ ] 诘问环节暴露了至少 1 个需要深究的点

## 程度分级详情

### 🔴 核心点（必须掌握）

| 知识点 | 为什么核心 | 不掌握的后果 |
|-------|-----------|-------------|
| Agent 三要素 | 定义 Agent 的充要条件 | 无法判断系统是否是 Agent |
| 感知-思考-行动循环 | 所有 Agent 的基础架构 | 无法设计或分析 Agent 系统 |
| 工具调用必要性 | 区分 Agent 和纯推理系统 | 会设计出"思考但不行动"的伪 Agent |
| 环境反馈作用 | Agent 适应和学习的根本原因 | 无法理解 Agent 的进化能力 |

### 🟠 重点（重要参考）

| 知识点 | 应用场景 | 快速查阅方式 |
|-------|---------|-------------|
| System Prompt vs Fine-tuning 争论 | 设计 Agent 行为时的架构选择 | 本课 TODO-3 笔记 |
| Agent 评估特殊性 | 设计评估方案时 | TODO-3 讨论 |

### 🟡 了解（开阔视野）

| 知识点 | 关联内容 | 延伸阅读 |
|-------|---------|---------|
| Agent 概念历史演变 | 理解为什么是现在这种形态 | 《人工智能：现代方法》|

## 学习资源

### 必读
- The Rise and Potential of Large Language Model Based Agents: A Survey

### 代码参考
- LangChain 官方示例：basic_agent.py

## 对抗测试题库（详细）

### 题目 1: 边界条件 - 实时性
**场景**: 天气查询 Agent 有时响应慢
**考点**: 异步设计 vs 同步设计
**脆弱点**: 边界条件误解

### 题目 2: 概念边界 - 自动化程度
**场景**: 每天自动查天气发邮件的系统
**考点**: 区分自动化脚本和 Agent
**脆弱点**: 概念混淆

### 题目 3: 迁移挑战 - 不同环境
**场景**: 命令行 Agent 集成到 Web 服务
**考点**: 架构层 vs 实现层分离
**脆弱点**: 架构理解不足
```

---

## Skill 与课程内容的交互

### Skill 读取课程内容

```python
# Skill 内部逻辑
1. 检测当前目录是否有 syllabus.yaml
2. 如果没有：提示用户创建或进入示例模式
3. 如果有：
   - 读取 syllabus.yaml
   - 解析课程大纲
   - 读取 learning-state.json（或初始化）
   - 根据当前状态决定下一步
```

### Skill 执行教学

```
用户："开始学习"
  ↓
Skill 读取 syllabus.yaml 和 learning-state.json
  ↓
确定 current_lesson = L0
  ↓
读取 lessons/l0-agent-essence.md
  ↓
执行方法1（心智模型建构）
  ↓
执行方法2（结构化学习）- TODO-1
  ↓
执行方法3（对抗测试）
  ↓
更新 learning-state.json
  ↓
继续下一 TODO 或结束
```

---

## 使用方法

### 1. 安装 Skill（全局）

```bash
# 复制到全局 skills 目录
cp -r skills/progressive-learning-coach ~/.config/agents/skills/
```

### 2. 创建学习项目

```bash
mkdir my-learning-project
cd my-learning-project
```

### 3. 创建 syllabus.yaml 和课程内容

```bash
# 创建大纲
cat > syllabus.yaml << 'EOF'
meta:
  domain: "your-topic"
  total_lessons: 3

syllabus:
  - id: "L0"
    title: "基础概念"
    file: "lessons/l0-basics.md"
    prerequisites: []
EOF

# 创建课程
mkdir lessons
cat > lessons/l0-basics.md << 'EOF'
# Lesson L0: 基础概念

## 学习目标
- 🔴 核心概念1
- 🟡 了解概念2

## TODO 清单
### TODO-1: ...
EOF
```

### 4. 开始学习

```
用户：开始学习

Skill：检测到 syllabus.yaml，开始引导学习...
```

---

## 迁移路径

从旧架构迁移到新架构：

1. **保留**：`docs/prompts/` 中的方法1/2/3 Prompt 模板
2. **重构**：创建 `progressive-learning-coach/SKILL.md`
3. **迁移**：将 `docs/syllabus/` 转换为项目根目录的格式
4. **更新**：`syllabus.yaml` 引用对应的 lesson 文件
