# Context 生成实现指南

本文档包含开发者实现细节，AI执行时**不需要**读取此文档。

---

## 1. Context 的三大目标

Context 的设计围绕三个核心目标展开：

### 1.1 心智模型构建

**目标**：帮助学生建立领域专家的思维框架。

| 维度 | 说明 | 实现方式 |
|------|------|----------|
| 概念网络 | 构建概念之间的关联关系 | 通过核心概念定义和依赖映射 |
| 专家视角 | 理解领域专家如何看待问题 | 展示专家共识与分歧点 |
| 思维模式 | 掌握专家解决问题的思路 | 深度测试问题引导思考 |
| 迁移能力 | 将知识应用到新情境 | 跨领域类比和变体练习 |

### 1.2 结构化流程管理

**目标**：通过标准化流程确保学习的完整性。

| 方法 | 阶段 | 说明 |
|------|------|------|
| SQ3R | Survey → Question → Read → Recite → Review | 系统化阅读理解流程 |
| 项目式学习 | 定义 → 规划 → 执行 → 交付 | 实践驱动学习 |
| KISS 复盘 | Keep → Improve → Start → Stop | 持续改进反思 |

### 1.3 对抗性压力测试

**目标**：暴露认知盲区，验证理解深度。

| 测试类型 | 目的 | 实现方式 |
|----------|------|----------|
| 脆弱点测试 | 识别理解薄弱环节 | 历史错误回顾 + 预测性诊断 |
| 反事实推理 | 验证因果理解 | "如果...会怎样"情境 |
| 漏洞注入 | 测试边界条件 | 刻意引入错误检测 |
| 矛盾检测 | 发现认知冲突 | 对立观点对比分析 |

---

## 2. 内容来源映射

### 2.1 数据源映射表

| Context 内容 | 主要数据来源 | 次要数据来源 | 更新频率 |
|-------------|-------------|-------------|----------|
| 核心概念 | `syllabus.core_points` | `lessons/*.md` | 阶段性 |
| 概念定义 | `lessons/*.md` | `syllabus.definitions` | 阶段性 |
| 专家共识/分歧 | `lessons/*.md` | 外部参考资源 | 阶段性 |
| 学习进度 | `.learning/learning-state.json` | `.learning/memory-store.json` | 实时 |
| SQ3R 状态 | `.learning/learning-state.json` | - | 实时 |
| 项目成果 | `.learning/artifacts/` | `.learning/memory-store.json` | 项目完成时 |
| 脆弱点 | `.learning/memory-store.json` | 历史交互记录 | 每次交互 |
| KISS 复盘 | `.learning/memory-store.json` | `.learning/artifacts/` | 每周 |
| 深度测试问题 | `syllabus.deep_questions` | `lessons/*.md` | 阶段性 |

### 2.2 数据获取优先级

```
优先级：实时数据 > 缓存数据 > 默认值

实时数据源：
- .learning/learning-state.json
- .learning/memory-store.json

缓存数据源：
- syllabus（阶段更新）
- lessons（阶段更新）

默认值：
- 模板默认内容
- 通用指导原则
```

---

## 3. Mermaid 生成实现细节

以下内容供开发者参考，AI不需要执行这些代码。

### 3.1 流程图生成逻辑

#### 步骤识别模式表

| 模式类型 | 正则表达式 | 匹配示例 |
|----------|-----------|----------|
| 数字列表 | `^\d+\.\s+(.+)$` | `1. 第一步操作` |
| Step 标记 | `^Step\s*(\d+)[:：]\s*(.+)$` | `Step 1: 初始化配置` |
| 中文步骤 | `^步骤\s*(\d+)[:：]\s*(.+)$` | `步骤1：准备环境` |
| 阶段标题 | `^##\s+阶段\s*(\d+)[:：]?\s*(.+)$` | `## 阶段1：需求分析` |
| 流程动词 | `^[-*]\s+(创建|配置|执行|验证|部署|测试).+$` | `- 创建配置文件` |

#### 节点类型判断（Python参考）

```python
def determine_node_type(content: str) -> str:
    """根据内容判断节点类型"""

    # 决策节点：包含条件判断
    if any(kw in content for kw in ['?', '是否', '如果', '若', '判断', '检查']):
        return 'decision'  # {{ }} 菱形

    # 数据库节点：数据存储相关
    if any(kw in content for kw in ['存储', '保存', '数据库', '记录', '写入']):
        return 'database'  # [( )] 圆柱

    # 起点/终点
    if any(kw in content for kw in ['开始', 'Start', '结束', 'End', '完成']):
        return 'terminal'  # (( )) 圆形

    # 默认：矩形节点
    return 'process'  # [ ] 矩形
```

