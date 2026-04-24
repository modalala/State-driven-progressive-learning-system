# L11 Error Recovery - 流程图

```mermaid
flowchart TD
    subgraph AgentLoop["Agent Loop"]
        A[调用 API] --> B{检查响应}
        B -->|正常 tool_use| C[执行工具]
        B -->|stop_reason=max_tokens| D[续写分支]
        B -->|正常 end_turn| E[循环结束]
        
        A -->|Exception| F{分类错误}
        F -->|prompt too long| G[压缩分支]
        F -->|timeout/rate limit| H[退避分支]
        F -->|unknown| I[失败分支]
    end
    
    subgraph Recovery["恢复分支"]
        D --> D1{续写预算?}
        D1 -->|<3| D2[追加 CONTINUE_MESSAGE]
        D2 --> A
        D1 -->|>=3| I
        
        G --> G1{压缩预算?}
        G1 -->|<3| G2[替换 messages 为摘要]
        G2 --> A
        G1 -->|>=3| I
        
        H --> H1{退避预算?}
        H1 -->|<3| H2[等待 backoff_delay]
        H2 --> A
        H1 -->|>=3| I
    end
    
    I --> J[告诉用户失败原因]
    C --> A
```

## 恢复状态机

```mermaid
stateDiagram-v2
    [*] --> NormalExecution
    
    NormalExecution --> Continuation: stop_reason=max_tokens
    NormalExecution --> CompactRecovery: prompt too long
    NormalExecution --> BackoffRetry: timeout/rate limit
    NormalExecution --> FinalFail: unknown error
    
    Continuation --> NormalExecution: 成功
    Continuation --> FinalFail: 预算耗尽
    
    CompactRecovery --> NormalExecution: 成功
    CompactRecovery --> FinalFail: 预算耗尽
    
    BackoffRetry --> NormalExecution: 成功
    BackoffRetry --> FinalFail: 预算耗尽
    
    FinalFail --> [*]: 暴露给用户
```

## choose_recovery 决策树

```mermaid
flowchart LR
    E[错误输入] --> C{choose_recovery}
    
    C -->|stop_reason=max_tokens| R1["kind: continue"]
    C -->|"prompt" + "long"| R2["kind: compact"]
    C -->|"timeout/rate/unavailable"| R3["kind: backoff"]
    C -->|其他| R4["kind: fail"]
    
    R1 --> A1[追加续写提示]
    R2 --> A2[压缩 messages]
    R3 --> A3[退避等待]
    R4 --> A4[暴露失败]
```