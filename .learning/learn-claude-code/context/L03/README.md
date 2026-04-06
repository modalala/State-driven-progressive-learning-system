# L03: TodoWrite - Context 总结

> **格言**：*"没有计划的 agent 走哪算哪"* -- 先列步骤再动手，完成率翻倍。
>
> **Harness 层**：规划 —— 让模型不偏航，但不替它画航线。

---

## 一、心智模型构建

### 1.1 核心概念网络

| 概念 | 定义 | 依赖关系 | 熟练度 |
|------|------|----------|--------|
| **TodoManager** | 带状态的任务列表管理器 | → L02 Dispatch Map | L2 |
| **单线程约束** | 同时只能有一个 in_progress | → 认知设计约束 | L2 |
| **nag_reminder** | 3轮不更新todo就提醒 | → 软性问责 | L2 |
| **内省工具** | 操作Agent自身状态的工具 | → todo本质 | L2 |
| **软约束vs硬约束** | 软约束=提醒，硬约束=强制 | → 信任模型原则 | L2 |
| **范式转移** | Agent决策主体是模型，不是代码 | → 传统系统对比 | L2 |

**概念依赖图**：
```
L02 (Tool Use)
    │
    │ dispatch map
    │
    ▼
TodoManager ─────────────────────────────────┐
    │                                         │
    │ + todo handler                          │
    │                                         │
    ├─→ 单线程约束 ──→ 认知设计约束            │
    │                                         │
    ├─→ nag_reminder ──→ 软性问责             │
    │                                         │
    └─→ 内省工具 ──→ 操作自身状态              │
                                                │
    软约束 vs 硬约束 ←─────────────────────────┘
    │
    │
    ▼
范式转移：决策主体 = 模型（神经网络），不是代码（if-else）
```

### 1.2 专家视角

#### 专家共识

1. **todo 是内省工具**：不改变外部世界，只改变 Agent 对自己的认知
2. **单线程约束是认知设计**：强制模型保持单一焦点，不是技术限制
3. **nag 是软性提醒**：3轮不更新就提醒，但模型可以选择忽略
4. **todo 是共享认知界面**：模型和人类都能看懂追踪进度
5. **todo 约束认知状态**：不是约束执行顺序，模型可以"暗中并行"

#### 专家分歧

| 分歧点 | 观点A | 观点B | 学习者理解 |
|--------|-------|-------|------------|
| **nag 性质** | 软性提醒，模型可忽略 | 隐式指令，制造问责压力 | 软性提醒 |
| **单线程约束本质** | 认知设计约束 | 事后合理化，实际是技术限制 | 认知设计约束 |

### 1.3 深度测试问题

> **Q1**: 为什么 todo 是"内省工具"？
>
> **思考引导**：
> - 角度1：todo 操作的是什么？
> - 角度2：read_file 操作的是什么？
>
> **预期理解层级**：
> - L0（表面）："记录任务的工具"
> - L1（关联）："操作 Agent 自身状态，不是外部世界"
> - L2（深层）："Agent 自我意识的雏形——感知、思考、追踪自己"

> **Q2**: 为什么单线程约束是"认知设计"不是"技术限制"？
>
> **思考引导**：
> - 角度1：技术上能否并行执行？
> - 角度2：LLM 一次响应能包含多个 tool_use 吗？
>
> **预期理解层级**：
> - L0（表面）："只能做一个任务"
> - L1（关联）："技术上可以并行，但 todo 约束认知"
> - L2（深层）："强制模型保持单一焦点心智模型，避免注意力分散"

> **Q3**: nag reminder 为什么是"软约束"？
>
> **思考引导**：
> - 角度1：模型能忽略 nag 吗？
> - 角度2：硬约束（强制执行）的代价是什么？
>
> **预期理解层级**：
> - L0（表面）："提醒模型更新 todo"
> - L1（关联）："3轮不更新就注入提醒"
> - L2（深层）："软约束代价是可能被忽略，硬约束代价是违反信任模型原则")

---

## 二、结构化学习

### 2.1 SQ3R 进度

| 阶段 | 状态 | 关键产出 | 下一步 |
|------|------|----------|--------|
| Survey | ✅ 完成 | 识别 TodoManager 结构 | - |
| Question | ✅ 完成 | 6 个核心问题 | - |
| Read | ✅ 完成 | 理解单线程约束实现 | - |
| Recite | ✅ 完成 | 心智模型构建验证 | - |
| Review | 📅 待定 | 复习 nag 副作用 | 计划中 |