#### Mermaid 节点语法映射

| 节点类型 | Mermaid 语法 | 示例 |
|----------|-------------|------|
| process | `A[描述]` | `A[执行操作]` |
| decision | `B{条件?}` | `B{是否通过?}` |
| database | `C[(存储)]` | `C[(数据库)]` |
| terminal | `D((开始))` | `D((开始))` |

### 3.2 思维导图生成逻辑

#### 从 syllabus.core_points 构建根节点

```python
def build_mindmap_from_syllabus(syllabus: dict) -> str:
    """从 syllabus 构建思维导图"""

    mermaid_code = ["mindmap"]

    # 根节点：使用学习主题或核心能力
    root = syllabus.get('title', '核心能力')
    mermaid_code.append(f"    root(({root}))")

    # 遍历 core_points 构建分支
    for cp in syllabus.get('core_points', []):
        name = cp.get('name', '未命名')
        mermaid_code.append(f"        {name}")

        # 添加子节点
        for sub in cp.get('sub_points', []):
            mermaid_code.append(f"            {sub['name']}")

    return "\n".join(mermaid_code)
```

#### 层级映射规则

| syllabus 字段 | 思维导图层级 | 示例 |
|--------------|-------------|------|
| `title` | root (根节点) | `root((核心能力))` |
| `core_points[].name` | 一级分支 | `概念A` |
| `core_points[].sub_points[].name` | 二级分支 | `子概念A1` |
| `core_points[].details[]` | 三级分支 | `具体知识点` |

#### 层级深度控制

```python
MAX_DEPTH = 4  # 最大层级深度

def prune_to_depth(node: dict, current_depth: int = 0) -> dict:
    """修剪过深的层级"""

    if current_depth >= MAX_DEPTH:
        if node.get('children'):
            node['collapsed'] = '... (更多内容已折叠)'
            del node['children']
        return node

    if 'children' in node:
        node['children'] = [
            prune_to_depth(child, current_depth + 1)
            for child in node['children']
        ]

    return node
```

| 层级深度 | 推荐场景 | 控制方法 |
|---------|---------|---------|
| 1-2 层 | 概览图、导航 | 只显示主干分支 |
| 3-4 层 | 详细概念图 | 保留主要内容 |
| 5+ 层 | 完整知识图谱 | 折叠次要内容 |

### 3.3 内容提取规则

#### 流程步骤的识别模式

| 模式名称 | 正则表达式 | 优先级 | 说明 |
|---------|-----------|-------|------|
| 显式步骤 | `(?i)^step\s*(\d+)[:：]\s*(.+)$` | 1 | 最高优先级 |
| 中文步骤 | `^步骤\s*(\d+)[:：]\s*(.+)$` | 1 | 与显式步骤同级 |
| 数字列表 | `^(\d+)\.\s+(.+)$` | 2 | 普通有序列表 |
| 阶段标记 | `^阶段\s*(\d+)[:：]?\s*(.+)$` | 2 | 阶段划分 |
| 流程动词 | `^[-*]\s+(执行|创建|配置|验证|部署|测试|编写|设计)\s*(.+)$` | 3 | 动词开头 |
| 隐式顺序 | `^(首先|然后|接着|最后|最终)[，,：:\s]+(.+)$` | 4 | 顺序词引导 |

#### 概念层级的识别模式

**标题层级解析（Python参考）**

```python
def parse_heading_hierarchy(content: str) -> dict:
    """解析标题层级结构"""

    hierarchy = {'root': None, 'levels': {}}
    lines = content.split('\n')

    heading_pattern = r'^(#{1,6})\s+(.+)$'

    for line in lines:
        match = re.match(heading_pattern, line)
        if match:
            level = len(match.group(1))
            title = match.group(2).strip()

            if level == 1:
                hierarchy['root'] = title
                hierarchy['levels'][1] = [{'title': title, 'children': []}]
            else:
                if level not in hierarchy['levels']:
                    hierarchy['levels'][level] = []

                node = {'title': title, 'children': []}
                hierarchy['levels'][level].append(node)

                if level - 1 in hierarchy['levels'] and hierarchy['levels'][level - 1]:
                    parent = hierarchy['levels'][level - 1][-1]
                    parent['children'].append(node)

    return hierarchy
```

