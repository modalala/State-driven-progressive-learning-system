# 课程过渡流程

课程过渡是指在完成当前课程后、启动下一课程前的衔接流程。

## 流程概述

```
当前课程完成
    ↓
Step 1: 课程结束总结
    ↓
Step 2: 快速复习文档生成（REVIEW.md）
    ↓
Step 3: 新课程启动引导
    ↓
用户确认开始下一课
    ↓
新课程心智模型构建
```

---

## Step 1: 课程结束总结

当课程状态变为 `completed` 时，生成课程总结报告。

### 输出模板

```markdown
## 🎉 Lesson {{lesson_id}} 完成总结

### 核心知识点清单

| 概念 | 定义 | 你的理解层级 | 专家视角（L2） |
|------|------|--------------|----------------|
| {{concept_1}} | {{definition}} | L{{user_level}} | {{l2_definition}} |
| {{concept_2}} | {{definition}} | L{{user_level}} | {{l2_definition}} |

### 需要纠正的点

{{#if fragility_points}}
| 脆弱点 | 发现来源 | 纠正建议 |
|--------|----------|----------|
| {{fragility_1}} | {{source}} | {{correction}} |
{{else}}
本次课程未发现需要纠正的脆弱点。
{{/if}}

### 心智模型评估汇总

| 问题 | 你的最终理解层级 | 达到 L2 的差距 |
|------|------------------|----------------|
| {{question_1}} | L{{level}} | {{gap_summary}} |
| {{question_2}} | L{{level}} | {{gap_summary}} |

**整体评估**: {{overall_level}} 层级

{{#if overall_level < 2}}
**建议**: 复习时重点关注 {{missing_principle}} 等设计原则。
{{/if}}

### 快速复习要点（必背）

1. {{key_point_1}}
2. {{key_point_2}}
3. {{key_point_3}}

### 复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| {{review_1_date}} | {{review_1_content}} | ⬜ |
| {{review_2_date}} | {{review_2_content}} | ⬜ |
```

### 数据来源

| 数据 | 来源文件 |
|------|----------|
| 核心知识点 | `context/{lesson}/README.md` 核心概念网络 |
| 理解层级 | 心智模型评估记录 |
| 脆弱点 | `learning-state.json` fragility_points |
| 复习计划 | `context/{lesson}/context-meta.yaml` review_schedule |

---

## Step 2: 快速复习文档生成

在课程结束时自动生成/更新 `context/{lesson}/REVIEW.md`。

### REVIEW.md 结构

```markdown
# {{lesson_id}}: {{lesson_title}} - 快速复习

> **格言**: "{{motto}}"

---

## 核心代码（必背）

{{core_code_snippet}}

---

## 关键概念速记

| 概念 | 一句话定义 | 记忆口诀 |
|------|-----------|----------|
| {{concept}} | {{one_liner}} | "{{mnemonic}}" |

---

## 核心原则（面试必答）

{{#each principles}}
### {{index}}. {{principle_name}}

{{principle_definition}}

{{/each}}

---

## 常见陷阱

| 陷阱 | 错误理解 | 正确理解 |
|------|----------|----------|
| {{trap}} | {{wrong}} | {{correct}} |

---

## 与其他课程的关系

{{relationship_diagram}}

---

## 自测问题

{{#each questions}}
{{index}}. **{{question}}**
   <details>
   <summary>点击查看答案</summary>
   {{l2_answer}}
   </details>

{{/each}}
```

---

## Step 3: 新课程启动引导

在用户说"下一课"或确认进入新课程时，提供预习引导。

### 引导目标

1. **建立连接**：新课程与已完成课程的关系
2. **启发思考**：提供核心问题让用户有思路
3. **降低门槛**：不让用户"裸奔"进入心智模型构建

### 输出模板

```markdown
## 📖 启动 Lesson {{next_lesson_id}}: {{next_title}}

### 与上一课的连接

```
{{prev_lesson_id}} ({{prev_title}})
    │
    │ {{connection_description}}
    │
    ▼
{{next_lesson_id}} ({{next_title}})
```

**核心关系**: {{relationship_summary}}

例如：上一课学习了 Agent Loop，这一课在其上叠加 {{new_mechanism}}。

---

### 启发式预习

**格言**: "{{next_motto}}"

**核心问题预览**（心智模型构建会深入探讨）：

> **Q1**: {{preview_question_1}}
>
> 💡 **思考方向**: {{thinking_hint_1}}

> **Q2**: {{preview_question_2}}
>
> 💡 **思考方向**: {{thinking_hint_2}}

---

### 关键概念预告

| 概念 | 简要说明 | 为什么重要 |
|------|----------|------------|
| {{concept_1}} | {{brief}} | {{importance}} |
| {{concept_2}} | {{brief}} | {{importance}} |

---

### 学习建议

1. {{suggestion_1}}
2. {{suggestion_2}}

---

输入"开始"进入 {{next_lesson_id}} 心智模型构建环节。
```

### 问题来源

