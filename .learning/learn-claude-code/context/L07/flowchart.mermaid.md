# L07: Permission System - 流程图

## 权限管道流程

```mermaid
flowchart TB
    subgraph 输入
        TC[tool_call]
    end
    
    subgraph 权限管道
        TC --> BASH[Bash Validator<br/>独立前置检查]
        BASH -->|危险pattern| DENY1[deny<br/>reason: Bash validator]
        BASH -->|通过| DENY[Deny Rules]
        
        DENY -->|命中| DENY2[deny<br/>reason: matched deny rule]
        DENY -->|通过| MODE[Mode Check]
        
        MODE -->|plan模式+写操作| DENY3[deny<br/>reason: plan mode blocks writes]
        MODE -->|auto模式+读操作| ALLOW1[allow<br/>reason: auto mode allows reads]
        MODE -->|default模式| ALLOW[Allow Rules]
        
        ALLOW -->|命中| ALLOW2[allow<br/>reason: matched allow rule]
        ALLOW -->|通过| ASK[Ask User]
    end
    
    subgraph 输出
        ASK -->|用户yes| EXEC[执行 Handler]
        ASK -->|用户no| DENY4[deny<br/>reason: denied by user]
        ALLOW2 --> EXEC
        ALLOW1 --> EXEC
        DENY1 --> REJECT[返回拒绝]
        DENY2 --> REJECT
        DENY3 --> REJECT
        DENY4 --> REJECT
    end
    
    style BASH fill:#ff6b6b,color:#fff
    style DENY fill:#ff6b6b,color:#fff
    style MODE fill:#4ecdc4,color:#fff
    style ALLOW fill:#45b7d1,color:#fff
    style ASK fill:#f9ca24,color:#fff
    style EXEC fill:#6c5ce7,color:#fff
    style REJECT fill:#d63031,color:#fff
```

## 三种模式对比

```mermaid
flowchart LR
    subgraph default模式
        D1[未命中规则] --> D2[Ask User]
        D2 -->|yes| D3[执行]
        D2 -->|no| D4[拒绝]
    end
    
    subgraph plan模式
        P1[读操作] --> P2[Allow]
        P3[写操作] --> P4[Deny]
        P2 --> P5[执行]
        P4 --> P6[拒绝]
    end
    
    subgraph auto模式
        A1[安全操作<br/>read/search] --> A2[Allow]
        A3[危险操作<br/>write/bash危险] --> A4[Ask]
        A2 --> A5[执行]
        A4 -->|yes| A5
        A4 -->|no| A6[拒绝]
    end
    
    style D2 fill:#f9ca24,color:#fff
    style P2 fill:#45b7d1,color:#fff
    style P4 fill:#ff6b6b,color:#fff
    style A2 fill:#45b7d1,color:#fff
    style A4 fill:#f9ca24,color:#fff
```

## Bash读写分类

```mermaid
flowchart TB
    BASH[bash command] --> ANALYZE[内容分析]
    
    ANALYZE --> READ{读操作?}
    READ -->|是| READ_LIST[ls/cat/find/grep<br/>git status/log/diff]
    READ -->|否| WRITE{写操作?}
    
    WRITE -->|是| WRITE_LIST[rm/mv/cp<br/>git add/commit/push<br/>echo > file]
    WRITE -->|复杂| COMPLEX[需要进一步判断]
    
    READ_LIST --> PLAN_ALLOW[Plan模式: Allow]
    WRITE_LIST --> PLAN_DENY[Plan模式: Deny]
    COMPLEX --> PLAN_ASK[Plan模式: Ask User]
    
    style READ_LIST fill:#45b7d1,color:#fff
    style WRITE_LIST fill:#ff6b6b,color:#fff
    style COMPLEX fill:#f9ca24,color:#fff
```

## 数据库Agent迁移

```mermaid
flowchart TB
    subgraph Claude Code Harness
        CC1[tool_call] --> CC2[Bash Validator]
        CC2 --> CC3[Deny Rules]
        CC3 --> CC4[Mode Check]
        CC4 --> CC5[Allow Rules]
        CC5 --> CC6[Ask User]
    end
    
    subgraph 数据库 Agent
        DB1[query_call] --> DB2[SQL Validator<br/>DELETE TABLE/TRUNCATE]
        DB2 --> DB3[Deny Rules<br/>敏感表]
        DB3 --> DB4[Mode Check<br/>Plan=SELECT only]
        DB4 --> DB5[Allow Rules]
        DB5 --> DB6[Ask User<br/>未知存储过程]
    end
    
    CC1 -.->|迁移| DB1
    CC2 -.->|迁移| DB2
    CC3 -.->|迁移| DB3
    CC4 -.->|迁移| DB4
    CC5 -.->|迁移| DB5
    CC6 -.->|迁移| DB6
    
    style CC2 fill:#ff6b6b,color:#fff
    style DB2 fill:#ff6b6b,color:#fff
```