---

## 4. context-meta.yaml 完整结构

### 4.1 完整定义

```yaml
# context-meta.yaml - Context 元数据文件

version: "1.0"
generated_at: "2024-01-15T10:30:00"
phase: "L0"

# 数据版本追踪
data_versions:
  learning_state: "v1.2"
  memory_store: "v1.5"
  syllabus: "v2.0"

# 内容哈希（用于检测变化）
content_hashes:
  summary: "sha256:abc123..."
  flowchart: "sha256:def456..."
  mindmap: "sha256:ghi789..."

# 增量更新配置
incremental_update:
  enabled: true
  strategy: "merge"  # merge | replace | append

  # 合并规则
  merge_rules:
    fragile_points: "append_new"
    progress: "replace"
    concepts: "merge_by_id"

# 变更日志
changelog:
  - timestamp: "2024-01-15T10:30:00"
    changes:
      - type: "update"
        field: "progress.L0.mastery.cp-001"
        old_value: 0.6
        new_value: 0.8
      - type: "add"
        field: "fragile_points"
        value: "fp-003"

# 学习状态快照
state_snapshot:
  current_phase: "L0"
  overall_progress: 0.45

  sq3r_status:
    survey: "completed"
    question: "in_progress"
    read: "not_started"
    recite: "not_started"
    review: "not_started"

  mastery_levels:
    cp-001: 0.8
    cp-002: 0.6
    cp-003: 0.4

  active_project: "project-001"

# 脆弱点追踪
fragile_points:
  - id: "fp-001"
    concept_id: "cp-002"
    severity: "medium"
    last_tested: "2024-01-15"
    test_count: 3
    pass_rate: 0.67

  - id: "fp-002"
    concept_id: "cp-003"
    severity: "high"
    last_tested: "2024-01-14"
    test_count: 5
    pass_rate: 0.4

# KISS 复盘摘要
kiss_summary:
  last_review: "2024-01-14"
  next_review: "2024-01-21"
  keep:
    - "每日固定时间学习"
    - "使用思维导图整理笔记"
  improve:
    - "增加实践练习频率"
  start:
    - "建立错题本"
  stop:
    - "跳过复习环节"

# 生成策略配置
generation_config:
  include_sections:
    - "mental_model"
    - "structured_learning"
    - "adversarial_test"

  template_variant: "full"  # full | quick | minimal

  mermaid_output:
    enabled: true
    format: "markdown"
    theme: "default"

  localization:
    language: "zh-CN"
    timezone: "Asia/Shanghai"
```

### 4.2 字段说明

#### 版本和元信息

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | string | 元数据格式版本 |
| `generated_at` | datetime | 生成时间戳 |
| `phase` | string | 当前学习阶段 |

#### 数据版本追踪

| 字段 | 类型 | 说明 |
|------|------|------|
| `data_versions.learning_state` | string | learning-state.json 版本 |
| `data_versions.memory_store` | string | memory-store.json 版本 |
| `data_versions.syllabus` | string | syllabus 版本 |

#### 内容哈希

| 字段 | 类型 | 说明 |
|------|------|------|
| `content_hashes.summary` | string | README.md 内容哈希 |
| `content_hashes.flowchart` | string | 流程图内容哈希 |
| `content_hashes.mindmap` | string | 思维导图内容哈希 |

#### 增量更新配置

| 字段 | 类型 | 说明 |
|------|------|------|
| `incremental_update.enabled` | boolean | 是否启用增量更新 |
| `incremental_update.strategy` | enum | 更新策略：merge/replace/append |
| `incremental_update.merge_rules` | map | 各字段的合并规则 |

#### 变更日志

| 字段 | 类型 | 说明 |
|------|------|------|
| `changelog[].timestamp` | datetime | 变更时间 |
| `changelog[].changes[].type` | enum | 变更类型：update/add/delete |
| `changelog[].changes[].field` | string | 变更字段路径 |
| `changelog[].changes[].old_value` | any | 旧值 |
| `changelog[].changes[].new_value` | any | 新值 |

#### 状态快照

