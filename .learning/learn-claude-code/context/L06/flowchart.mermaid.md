# L06: Context Compact - 流程图

## 学习流程图

```mermaid
flowchart TD
    subgraph SQ3R["SQ3R 学习法"]
        S1[Survey: 三层压缩概览]
        S2[Question: 摘要边界/控制权/本质]
        S3[Read: s06代码分析]
        S4[Recite: 理解纠正 L0→L2]
        S5[Review: 连续性5要素验证]
        S1 --> S2 --> S3 --> S4 --> S5
    end

    subgraph Project["项目实践"]
        P1[定义: 摘要vs理论差距]
        P2[分析: 识别缺失要素]
        P3[方案: 加入决策追溯]
        P4[交付: 改进思路]
        P1 --> P2 --> P3 --> P4
    end

    subgraph Adversarial["对抗测试"]
        A1[反事实: 决策丢失场景]
        A2[边界攻击: 压缩随便做反驳]
        A1 --> A2
    end

    S5 --> P1
    P4 --> A1
    A2 --> Done[课程完成]

    style S1 fill:#e8f5e9
    style S2 fill:#e8f5e9
    style S3 fill:#e8f5e9
    style S4 fill:#e8f5e9
    style S5 fill:#e8f5e9
    style P1 fill:#e8f5e9
    style P2 fill:#e8f5e9
    style P3 fill:#e8f5e9
    style P4 fill:#e8f5e9
    style A1 fill:#e8f5e9
    style A2 fill:#e8f5e9
    style Done fill:#c8e6c9
```

## 三层压缩策略流程

```mermaid
flowchart TD
    ToolOutput[工具输出] --> CheckSize{大小检查}
    
    CheckSize -->|超过阈值| Persist[保存到磁盘]
    Persist --> Preview[保留预览 2000字]
    Preview --> Messages1[进入messages]
    
    CheckSize -->|正常大小| Messages1
    
    Messages1 --> AgeCheck{历史检查}
    AgeCheck -->|超过3轮| Placeholder[替换为占位符]
    Placeholder --> Messages2[保留最近3个完整]
    
    AgeCheck -->|最近3轮| Messages2
    
    Messages2 --> ContextCheck{上下文总大小}
    ContextCheck -->|超过50000 tokens| Summary[生成摘要]
    Summary --> CompactMsg[压缩消息]
    
    ContextCheck -->|正常| Loop[继续Agent循环]
    CompactMsg --> Loop

    style Persist fill:#fff3e0
    style Placeholder fill:#fff3e0
    style Summary fill:#fff3e0
```

## 控制权归属决策流程

```mermaid
flowchart TD
    Decision[压缩决策] --> CostCheck{决策成本评估}
    
    CostCheck -->|低成本| HarnessControl[Harness控制]
    HarnessControl --> RuleBased[基于固定规则]
    RuleBased --> Threshold[阈值检测触发]
    
    CostCheck -->|高成本| ModelControl[模型控制]
    ModelControl --> ContextAware[需要上下文理解]
    ContextAware --> CompactTool[compact工具调用]
    
    Threshold --> Execute[执行压缩]
    CompactTool --> Execute

    style HarnessControl fill:#e1f5fe
    style ModelControl fill:#e8f5e9
```

## 心智模型层级转换

```mermaid
flowchart TD
    L0_Entry[L0: 表面理解] -->|SQ3R Read| L1_Question[L1: 关联理解]
    L1_Question -->|Recite纠正| L2_Deep[L2: 深层理解]
    
    L0_Entry -->|发现偏差| Correction[纠正点]
    L1_Question -->|发现偏差| Correction
    Correction --> L1_Question
    
    L2_Deep --> Feynman[费曼检验]
    Feynman -->|通过| Complete[课程完成]
    Feynman -->|未通过| L1_Question

    style L0_Entry fill:#ffebee
    style L1_Question fill:#fff3e0
    style L2_Deep fill:#e8f5e9
    style Complete fill:#c8e6c9
```

## 状态颜色编码说明

| 状态 | 颜色 | 含义 |
|------|------|------|
| `#e8f5e9` | 浅绿 | 已完成/已掌握 |
| `#fff3e0` | 浅橙 | 进行中/关键节点 |
| `#e1f5fe` | 浅蓝 | 未开始/待执行 |
| `#ffebee` | 浅红 | 脆弱点/需纠正 |
| `#c8e6c9` | 深绿 | 最终完成 |