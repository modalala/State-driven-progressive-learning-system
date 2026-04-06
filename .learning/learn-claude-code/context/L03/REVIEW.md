# L03: TodoWrite - 快速复习

> **格言**：*"没有计划的 agent 走哪算哪"* -- 先列步骤再动手，完成率翻倍。

---

## 核心代码（必背）

```python
class TodoManager:
    def update(self, items: list) -> str:
        validated, in_progress_count = [], 0
        for item in items:
            status = item.get("status", "pending")
            if status == "in_progress":
                in_progress_count += 1  # 单线程约束检查
            validated.append(item)
        if in_progress_count > 1:
            raise ValueError("Only one task can be in_progress")  # 报错
        self.items = validated
        self.rounds_since_todo = 0  # 重置计数器
        return self.render()

# nag reminder: 3轮不更新就提醒
if rounds_since_todo >= 3:
    inject_reminder()

# 计数器累加
if not called_todo_this_round:
    rounds_since_todo += 1
```

---

## 关键概念速记

| 概念 | 一句话定义 | 记忆口诀 |
|------|-----------|----------|
| **TodoManager** | 带状态的任务列表 | "三态一焦点" |
| **单线程约束** | 同时只有一个 in_progress | "一心不可二用" |
| **nag_reminder** | 3轮不更新就提醒 | "三轮一催" |
| **内省工具** | 操作自身状态的工具 | "照镜子，不敲窗" |
| **软约束** | 提醒但不强制 | "软提醒，硬信任" |
| **范式转移** | 决策主体是模型 | "模型做主，代码辅助" |

---

## 核心原则（面试必答）

### 1. 单线程约束 = 认知设计

```
不是技术限制，是认知设计约束
技术上可以并行，但 todo 强制单一焦点
```

**原理**：LLM 一次响应可包含多个 tool_use，技术上并行执行没问题。但 todo 约束的是认知状态——强制模型保持"当前在做一件事"的心智模型。

### 2. nag = 软性提醒

```
nag 控制更新频率，不是 todo 数量
3轮不更新就提醒，但模型可选择忽略
```

**副作用**（如果每轮都注入）：
- 打断思考流程
- 上下文污染
- 模型产生"忽略习惯"

### 3. todo = 内省工具

```
todo 操作 Agent 自身状态
其他工具操作外部世界
todo 是 Agent 自我意识的雏形
```

---

## 常见陷阱

| 陷阱 | 错误理解 | 正确理解 |
|------|----------|----------|
| "单线程是技术限制" | 技术上不能并行 | 认知设计约束，技术上可并行 |
| "nag 会增加 todo 数量" | nag 控制 todo 数量 | nag 控制更新频率 |
| "todo 约束执行顺序" | 约束执行 | 约束认知状态 |
| "硬约束更好" | 100%执行就好 | 硬约束违反信任模型原则 |

---

## s02 vs s03 对比

| 组件 | s02 | s03 | 变化 |
|------|-----|-----|------|
| Tools | 4 | 5 | + todo |
| TodoManager | 无 | 有 | 新增 |
| nag reminder | 无 | 有（3轮后） | 新增 |
| 循环 | - | **不变** | 核心 |

---

## 与后续课程的关系

```
L03 (TodoWrite)
    │
    │ todo + nag + 单线程约束
    │
    ├─→ L04 Subagent     子任务继承 todo
    ├─→ L05 Skill Loading todo 追踪 skill 加载
    ├─→ L06 Context Compact todo 状态压缩保留
    ├─→ L07 Task System  todo 持久化 + DAG
    └─→ L09 Agent Teams  多 agent todo 协调
```

---

## 自测问题

1. **为什么 todo 是"内省工具"？**
   <details>
   <summary>点击查看答案</summary>
   todo 操作的是 Agent 自身状态（任务进度），不操作外部世界（文件、系统）。read/write/edit 操作外部世界，是"外向工具"。todo 是 Agent 自我意识的雏形。
   </details>

2. **为什么单线程约束是"认知设计"不是"技术限制"？**
   <details>
   <summary>点击查看答案</summary>
   技术上 LLM 一次响应可包含多个 tool_use，可以并行执行。但 todo 约束的是认知状态——强制模型保持单一焦点心智模型，避免注意力分散。这是设计选择，不是技术障碍。
   </details>

3. **nag reminder 如果每轮都注入有什么副作用？**
   <details>
   <summary>点击查看答案</summary>
   1. 打断思考流程——模型每轮被迫处理 nag
   2. 上下文污染——tool_result 充斥 `<reminder>` 标签
   3. 模型产生"忽略习惯"——过频提醒会失效（像闹钟一样）
   </details>

4. **软约束和硬约束的设计权衡是什么？**
   <details>
   <summary>点击查看答案</summary>
   软约束代价：极端场景下模型可能持续忽略
   软约束收益：保持模型自主性，符合信任模型原则
   硬约束代价：违反信任模型原则，Harness 替模型做决策
   硬约束收益：100%执行保证
   Agent 用软约束，因为决策主体是模型本身
   </details>

---

## 复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| 待定 | 软约束vs硬约束设计权衡 | ⬜ |
| 待定 | nag 副作用理解 | ⬜ |
| 待定 | 与 L04 Subagent 的关系 | ⬜ |