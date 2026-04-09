# L04: Subagent 流程图

```mermaid
flowchart TB
    subgraph Parent["父 Agent (Parent)"]
        P1["messages = [...]<br/>（可能很长的历史）"]
        P2["tool: task<br/>prompt='找测试框架'"]
        P3["收到 tool_result<br/>（摘要文本）"]
        P4["继续主对话"]
    end

    subgraph Subagent["子 Agent (Subagent)"]
        S1["messages = []<br/>（干净上下文）"]
        S2["LLM API Call"]
        S3["执行工具 1"]
        S4["执行工具 2"]
        S5["..."]
        S6["执行工具 N"]
        S7["stop_reason ≠ tool_use"]
        S8["返回最后 text<br/>丢弃中间过程"]
    end

    subgraph Isolation["上下文隔离"]
        I1["父端 messages 不受污染"]
        I2["子端 messages 完全独立"]
        I3["中间过程全部丢弃"]
    end

    P1 --> P2
    P2 -->|"dispatch"| S1
    S1 --> S2
    S2 -->|"tool_use"| S3
    S3 --> S4
    S4 --> S5
    S5 --> S6
    S6 --> S2
    S2 -->|"end_turn"| S7
    S7 --> S8
    S8 -->|"summary"| P3
    P3 --> P4

    I1 -.-> P1
    I2 -.-> S1
    I3 -.-> S8

    style P2 fill:#f9f,stroke:#333,stroke-width:2px
    style S1 fill:#9f9,stroke:#333,stroke-width:2px
    style S8 fill:#ff9,stroke:#333,stroke-width:2px
    style I1 fill:#ddd,stroke:#333,stroke-width:1px
    style I2 fill:#ddd,stroke:#333,stroke-width:1px
    style I3 fill:#ddd,stroke:#333,stroke-width:1px
```

## 流程说明

| 步骤  | 代码对应                     | 说明                  |
| --- | ------------------------ | ------------------- |
| 1   | `messages = [...]`       | 父 Agent 可能有很多历史     |
| 2   | `tool: task`             | 父端调用 task 工具派发任务    |
| 3   | `messages = []`          | **关键：干净上下文启动**      |
| 4-7 | 工具执行循环                   | 子端可能执行 30+ 次调用      |
| 8   | `stop_reason ≠ tool_use` | 循环退出条件              |
| 9   | `return text`            | **关键：只返回摘要，丢弃过程**   |
| 10  | 父端收到摘要                   | 父端 messages 只增加一段文本 |

## 核心洞察

```
父端视角：
  "帮我找测试框架" → 收到 "pytest" → 继续工作

子端视角：
  读 5 个文件 → 分析内容 → 总结 → 丢弃一切

上下文隔离：
  父端不知道子端读了哪些文件
  子端不知道父端之前聊了什么
```

---

## 禁止递归流程对比

```mermaid
flowchart LR
    subgraph Flat["扁平设计（禁止递归）"]
        F1["Parent"]
        F2["Subagent 1"]
        F3["Subagent 2"]
        F1 --> F2
        F1 --> F3
    end

    subgraph Hierarchical["层级设计（允许递归）"]
        H1["Parent"]
        H2["Subagent 1"]
        H3["Subagent 1.1"]
        H4["Subagent 1.1.1"]
        H1 --> H2
        H2 --> H3
        H3 --> H4
    end

    Flat -->|"控制成本"| R["顶层控制"]
    Hierarchical -->|"风险"| R2["目标偏移<br/>成本失控"]

    style F1 fill:#9f9,stroke:#333
    style H4 fill:#f99,stroke:#333
```

## 扁平 vs 层级权衡

| 设计 | 优点 | 缺点 | Claude Code 选择 |
|------|------|------|------------------|
| **扁平** | 顶层控制，成本可控 | 委托深度有限 | ✅ 禁止递归 |
| **层级** | 层层委托，更灵活 | 目标偏移风险，成本失控 | ❌ 风险太大 |

---

## 返回值机制流程

```mermaid
flowchart TB
    subgraph Execution["执行过程"]
        E1["工具调用 1"]
        E2["工具调用 2"]
        E3["..."]
        E4["工具调用 N"]
        E5["最后一次响应"]
    end

    subgraph Discard["丢弃"]
        D1["所有 tool_use blocks"]
        D2["所有 tool_result"]
        D3["中间 reasoning"]
    end

    subgraph Return["返回"]
        R1["text 部分<br/>（LLM 总结）"]
        R2["父端收到 tool_result"]
    end

    E1 --> E2 --> E3 --> E4 --> E5
    E1 -.-> D1
    E2 -.-> D1
    E4 -.-> D1
    E5 --> R1
    D1 --> D2 --> D3
    R1 --> R2

    style D1 fill:#f99,stroke:#333
    style D2 fill:#f99,stroke:#333
    style D3 fill:#f99,stroke:#333
    style R1 fill:#9f9,stroke:#333,stroke-width:2px
```

## 返回值关键点

| 内容类型 | 去向 | 原因 |
|----------|------|------|
| **tool_use blocks** | 丢弃 | 父端不需要知道具体调用 |
| **tool_result** | 丢弃 | 中间结果不需要保留 |
| **中间 reasoning** | 丢弃 | 只有语义摘要有价值 |
| **最后 text 部分** | 返回 | LLM 的总结，父端需要的 |

---

## Unix管道 vs LLM上下文对比

```mermaid
flowchart LR
    subgraph Unix["Unix 管道"]
        U1["进程 A"]
        U2["完整数据"]
        U3["进程 B"]
        U4["完整数据"]
        U1 --> U2 --> U3 --> U4
    end

    subgraph LLM["LLM 上下文"]
        L1["父 Agent"]
        L2["语义摘要<br/>（有损压缩）"]
        L3["子 Agent<br/>（丢弃一切）"]
        L4["原始数据<br/>（全部丢弃）"]
        L1 --> L2
        L3 --> L4
        L4 -.->|"丢弃"| X["❌"]
    end

    style U2 fill:#9f9,stroke:#333
    style U4 fill:#9f9,stroke:#333
    style L2 fill:#ff9,stroke:#333
    style L4 fill:#f99,stroke:#333
```

## 范式对比

| 特性 | Unix 管道 | LLM 上下文 |
|------|----------|-----------|
| **驱动方式** | 数据驱动 | 语义驱动 |
| **传输方式** | 无损传输 | 有损压缩 |
| **数据完整性** | 完整流动 | 只保留摘要 |
| **设计哲学** | 数据不丢失 | 关键信息足够 |

---

## safety_limit 兜底机制

```mermaid
flowchart TB
    S1["Subagent 启动"]
    S2["轮次计数 i=0"]
    S3["执行一轮"]
    S4["i < 30?"]
    S5["stop_reason ≠ tool_use?"]
    S6["继续执行"]
    S7["强制退出<br/>（兜底）"]
    S8["正常退出"]

    S1 --> S2 --> S3 --> S4
    S4 -->|"是"| S5
    S4 -->|"否"| S7
    S5 -->|"是"| S8
    S5 -->|"否"| S6 --> S3

    style S7 fill:#f99,stroke:#333
    style S8 fill:#9f9,stroke:#333
```

## safety_limit 关键点

| 误解 | 正确理解 |
|------|----------|
| 判断项目大小 | ❌ 错误 |
| 防无限循环兜底 | ✅ 正确 |
| 可配置 | ✅ 可调整 |
| 增加轮次增加成本 | ✅ 成本权衡 |