### 2.2 项目成果

| 项目 | 状态 | 关键交付物 | 学习价值 |
|------|------|-----------|----------|
| s03_todo_write.py | ✅ 理解 | TodoManager + nag 实现 | 软约束设计实践 |

### 2.3 KISS 复盘

| 类别 | 内容 | 优先级 |
|------|------|--------|
| **Keep** | 用情境测试验证心智模型 | - |
| **Improve** | 深化 nag 副作用理解 | 高 |
| **Start** | 关注软约束 vs 硬约束的设计权衡 | 中 |
| **Stop** | - | - |

---

## 三、对抗测试

### 3.1 脆弱点诊断

| 脆弱点 | 来源 | 风险等级 | 状态 | 补救措施 |
|--------|------|----------|------|----------|
| nag副作用误解 | 反事实情境2 | 中 | ✅ 已纠正 | nag 控制更新频率，不是 todo 数量 |

### 3.2 反事实情境

> **情境1**: 如果没有单线程约束，模型同时标记5个 in_progress？
>
> **答案**: 模型失去焦点概念，todo.render() 输出混乱，人类无法追踪进度，注意力分散。

> **情境2**: 如果 nag 每轮都注入？
>
> **答案**: 打断思考流程，上下文污染，模型产生"忽略习惯"。

> **情境3**: 如果 TodoManager 完全消失？
>
> **答案**: 模型在第2步开始跑偏，被局部问题卡住，忘记整体规划。

### 3.3 漏洞注入

| Bug | 描述 | 发现状态 |
|-----|------|----------|
| Bug 1 | 缺少单线程约束检查（in_progress_count > 1） | ✅ 已发现 |
| Bug 2 | 缺少计数器累加逻辑（rounds_since_todo += 1） | ✅ 已发现 |

---

## 四、核心代码（必背）

```python
class TodoManager:
    def __init__(self):
        self.items = []
        self.rounds_since_todo = 0
    
    def update(self, items: list) -> str:
        validated, in_progress_count = [], 0
        for item in items:
            status = item.get("status", "pending")
            if status == "in_progress":
                in_progress_count += 1  # 单线程约束检查
            validated.append({"id": item["id"], "text": item["text"],
                              "status": status})
        if in_progress_count > 1:
            raise ValueError("Only one task can be in_progress")
        self.items = validated
        self.rounds_since_todo = 0  # 重置计数器
        return self.render()
    
    def render(self) -> str:
        lines = []
        for item in self.items:
            if item["status"] == "pending":
                lines.append(f"[ ] {item['text']}")
            elif item["status"] == "in_progress":
                lines.append(f"[>] {item['text']}")
            elif item["status"] == "completed":
                lines.append(f"[x] {item['text']}")
        return "\n".join(lines)

# nag reminder: 3轮不更新就提醒
if rounds_since_todo >= 3 and messages:
    last = messages[-1]
    if last["role"] == "user" and isinstance(last.get("content"), list):
        last["content"].insert(0, {
            "type": "text",
            "text": "<reminder>Update your todos.</reminder>",
        })

# 计数器累加（每轮结束时）
if not called_todo_this_round:
    TodoManager.rounds_since_todo += 1
```

---

## 五、心智模型评估

| 概念 | 最终层级 | 达到 L2 的差距 |
|------|----------|----------------|
| TodoManager | L2 | ✅ 已理解 todo handler 注册 |
| 单线程约束 | L2 | ✅ 已理解认知设计约束 |
| nag_reminder | L2 | ✅ 纠偏后理解软性提醒 |
| 内省工具概念 | L2 | ✅ 已理解操作自身状态 |
| 软约束vs硬约束 | L2 | ✅ 已理解信任模型原则 |
| 范式转移 | L2 | ✅ 已理解决策主体差异 |

**整体评估**: L2 层级达成

---

## 六、后续课程关系

```
L03 (TodoWrite)
    │
    │ todo + nag + 单线程约束
    │
    ├─→ L04 Subagent     子任务继承 todo 机制
    ├─→ L05 Skill Loading todo 可追踪 skill 加载
    ├─→ L06 Context Compact todo 状态可压缩保留
    ├─→ L07 Task System  todo 持久化 + DAG
    └─→ L09 Agent Teams  多 agent todo 协调
```

---

## 七、复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| 待定 | 软约束vs硬约束设计权衡 | ⬜ |
| 待定 | nag 副作用理解 | ⬜ |
| 待定 | 与 L04 Subagent 的关系 | ⬜ |