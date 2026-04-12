# 课程内容格式规范

本文档定义 `syllabus.yaml` 和 `lessons/*.md` 的标准格式。

---

## syllabus.yaml 结构

课程大纲文件，定义课程序列和元数据。

### 基本结构

```yaml
meta:
  domain: "学习领域名称"
  total_lessons: 12
  estimated_total_hours: 35

learning_config:
  method_weights:
    mental_model: 0.2
    structured: 0.5
    adversarial: 0.3

syllabus:
  - id: "L0"
    title: "课程标题"
    file: "lessons/l0-topic.md"
    prerequisites: []
    core_points: ["核心点1", "核心点2"]
```

### 字段说明

| 字段 | 必需 | 说明 |
|------|------|------|
| `meta.domain` | 是 | 学习领域名称 |
| `meta.total_lessons` | 是 | 总课程数 |
| `meta.estimated_total_hours` | 否 | 预估总时长 |
| `learning_config` | 否 | 方法权重配置（默认 20%/50%/30%） |
| `syllabus[].id` | 是 | 课程标识（如 L0, L1, L2） |
| `syllabus[].title` | 是 | 课程标题 |
| `syllabus[].file` | 是 | 课程文件路径 |
| `syllabus[].prerequisites` | 否 | 前置课程 ID 列表 |
| `syllabus[].core_points` | 否 | 核心知识点列表 |

---

## lessons/*.md 结构

单个课程的内容文件。

### 基本结构

```markdown
# Lesson L0: 标题

## 学习目标

按优先级分类：

- 🔴 **核心**: 必须掌握的能力
- 🟠 **重点**: 重要参考知识
- 🟡 **了解**: 开阔视野内容

## TODO 清单

按顺序列出，渐进披露：

### TODO-1: 任务名（🔴）

**目标**: 完成目标描述

**指引**:
- 步骤提示（可选）

**完成检查**:
- [ ] 检查项1
- [ ] 检查项2

### TODO-2: 任务名（🟠）

...

## 对抗测试题库（可选）

### 题目 1: [类型] 题目描述

**预期回答**: ...

**脆弱点检测**: ...

## 补充材料（可选）

- 相关链接
- 扩展阅读
```

### 字段说明

| 部分 | 必需 | 说明 |
|------|------|------|
| 学习目标 | 是 | 用 🔴🟠🟡 标记优先级 |
| TODO 清单 | 是 | 至少 1 个 TODO |
| 对抗测试题库 | 否 | 推荐包含方法3测试题 |
| 补充材料 | 否 | 外部资源链接 |

### TODO 优先级标记

| 标记 | 含义 |
|------|------|
| 🔴 | 核心任务，必须完成 |
| 🟠 | 重要任务，推荐完成 |
| 🟡 | 扩展任务，可选完成 |

---

## 状态文件格式

### learning-state.json

```json
{
  "project_name": "项目名称",
  "current_lesson": "L1",
  "current_todo": 2,
  "lessons": {
    "L0": {
      "status": "completed",
      "completed_at": "2024-01-15",
      "todos_completed": [1, 2, 3],
      "vulnerabilities": [],
      "review_count": 0
    },
    "L1": {
      "status": "in_progress",
      "todos_completed": [1],
      "current_todo_status": "in_progress",
      "vulnerabilities": [
        {
          "id": "v1",
          "type": "边界条件误解",
          "description": "...",
          "status": "open"
        }
      ]
    }
  },
  "last_session": "2024-01-20"
}
```

### memory-store.json

```json
{
  "mental_models": {
    "concept_name": {
      "confidence": 0.8,
      "last_verified": "2024-01-15"
    }
  },
  "vulnerability_log": [...],
  "expert_positions": {
    "topic": {
      "position": "学生选择的立场",
      "reason": "理由"
    }
  }
}
```

详见: `memory-schema.md`