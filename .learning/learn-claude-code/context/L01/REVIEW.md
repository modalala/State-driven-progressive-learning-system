# L01: The Agent Loop - 复习速查

> **格言**：*"One loop & Bash is all you need"*

---

## 核心代码（必背）

```python
def agent_loop(messages: list):
    while True:
        response = client.messages.create(
            model=MODEL, system=SYSTEM, messages=messages,
            tools=TOOLS, max_tokens=8000,
        )
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":  # 唯一退出条件
            return

        results = []
        for block in response.content:
            if block.type == "tool_use":
                output = run_bash(block.input["command"])
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": output})
        messages.append({"role": "user", "content": results})
```

---

## 关键概念速记

| 概念 | 一句话定义 | 记忆口诀 |
|------|-----------|----------|
| **Agent Loop** | while True + stop_reason 检测 | "一个循环跑到底" |
| **stop_reason** | 四种值决定循环去向 | "tool_use 继续，其他退出" |
| **messages[]** | 累积历史给模型上下文 | "越跑越长的对话链" |
| **Harness** | 执行层，不替模型决策 | "只执行，不判断" |
| **Hook** | 安全护栏，边界守护 | "护栏不是司机" |

---

## stop_reason 四种值

| 值 | 含义 | 循环行为 |
|----|------|----------|
| `tool_use` | 模型要调用工具 | **继续循环** |
| `end_turn` | 模型说完了 | 退出循环 |
| `max_tokens` | Token 耗尽被截断 | 退出循环 |
| `stop_sequence` | 遇到停止词 | 退出循环 |

---

## 核心原则（面试必答）

### 1. 职责分离

```
模型 = 决策智能（做什么）
Harness = 执行机制（怎么做）
Hook = 安全护栏（不能做什么）
```

### 2. 信任模型

- Harness **不能**阻止模型重复调用同一个命令
- `ls → del → ls` 验证场景需要重复调用
- Hook 是安全护栏，不是决策替代

### 3. 正确的退出条件

```python
# 错误：检测 tool_use 是否存在
if not any(b.type == "tool_use" for b in response.content):
    return

# 正确：检测 stop_reason
if response.stop_reason != "tool_use":
    return
```

**原因**：`max_tokens` 截断时响应可能包含未完成的 `tool_use` block，但不应执行。

---

## 常见陷阱

| 陷阱 | 错误理解 | 正确理解 |
|------|----------|----------|
| "智能循环"阻止重复 | 循环应该智能判断 | 循环完全被动，信任模型 |
| max_tokens 截断时执行 tool_use | 有 tool_use 就执行 | stop_reason 决定一切 |
| Harness 阻止无限循环 | Harness 应该防护 | 责任在模型，Hook 可防范 |

---

## 后续课程关系

```
L01 (Agent Loop) ─┬─→ L02 Tool Use      加工具不改循环
                  ├─→ L03 TodoWrite     循环上加规划
                  ├─→ L04 Subagent      循环派生子循环
                  ├─→ L05 Skill Loading 循环中注入知识
                  ├─→ L06 Context Compact 循环的上下文管理
                  └─→ L07-L12           持久化与团队协作
```

**核心洞察**：后面 11 个课程都在这个循环上叠加机制——循环本身始终不变。

---

## 自测问题

1. **为什么循环不能阻止模型重复调用同一个命令？**
   <details>
   <summary>点击查看答案</summary>
   因为 Harness 不应该替模型做决策。重复调用有时是合理的验证行为（如 ls → del → ls）。Hook 是安全护栏但不是决策替代。
   </details>

2. **max_tokens 截断时，响应里可能包含 tool_use block，为什么不执行它？**
   <details>
   <summary>点击查看答案</summary>
   stop_reason 有四种值，max_tokens 表示被迫截断，工具调用可能不完整。执行半截工具调用会导致错误行为。只有 stop_reason == "tool_use" 时才执行。
   </details>

3. **Agent 是什么？**
   <details>
   <summary>点击查看答案</summary>
   Agent 是模型本身，不是框架、不是提示词链。Agent = 在行动序列数据上学会了感知、推理、行动的神经网络。
   </details>

---

## 复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| 2026-04-03 | 核心代码模式 + stop_reason | ⬜ |
| 2026-04-09 | 对抗测试题 | ⬜ |
| 2026-04-23 | 与后续课程的关系 | ⬜ |