| 数据 | 来源 |
|------|------|
| 连接关系 | syllabus.yaml prerequisites + core_points |
| 格言 | syllabus.yaml 或 lessons 文件 |
| 预习问题 | 根据新课程核心点生成启发式问题 |
| 思考方向 | 专家视角简化版（不暴露完整答案） |

---

## 启发式问题生成规则

### 规则1：不暴露答案

预习问题只给出思考方向，不给完整答案。

```
正确示例：
> Q: 为什么需要 {{mechanism}}？
> 💡 思考方向: 考虑上一课的 {{prev_concept}} 在什么情况下会遇到问题。

错误示例：
> Q: 为什么需要 {{mechanism}}？
> 💡 答案: 因为 {{prev_concept}} 存在 {{limitation}}，{{mechanism}} 可以解决。
```

### 规则2：建立关联

预习问题必须与上一课建立关联，帮助用户迁移理解。

```
正确示例：
> Q: {{new_concept}} 如何扩展上一课的 {{prev_concept}}？
> 💡 思考方向: 想想 {{prev_concept}} 的循环结构，{{new_concept}} 在哪里叠加？

错误示例：
> Q: 什么是 {{new_concept}}？
> 💡 思考方向: 这是一个新的机制。
```

### 规则3：聚焦核心

预习问题聚焦新课程的 2-3 个核心点，不超过 3 个问题。

---

## 与其他流程的衔接

### 课程完成后

```
课程完成检测
    ↓
生成结束总结（Step 1）
    ↓
生成 REVIEW.md（Step 2）
    ↓
更新 learning-state.json
    ↓
等待用户说"下一课"
    ↓
启动引导（Step 3）
```

### 用户跳过引导

如果用户直接说"开始下一课"而不想看引导：
- 跳过 Step 3，直接进入新课程
- 但仍保留结束总结和 REVIEW.md

### 用户要求回顾

如果用户在新课程进行中想回顾上一课：
- 引用 context/{prev_lesson}/REVIEW.md
- 不重新生成，只展示已有内容

---

## 示例：L02 → L03 过渡

### L02 结束总结

```markdown
## 🎉 Lesson L02: Tool Use 完成总结

### 核心知识点清单

| 概念 | 定义 | 你的理解层级 | 专家视角（L2） |
|------|------|--------------|----------------|
| Dispatch Map | {name: handler} 字典分发 | L1 | 开闭原则：对扩展开放，对修改封闭 |
| safe_path | 路径沙箱防逃逸 | L1 | 信任边界原则：LLM 可犯错，Harness 拦截 |
| Tool Schema | name + description + input_schema | L1 | 工具描述决定调用时机 |

### 需要纠正的点

| 脆弱点 | 发现来源 | 纠正建议 |
|--------|----------|----------|
| "LLM 判断安全"误区 | Q3 回答 | 安全检查必须是 Harness 层做的，不能信任 LLM |

### 心智模型评估汇总

| 问题 | 你的最终理解层级 | 达到 L2 的差距 |
|------|------------------|----------------|
| 为什么加工具不改循环？ | L1 | 未提炼开闭原则 |
| 专用工具 vs bash？ | L1 | 未提减少攻击面原则 |
| safe_path 作用？ | L1 | 未提信任边界原则 |

**整体评估**: L1 层级

**建议**: 复习时重点关注开闭原则、信任边界原则等设计原则。

### 快速复习要点（必背）

1. 加工具 = 加 handler + 加 schema，循环代码零改动
2. safe_path 通过 resolve() 解析符号链接，is_relative_to 判断是否在工作区
3. Harness 不信任 LLM 的安全判断，安全护栏由 Harness 层实现

### 复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| 2026-04-06 | dispatch map + 开闭原则 | ⬜ |
| 2026-04-12 | 安全检查机制 | ⬜ |
```

### L03 启动引导

```markdown
## 📖 启动 Lesson L03: TodoWrite

### 与上一课的连接

```
L02 (Tool Use)
    │
    │ 循环已能执行多种工具
    │ 但多步任务会丢失进度
    │
    ▼
L03 (TodoWrite)
```

**核心关系**: L02 解决了"怎么执行工具"，L03 解决"怎么跟踪进度"。

---

### 启发式预习

**格言**: "没有计划的 agent 走哪算哪"

**核心问题预览**：

> **Q1**: 为什么多步任务中模型会丢失进度？
>
> 💡 **思考方向**: 想想 tool_result 不断填满上下文会发生什么。

> **Q2**: 为什么限制"同时只能有一个 in_progress"？
>
> 💡 **思考方向**: Agent 是单线程推理还是并行执行？

---

### 关键概念预告

| 概念 | 简要说明 | 为什么重要 |
|------|----------|------------|
| TodoManager | 带状态的任务列表 | 让模型能追踪自己的进度 |
| nag reminder | 3轮不更新就提醒 | 软性约束，制造问责压力 |

---

### 学习建议

1. 对比 L02 的 dispatch map 和 L03 的 TodoManager——都是"注册 + 状态管理"
2. 思考"软性约束"和"硬性限制"的区别

---

输入"开始"进入 L03 心智模型构建环节。
```