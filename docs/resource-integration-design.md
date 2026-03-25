# 用户自带学习资源集成方案（设计草案）

## 背景

**当前问题**：
- Skill 只依赖预定义的 `lessons/*.md` 文件
- 用户自带的学习资源（代码库、文档、图片）无法被 Skill 利用
- 用户希望 Skill 能基于他们的实际资源生成个性化课程

**目标**：
- 允许用户提供外部学习资源
- Skill 在教学中引用这些资源
- 资源有不同权重和来源标注

---

## 方案 A：resources/ 目录 + 元数据文件

### 文件结构

```
my-learning-project/
├── syllabus.yaml
├── lessons/
│   └── l0-topic.md
├── resources/                    # 🆕 用户资源目录
│   ├── metadata.yaml             # 资源元数据索引
│   ├── code-snippets/
│   │   ├── agent-loop.py
│   │   └── react-pattern.js
│   ├── documents/
│   │   ├── paper-references.pdf
│   │   └── lecture-notes.md
│   └── images/
│       ├── architecture.png
│       └── flowchart.jpg
└── .learning/
```

### metadata.yaml 格式

```yaml
resources:
  - id: "res-001"
    type: "code"                    # code | document | image | video | link
    path: "resources/code-snippets/agent-loop.py"
    title: "基础 Agent 循环实现"
    description: "Python 实现的感知-思考-行动循环"
    tags: ["L0", "TODO-2", "代码示例"]
    relevance: 0.9                  # 相关度 0-1
    source: "user"                  # user | auto | external
    
  - id: "res-002"
    type: "document"
    path: "resources/documents/paper-references.pdf"
    title: "ReAct 论文"
    description: "ReAct: Synergizing Reasoning and Acting"
    tags: ["L1", "TODO-1", "必读"]
    relevance: 1.0
    source: "user"
    pages: [1, 5]                   # 可选：指定页码范围
    
  - id: "res-003"
    type: "image"
    path: "resources/images/architecture.png"
    title: "系统架构图"
    description: "项目整体架构设计"
    tags: ["L0", "TODO-2"]
    relevance: 0.8
    source: "user"
```

### Skill 如何使用资源

**在课程生成时**：
```python
def generate_lesson_with_resources(lesson_template, resources):
    """
    根据用户资源增强课程内容
    """
    # 1. 筛选相关资源
    relevant_resources = filter_by_tags(resources, lesson_template['id'])
    
    # 2. 按相关度排序
    sorted_resources = sorted(relevant_resources, key=lambda r: r['relevance'], reverse=True)
    
    # 3. 将资源引用插入到对应 TODO
    for todo in lesson_template['todos']:
        matching_resources = find_resources_for_todo(sorted_resources, todo['id'])
        todo['user_resources'] = matching_resources
    
    return lesson_template
```

**在教学时展示**：
```markdown
### TODO-2: 代码实现（🔴）

**目标**: 掌握 Agent 基础架构

**Skill 提供的资料**:
- 理论解释...
- 示例代码...

**你的资源**（自动关联）:
📎 [res-001] 基础 Agent 循环实现 (相关度: 90%)
   类型: Python 代码 | 来源: 用户上传
   
   预览:
   ```python
   def agent_loop():
       while True:
           perception = observe()
           ...
   ```
   
   💡 Skill 提示: 这段代码展示了核心的感知-思考-行动循环，
   注意看第 3 行的 observe() 是如何获取环境输入的。

**练习**: 参考你的代码 [res-001]，完成以下任务...
```

---

## 方案 B：syllabus.yaml 中直接引用

### 结构

```yaml
syllabus:
  - id: "L0"
    title: "Agent 本质论"
    resources:                        # 🆕 直接关联资源
      - path: "./my-code/agent.py"
        type: "code"
        used_in: "TODO-2"
        relevance: "high"             # high | medium | low
        
      - path: "./docs/arch.png"
        type: "image"
        used_in: "TODO-3"
        description: "系统架构图"
```

### 优缺点

- **优点**：简单直接，一目了然
- **缺点**：资源和课程耦合，不够灵活

---

## 方案 C：智能资源发现（AI 自动关联）

### 流程

```
用户上传资源到 resources/
    ↓
Skill 分析资源内容（使用 AI）
    ↓
自动提取关键概念
    ↓
匹配到课程 TODO
    ↓
生成资源摘要和建议
    ↓
在教学中引用
```

### 示例

