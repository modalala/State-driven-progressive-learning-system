# L04: Subagent - 快速复习

> **格言**：*"大任务拆小，每个小任务干净的上下文"* -- 独立 messages[]，不污染主对话。

---

## 核心代码（必背）

```python
def run_subagent(prompt: str) -> str:
    sub_messages = [{"role": "user", "content": prompt}]  # 干净上下文
    for _ in range(30):  # safety_limit: 防无限循环兜底
        response = client.messages.create(
            model=MODEL, system=SUBAGENT_SYSTEM,
            messages=sub_messages,
            tools=CHILD_TOOLS,  # 禁止递归：子端无 task 工具
            max_tokens=8000,
        )
        sub_messages.append({"role": "assistant", "content": response.content})
        if response.stop_reason != "tool_use":
            break
        # 执行工具，append tool_result...
    return "".join(  # 返回最后一次 text 部分
        b.text for b in response.content if hasattr(b, "text")
    ) or "(no summary)"
```

---

## 关键概念速记

| 概念 | 一句话定义 | 记忆口诀 |
|------|-----------|----------|
| **Subagent** | 干净上下文的委托执行 | "派出去，带回来" |
| **上下文隔离** | 独立 messages[]，父端不受污染 | "子账独立，父账清白" |
| **task 工具** | 父端特有，子端无（禁止递归） | "父有子无，递归禁止" |
| **safety_limit** | 30轮兜底，防无限循环 | "三十轮，兜底锁" |
| **返回值机制** | 最后一次 text 部分，中间丢弃 | "只取摘要，丢弃过程" |
| **控制权归属** | 父端控制，子端执行 | "老板派活，员工干活" |
| **软返回约定** | 子端返回 text，父端收到 tool_result | "软返回，不硬控" |
| **有损压缩** | LLM 语义驱动需关键信息 | "语义摘要，关键保留" |

---

## 核心原则（面试必答）

### 1. 上下文隔离 = 认知保护

```
Subagent 用独立 messages[]
父 Agent 的 messages 不受污染
中间过程全部丢弃，只返回摘要
```

**原理**：LLM 的上下文是宝贵资源。Subagent 可能跑 30+ 次工具调用，但这些全部丢弃。父 Agent 只收到一段摘要文本，保持思维清晰。

### 2. 禁止递归 = 设计决策

```
不是 messages 增长问题
是防止目标偏移和成本失控的主动设计
扁平 vs 层级权衡：顶层控制 vs 层层传递
```

**权衡**：
- 扁平设计（禁止递归）：顶层 Agent 保持全局控制，成本可控
- 层级设计（允许递归）：层层委托，但目标可能偏移，成本失控

### 3. 返回值 = 有损压缩

```
返回最后一次响应的 text 部分
不是 tool_use block
中间过程全部丢弃
```

**类比**：
- Unix 管道：无损传输，数据完整流动
- LLM 上下文：有损压缩，只保留语义摘要

### 4. 创建成本 = API 调用

```
创建成本是一次 API 调用
不是"小"
但换来的是父端上下文清洁
```

**权衡**：虽然创建有成本，但换来的是父端上下文的长期清洁。

---

## 常见陷阱（7个已记录）

| 陷阱 | 错误理解 | 正确理解 | 状态 |
|------|----------|----------|------|
| "返回 tool_use block" | 返回执行结果 | 返回 LLM 总结的 text 部分 | ✅ 已修正 |
| "safety_limit 判断项目大小" | 大项目多轮，小项目少轮 | 防无限循环兜底，与项目大小无关 | ✅ 已修正 |
| "禁止递归是 messages 问题" | messages 会爆炸 | 设计决策，防止目标偏移 | ✅ 已修正 |
| "创建成本小" | Subagent 创建成本小 | 创建成本是一次 API 调用 | ✅ 已修正 |
| "子端也有 task 工具" | 子端可以再派 Subagent | 子端无 task，禁止递归 | ✅ 已修正 |
| "进程/线程/Subagent 相同" | 都是并发执行 | 进程隔离，线程共享，Subagent类似进程 | 🔄 待巩固 |
| "递归层级设计更好" | 层层委托更灵活 | 扁平设计保持顶层控制，层级风险更大 | 🔄 待巩固 |

---

## s03 vs s04 对比

