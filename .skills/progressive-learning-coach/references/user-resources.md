# 用户资源处理指南

## 概述

用户可以将自己的学习资源（代码、文档、图片等）放入 `resources/` 目录，Skill 会在教学中智能引用这些资源。

## 资源目录结构

```
my-learning-project/
├── syllabus.yaml
├── lessons/
├── resources/                    # 🆕 用户资源目录
│   ├── metadata.yaml             # 资源索引文件
│   ├── code-snippets/            # 代码片段
│   │   ├── my-agent.py
│   │   └── utils.js
│   ├── documents/                # 文档资料
│   │   ├── paper.pdf
│   │   └── notes.md
│   └── images/                   # 图片图表
│       ├── architecture.png
│       └── flowchart.jpg
└── .learning/
```

## metadata.yaml 格式

```yaml
resources:
  - id: "unique-id-001"           # 唯一标识符
    type: "code"                  # 资源类型
    path: "resources/code-snippets/my-agent.py"
    title: "我的 Agent 实现"
    description: "Python 实现的感知-思考-行动循环"
    tags: ["L0", "TODO-2"]       # 关联的课程和 TODO
    source: "user"                # user | external | auto
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识符，用于引用 |
| `type` | enum | ✅ | 资源类型：code / document / image / video / link |
| `path` | string | ✅ | 相对项目根目录的文件路径 |
| `title` | string | ✅ | 资源标题，展示给用户 |
| `description` | string | 可选 | 资源描述，帮助 LLM 理解 |
| `tags` | array | ✅ | 关联的课程 ID 和 TODO ID |
| `source` | enum | 可选 | 来源标记：user（默认）/ external / auto |

## 资源类型

### code - 代码文件

**支持的格式**：`.py`, `.js`, `.ts`, `.java`, `.cpp`, `.go`, `.rs`, 等

**示例**：
```yaml
- id: "agent-impl"
  type: "code"
  path: "resources/code-snippets/agent.py"
  title: "Agent 基础实现"
  description: "包含感知-思考-行动循环的 Python 实现"
  tags: ["L0", "TODO-2"]
```

**Skill 如何使用**：
- 读取代码内容
- 分析代码结构和关键函数
- 在教学中引用具体行号
- 对比标准实现和用户实现

### document - 文档资料

**支持的格式**：`.pdf`, `.md`, `.txt`, `.docx`

**示例**：
```yaml
- id: "react-paper"
  type: "document"
  path: "resources/documents/react-paper.pdf"
  title: "ReAct 论文"
  description: "ReAct: Synergizing Reasoning and Acting in LLMs"
  tags: ["L1", "TODO-1"]
  # pages: [1, 5]  # 可选：指定页码范围
```

**Skill 如何使用**：
- 提取文档文本内容
- 分析核心观点和论据
- 引用具体段落
- 指导学生阅读重点部分

### image - 图片图表

**支持的格式**：`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`

**示例**：
```yaml
- id: "arch-diagram"
  type: "image"
  path: "resources/images/architecture.png"
  title: "系统架构图"
  description: "展示模块间关系的架构设计图"
  tags: ["L0", "TODO-3"]
```

**Skill 如何使用**：
- 显示图片（如环境支持）
- 描述图片内容
- 引导学生分析图表
- 关联到概念解释

### video - 视频资源

**支持的格式**：本地视频文件或 YouTube/Bilibili 链接

**示例**：
```yaml
- id: "lecture-video"
  type: "video"
  path: "resources/videos/lecture.mp4"
  # 或在线链接
  # path: "https://youtube.com/watch?v=xxx"
  title: "课程视频"
  description: "详细讲解 Agent 架构的视频"
  tags: ["L0"]
```

### link - 外部链接

**示例**：
```yaml
- id: "ref-docs"
  type: "link"
  path: "https://langchain.com/docs"
  title: "LangChain 官方文档"
  description: "Agent 相关文档"
  tags: ["L0", "L1"]
```

## 标签系统（tags）

`tags` 用于将资源关联到课程和 TODO。

### 标签格式

```yaml
tags:
  - "L0"              # 关联整个 L0 课程
  - "L1"              # 关联整个 L1 课程
  - "TODO-2"          # 关联具体 TODO
  - "L0-TODO-2"       # 完整标识（推荐）
```

### 匹配规则

Skill 会根据当前课程和 TODO 匹配资源：

```python
# 当前在 Lesson L0, TODO-2
current_lesson = "L0"
current_todo = "TODO-2"

# 资源 A: tags = ["L0", "TODO-2"]
# → 匹配 ✅

# 资源 B: tags = ["L0"]
# → 匹配（课程级别）✅

