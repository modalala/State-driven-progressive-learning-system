# L01: Agent Loop 流程图

```mermaid
flowchart TB
    subgraph User["用户层"]
        U1["User Prompt"]
    end

    subgraph Loop["Agent Loop"]
        L1["messages.append(user)"]
        L2["LLM API Call"]
        L3["messages.append(assistant)"]
        L4{"stop_reason?"}
        L5["Execute Tools"]
        L6["Collect Results"]
        L7["messages.append(tool_results)"]
        L8["Return to User"]
    end

    subgraph StopReasons["stop_reason 类型"]
        S1["tool_use → 继续循环"]
        S2["end_turn → 正常结束"]
        S3["max_tokens → 截断"]
        S4["stop_sequence → 停止词"]
    end

    U1 --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 -->|"tool_use"| L5
    L5 --> L6
    L6 --> L7
    L7 --> L2
    L4 -->|"end_turn / max_tokens / stop_sequence"| L8

    L4 -.-> S1
    L4 -.-> S2
    L4 -.-> S3
    L4 -.-> S4

    style L2 fill:#f9f,stroke:#333,stroke-width:2px
    style L4 fill:#ff9,stroke:#333,stroke-width:2px
    style L5 fill:#9f9,stroke:#333,stroke-width:1px
```

## 流程说明

| 步骤 | 代码对应 | 说明 |
|------|----------|------|
| 1 | `messages.append({"role": "user"})` | 用户输入作为第一条消息 |
| 2 | `client.messages.create(...)` | 调用 LLM API |
| 3 | `messages.append({"role": "assistant"})` | 追加模型响应 |
| 4 | `if response.stop_reason != "tool_use"` | **唯一退出条件** |
| 5-7 | 工具执行 → 收集结果 → 追加 | 构造 tool_result 消息 |
| 8 | `return` | 循环结束，返回给用户 |

## 核心洞察

```
循环没有智能。
循环只做一件事：执行模型的要求，把结果喂回去。
决策权完全在模型。
```