| 字段 | 类型 | 说明 |
|------|------|------|
| `state_snapshot.current_phase` | string | 当前阶段 |
| `state_snapshot.overall_progress` | float | 总体进度 (0-1) |
| `state_snapshot.sq3r_status` | map | SQ3R 各阶段状态 |
| `state_snapshot.mastery_levels` | map | 各概念掌握度 |
| `state_snapshot.active_project` | string | 当前项目 ID |

#### 脆弱点追踪

| 字段 | 类型 | 说明 |
|------|------|------|
| `fragile_points[].id` | string | 脆弱点 ID |
| `fragile_points[].concept_id` | string | 关联概念 ID |
| `fragile_points[].severity` | enum | 严重程度：low/medium/high |
| `fragile_points[].last_tested` | date | 最后测试日期 |
| `fragile_points[].test_count` | int | 测试次数 |
| `fragile_points[].pass_rate` | float | 通过率 (0-1) |

### 4.3 增量更新算法（Python参考）

```python
def update_context_meta(old_meta: dict, new_data: dict) -> dict:
    """
    增量更新 context-meta.yaml

    策略：
    1. 比较 content_hashes，确定需要更新的部分
    2. 根据 merge_rules 合并数据
    3. 追加 changelog
    4. 更新 generated_at 和 data_versions
    """

    # 1. 检测变化
    changes = detect_changes(old_meta, new_data)

    # 2. 应用合并规则
    for field, rule in old_meta['incremental_update']['merge_rules'].items():
        if field in changes:
            if rule == 'append_new':
                old_meta[field] = merge_append_new(
                    old_meta.get(field, []),
                    changes[field]
                )
            elif rule == 'replace':
                old_meta[field] = changes[field]
            elif rule == 'merge_by_id':
                old_meta[field] = merge_by_id(
                    old_meta.get(field, []),
                    changes[field]
                )

    # 3. 更新变更日志
    old_meta['changelog'].append({
        'timestamp': now(),
        'changes': changes
    })

    # 4. 更新元信息
    old_meta['generated_at'] = now()
    old_meta['content_hashes'] = compute_hashes(new_data)

    return old_meta
```

---

## 5. Context 目录结构

```
context/
├── L0/
│   ├── README.md                 # 阶段概览
│   ├── REVIEW.md                 # 快速复习（课程完成时）
│   ├── flowchart.mermaid.md      # 学习流程图
│   ├── mindmap.mermaid.md        # 概念思维导图
│   └── context-meta.yaml         # 元数据（增量更新）
├── L1/
│   ├── README.md
│   ├── flowchart.mermaid.md
│   ├── mindmap.mermaid.md
│   └── context-meta.yaml
├── L2/
│   └── ...
└── shared/
    ├── templates/                # 共享模板（可选）
    │   ├── summary-template.md
    │   └── quick-update-template.md
    └── assets/                  # 共享资源（可选）
        └── styles/
            └── mermaid-themes.json
```

| 文件 | 职责 | 更新时机 |
|------|------|----------|
| `README.md` | 阶段完整 Context 总结 | 每次阶段交互后 |
| `REVIEW.md` | 快速复习文档 | 课程完成时 |
| `flowchart.mermaid.md` | 学习流程可视化 | SQ3R 状态变化时 |
| `mindmap.mermaid.md` | 概念网络可视化 | 核心概念变化时 |
| `context-meta.yaml` | 增量更新元数据 | 每次交互后 |

---

## 附录：生成流程图

```
输入：用户交互请求或课程完成事件
  │
  ▼
读取学习状态 (learning-state.json)
  │
  ▼
读取记忆存储 (memory-store.json)
  │
  ▼
读取课程大纲 (syllabus.yaml)
  │
  ▼
读取课程内容 (lessons/*.md)
  │
  ▼
┌─────────────────────────────────┐
│      数据整合与处理             │
│  - 构建心智模型内容             │
│  - 整合结构化学习状态           │
│  - 生成对抗测试内容             │
└─────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│      内容渲染                   │
│  - 应用 Markdown 模板           │
│  - 生成 Mermaid 图表            │
│  - 嵌入数据来源                 │
└─────────────────────────────────┘
  │
  ▼
更新 context-meta.yaml
  │
  ▼
输出：完整 Context 内容
```

---

**注意**：本文档中的Python代码和正则表达式仅供开发者参考，AI执行Context生成时请参考 `EXECUTION.md` 和 `templates.md`。