# 资源 C: tags = ["L1", "TODO-1"]
# → 不匹配 ❌
```

## LLM 匹配分析

### 匹配度评分

Skill 使用 LLM 动态分析资源与当前学习任务的匹配度：

| 评分 | 级别 | 展示方式 |
|------|------|---------|
| 90-100% | 极高 | **优先展示**，核心参考 |
| 70-89% | 高 | **推荐阅读**，重要补充 |
| 50-69% | 中 | **延伸阅读**，可选参考 |
| <50% | 低 | **不展示**，避免干扰 |

### 分析维度

LLM 分析以下维度：

1. **内容匹配度**
   - 资源内容是否与 TODO 目标直接相关
   - 是否覆盖 TODO 要求的核心概念

2. **类型适配性**
   - 理论学习 → document / video 优先
   - 实战练习 → code 优先
   - 概念理解 → image / diagram 优先

3. **深度适配**
   - 初学者 TODO → 基础资源优先
   - 进阶 TODO → 复杂资源优先

4. **时效性**
   - 资源是否过时
   - 是否引用最新技术

### 分析示例

```markdown
当前 TODO: "实现基础的 Agent 循环"

资源分析：

📄 agent-loop.py (code)
├─ 内容：实现了感知-思考-行动循环
├─ 匹配度：95%
├─ 原因：直接对应 TODO 目标
└─ 建议：作为核心参考代码

📄 react-paper.pdf (document)
├─ 内容：ReAct 原理论文
├─ 匹配度：70%
├─ 原因：理论背景，非直接实践
└─ 建议：先完成代码，再阅读理论

📄 old-script.py (code)
├─ 内容：过时的实现方式
├─ 匹配度：40%
├─ 原因：使用了已废弃的 API
└─ 建议：不推荐参考
```

## 在教学中引用资源

### 引用格式

```markdown
📎 [res-id] 资源标题
   类型: {type} | 来源: {source} | 匹配度: {score}%
   
   💡 Skill 分析: 
   这段代码实现了核心的感知-思考-行动循环，
   特别是第 12 行的 observe() 函数，
   很好地展示了如何获取环境输入。
   
   📝 使用建议:
   1. 先通读你的代码，理解整体结构
   2. 对比下面的标准示例，看看差异
   3. 思考：如果要添加错误处理，你会在哪里添加？
   
   预览:
   ```python
   def agent_loop():
       while True:
           perception = observe()  # ← 关键：获取环境输入
           thought = llm_think(perception)
           action = parse_action(thought)
           ...
   ```
```

### 引用策略

1. **直接引用**
   ```
   "参考你的代码 [res-001]，我们来看看..."
   ```

2. **对比分析**
   ```
   "标准实现使用 X 方法，而你的代码 [res-001] 使用了 Y 方法。
   两者的区别是..."
   ```

3. **问题发现**
   ```
   "在你的代码 [res-001] 第 15 行，有一个潜在问题...
   建议改为..."
   ```

4. **扩展建议**
   ```
   "基于你的代码，可以尝试添加以下功能：
   1. 错误处理机制
   2. 日志记录
   3. 性能优化"
   ```

## 完整示例

### 项目配置

```yaml
# syllabus.yaml
syllabus:
  - id: "L0"
    title: "Agent 基础"
    todos_count: 3
```

```yaml
# resources/metadata.yaml
resources:
  - id: "my-agent"
    type: "code"
    path: "resources/code-snippets/my_agent.py"
    title: "我的 Agent 实现"
    description: "简单的 Agent 循环实现"
    tags: ["L0", "TODO-2"]
    source: "user"
```

### 教学对话

```markdown
学生：开始学习

Skill：
📚 检测到学习项目：Agent 基础
检测到 1 个用户资源

📍 当前任务：TODO-2 代码实现

**Skill 提供的资料**：
- 理论：Agent 循环的原理...
- 标准示例：...

**你的资源**（自动关联）：
📎 [my-agent] 我的 Agent 实现
   类型: Python 代码 | 来源: 用户上传 | 匹配度: 95%
   
   💡 Skill 分析:
   这段代码很好地实现了基础的感知-思考-行动循环。
   特别注意到你使用了 while True 来实现持续运行，
   这是一个清晰的实现方式。
   
   📝 使用建议:
   1. 先看你的代码，理解当前实现
   2. 对比标准示例，找出可以改进的地方
   3. 完成下面的练习

**练习**：
基于你的代码 [my-agent]，添加错误处理机制...
```

## 最佳实践

### 对用户

1. **清晰命名**：给资源起描述性的标题
2. **准确描述**：description 帮助 LLM 理解资源
3. **正确标签**：确保 tags 关联到正确的课程/TODO
4. **适度数量**：每课 2-5 个资源为宜，避免过多干扰

### 对 Skill

1. **尊重原创**：用户资源优先级高于标准示例
2. **具体引用**：引用代码时指明行号或函数名
3. **建设性反馈**：分析用户资源时给出改进建议
4. **隐私保护**：不将用户资源内容外传

## 故障排除

### 资源没有被引用

- 检查 `tags` 是否包含当前课程/TODO
- 检查 `path` 是否正确
- 检查资源类型是否支持

### 匹配度太低

- 完善 `description` 字段
- 调整 `tags` 关联
- 检查资源内容是否与 TODO 相关

### 资源解析失败

- 确保文件格式正确
- 检查文件编码（推荐 UTF-8）
- 确保文件路径正确