| 组件 | s03 | s04 | 变化 |
|------|-----|-----|------|
| Tools | 5 (基础 + todo) | 5 (基础) + task (父端) | + task |
| 上下文 | 单一共享 | 父 + 子隔离 | **核心变化** |
| Subagent | 无 | run_subagent() | 新增 |
| 返回值 | 不适用 | 仅摘要 text | 新增 |
| 循环 | **不变** | **不变** | 核心 |

---

## 三轮苏格拉底诘问精要

| 轮次 | 核心问题 | 关键洞察 |
|------|----------|----------|
| R1 | Subagent 的"创建成本低"假设了什么？ | 创建成本是一次 API 调用，不是"小" |
| R2 | 如果 safety_limit=30 不够呢？ | 兜底机制，可配置，但增加成本 |
| R3 | 进程/线程/Subagent 的类比区别？ | messages 隔离类似进程，共享类似线程 |

---

## 反事实情境速记

| 情境 | 正确回答要点 |
|------|--------------|
| 子端也有 task 工具 | 目标偏移，成本失控，扁平vs层级权衡 |
| 返回 tool_use block | 父端无法理解子端工具调用语义 |
| 不丢弃中间过程 | 父端上下文爆炸，思维混乱 |
| safety_limit 不是30 | 可配置，但需要成本控制 |
| 允许递归嵌套 | 目标偏移风险增加，顶层控制削弱 |

---

## 与后续课程的关系

```
L04 (Subagent)
    │
    │ 干净上下文 + task 工具 + 禁止递归
    │
    ├─→ L05 Skill Loading  Subagent 加载 Skill
    ├─→ L06 Context Compact Subagent 摘要策略
    ├─→ L07 Task System     Subagent + 持久化
    ├─→ L08 Background      Subagent 异步执行
    ├─→ L09 Agent Teams     多 Subagent 协作
    └─→ L10 Team Protocols  Subagent 消息协议
```

---

## 费曼检验速记

| 概念 | 类比 | 核心要点 |
|------|------|----------|
| Subagent | 老板-员工 | 派出去办事，只汇报结果 |
| 上下文隔离 | 笔记本 | 独立记录，只给最后一页 |
| 禁止递归 | 层级委托 | 只派一层，防止跑偏 |
| 返回值机制 | 汇报总结 | 只说结果，丢弃过程 |

**费曼检验通过项**：4/6（Subagent、上下文隔离、禁止递归、返回值机制）
**待巩固项**：进程/线程类比、Unix管道vsLLM（类比迁移能力是L3专家级指标）

---

## 自测问题（面试级）

1. **为什么 Subagent 用独立 messages[]？**
   <details>
   <summary>点击查看答案</summary>
   上下文隔离：父 Agent 的 messages 不受污染。Subagent 可能跑 30+ 次工具调用，读很多文件，但这些全部丢弃。父 Agent 只收到摘要，保持思维清晰。
   </details>

2. **为什么禁止递归（子端无 task 工具）？**
   <details>
   <summary>点击查看答案</summary>
   不是 messages 增长问题，是设计决策。递归会导致：1) 目标偏移——层层委托后原始目标可能丢失；2) 成本失控——无法预测总调用次数。扁平设计保持顶层控制。
   </details>

3. **Subagent 返回什么？**
   <details>
   <summary>点击查看答案</summary>
   返回最后一次响应的 text 部分（LLM 的总结），不是 tool_use block。中间过程（所有工具调用和结果）全部丢弃。父 Agent 收到的是一段摘要文本。
   </details>

4. **进程/线程/Subagent 的类比区别？**
   <details>
   <summary>点击查看答案</summary>
   进程：独立内存空间，隔离彻底
   线程：共享内存，可互相访问
   Subagent：独立 messages[]，类似进程隔离
   创建成本：Subagent 是一次 API 调用，不是"小"
   </details>

5. **Unix管道 vs LLM上下文的区别？**
   <details>
   <summary>点击查看答案</summary>
   Unix管道：无损传输，数据完整流动
   LLM上下文：有损压缩，只保留语义摘要
   因为 LLM 是语义驱动，只需要关键信息；Unix 是数据驱动，需要完整数据。
   </details>

---

## 复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| 2026-04-16 | 返回值机制 + 禁止递归设计决策 | ⬜ |
| 2026-04-23 | 进程/线程/Subagent 类比理解 | ⬜ |
| 2026-05-07 | 与 L05 Skill Loading 的关系 | ⬜ |

---

## 核心格言

> *"大任务拆小，每个小任务干净的上下文"*
>
> Subagent 不是"更小的 Agent"，而是"干净上下文的委托执行"。
>
> 核心价值是上下文隔离，不是性能优化。