```python
# 自动分析用户上传的代码
def analyze_code_resource(file_path):
    code_content = read_file(file_path)
    
    # AI 分析
    analysis = ai_analyze("""
    分析这段代码：
    1. 实现了什么功能？
    2. 涉及哪些核心概念？
    3. 与 Agent 架构的哪部分相关？
    """, code_content)
    
    # 返回分析结果
    return {
        'concepts': ['感知-思考-行动', '状态管理'],
        'related_lessons': ['L0', 'L1'],
        'related_todos': ['L0-TODO-2', 'L1-TODO-1'],
        'suggestion': '这段代码可以作为 L0 的实战参考'
    }
```

---

## 比较

| 维度 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 复杂度 | 中 | 低 | 高 |
| 灵活性 | 高 | 中 | 高 |
| 用户工作量 | 中（需写 metadata） | 低 | 低 |
| 智能程度 | 中 | 低 | 高 |
| 可维护性 | 中 | 高 | 低 |

**推荐**：方案 A（resources/ + metadata.yaml）

---

## 资源权重设计

### 权重策略：LLM 动态判断

**不预设固定权重规则**，由 LLM 根据以下因素动态判断资源的相关性和重要性：

**判断因素**：
1. **内容匹配度** - 资源内容与当前 TODO 目标的匹配程度
2. **类型适配性** - 资源类型是否适合当前学习场景
   - 理论学习 → document/video 优先
   - 实战练习 → code 优先
   - 概念理解 → image/diagram 优先
3. **来源可信度** - user > external > auto
4. **时效性** - 资源是否过时

**LLM 判断示例**：
```markdown
当前 TODO: "实现基础的 Agent 循环"

资源分析：
1. [res-001] agent-loop.py (user)
   - 内容：Python 实现的感知-思考-行动循环
   - 匹配度：95% - 直接对应 TODO 目标
   - 建议：高优先级引用，作为代码参考

2. [res-002] ReAct 论文.pdf (user)
   - 内容：ReAct 原理论文
   - 匹配度：70% - 理论背景，非直接实践
   - 建议：中等优先级，用于理解原理

3. [res-003] 某博客文章 (external)
   - 内容：Agent 介绍
   - 匹配度：40% - 内容较泛，且来源非权威
   - 建议：低优先级，可选阅读
```

### 元数据简化

移除 `relevance` 字段，由 LLM 实时计算：

```yaml
resources:
  - id: "res-001"
    type: "code"
    path: "resources/code-snippets/agent-loop.py"
    title: "基础 Agent 循环"
    description: "Python 实现的感知-思考-行动循环"
    tags: ["L0", "TODO-2"]
    source: "user"
    # relevance: 0.9  # ❌ 移除，由 LLM 判断
```

### 引用优先级

LLM 根据实时判断决定引用顺序：

1. **首选**：最匹配当前 TODO 的用户资源
2. **次选**：相关性较高的其他资源
3. **可选**：相关性一般的资源（标记为"延伸阅读"）
4. **忽略**：不相关或低质量资源（不展示）

---

## 在课程中的标注方式

### 资源引用标记

```markdown
### TODO-2: 代码实现（🔴）

**你的参考资料**：

📎 **代码** [agent-loop.py](resources/code-snippets/agent-loop.py) 
   <small>来源: 用户上传 | 权重: 95%</small>
   
   > 这段代码展示了基础的感知-思考-行动循环，
   > 注意看 `observe()` 函数如何获取环境输入。

📎 **论文** [ReAct: ...](resources/documents/react-paper.pdf)
   <small>来源: 用户上传 | 权重: 90% | 页码: 1-3</small>
   
   > 核心观点：显式思考提高了可追溯性

📎 **图表** [架构图](resources/images/arch.png)
   <small>来源: 用户上传 | 权重: 80%</small>

---
**Skill 建议的学习路径**：
1. 先看你的代码 [agent-loop.py] 了解实现
2. 阅读论文 [ReAct] 第 1-3 页理解原理
3. 对照你的架构图 [arch.png] 思考如何改进
4. 完成下面的练习

**练习**: 基于你的代码，添加错误处理机制...
```

---

## 待解决问题

### 1. 资源解析

- 如何解析不同类型的资源？
  - 代码：提取函数、类、注释
  - PDF：提取文本、图片
  - 图片：OCR 识别文字

### 2. 隐私和安全

- 用户资源是否敏感？
- 是否需要本地处理（不上传云端）？

### 3. 存储和同步

- 大文件如何处理？
- 是否需要版本控制？

### 4. 冲突处理

- 多个资源描述同一概念但有矛盾时怎么办？

---

## 下一步行动

1. **细化方案 A** 的设计
2. **确定资源解析策略**（本地 vs 云端）
3. **实现基础功能**：metadata.yaml 解析 + 资源引用
4. **迭代优化**：根据使用反馈调整
