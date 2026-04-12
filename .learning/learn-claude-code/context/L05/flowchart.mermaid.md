# L05: Skill Loading 流程图

```mermaid
flowchart TB
    subgraph Init["初始化阶段"]
        I1["skills_dir 路径"]
        I2["sorted(rglob 'SKILL.md')"]
        I3["递归扫描所有 Skill"]
    end

    subgraph Parse["解析阶段"]
        P1["读取文件内容"]
        P2["检测 frontmatter"]
        P3["_parse_frontmatter()"]
        P4["三层兜底处理"]
        P5["返回 meta + body"]
    end

    subgraph Register["注册阶段"]
        R1["name = meta.get 'name'"]
        R2["fallback: f.parent.name"]
        R3["self.skills[name] = ..."]
    end

    subgraph Layer1["第一层注入"]
        L1A["get_descriptions()"]
        L1B["生成描述列表"]
        L1C["写入 system prompt"]
        L1D["常驻，不参与压缩"]
    end

    subgraph Layer2["第二层注入"]
        L2A["模型调用 load_skill"]
        L2B["get_content(name)"]
        L2C["生成 Skill 内容"]
        L2D["返回 tool_result"]
        L2E["按需，可压缩释放"]
    end

    I1 --> I2 --> I3
    I3 --> P1
    P1 --> P2
    P2 -->|"有 frontmatter"| P3
    P2 -->|"无 frontmatter"| P4
    P3 -->|"解析成功"| P5
    P3 -->|"解析失败"| P4
    P4 --> P5
    P5 --> R1
    R1 -->|"有 name"| R3
    R1 -->|"无 name"| R2 --> R3
    R3 --> L1A
    L1A --> L1B --> L1C --> L1D
    R3 --> L2A
    L2A --> L2B --> L2C --> L2D --> L2E

    style I3 fill:#e8f5e9,stroke:#333
    style P4 fill:#fff3e0,stroke:#333
    style R2 fill:#fff3e0,stroke:#333
    style L1D fill:#e8f5e9,stroke:#333
    style L2E fill:#e8f5e9,stroke:#333
```

## 流程说明

| 步骤 | 代码对应 | 说明 |
|------|----------|------|
| 1-3 | `rglob("SKILL.md")` | 递归扫描 skills 目录 |
| 4-5 | `_parse_frontmatter()` | 解析 YAML frontmatter |
| 6 | 三层兜底 | 无 frontmatter、格式畸形、YAML 错误 → 空 meta |
| 7-9 | `meta.get("name", f.parent.name)` | 容错性设计，目录名兜底 |
| 10-13 | `get_descriptions()` | 第一层：生成描述列表，写入 system prompt |
| 14-18 | `get_content(name)` | 第二层：按需加载，返回 tool_result |

---

## 容错性设计流程

```mermaid
flowchart TB
    subgraph Check["检查 frontmatter"]
        C1["text.startswith '---'?"]
        C2["有 frontmatter"]
        C3["无 frontmatter"]
    end

    subgraph Parse["解析 YAML"]
        P1["split '---' 2"]
        P2["yaml.safe_load()"]
        P3["格式畸形"]
        P4["YAML 错误"]
    end

    subgraph Result["结果"]
        R1["返回 meta + body"]
        R2["返回 {} + text"]
        R3["返回 {} + text"]
        R4["返回 {} + text"]
    end

    C1 -->|"是"| C2 --> P1
    C1 -->|"否"| C3 --> R2
    P1 -->|"len >= 3"| P2
    P1 -->|"len < 3"| P3 --> R3
    P2 -->|"成功"| R1
    P2 -->|"失败"| P4 --> R4

    style R2 fill:#fff3e0,stroke:#333
    style R3 fill:#fff3e0,stroke:#333
    style R4 fill:#fff3e0,stroke:#333
```

## 容错性设计要点

| 错误类型 | 频率 | 后果 | 处理 |
|----------|------|------|------|
| 无 frontmatter | 高频 | 轻（Skill 仍能注册） | ✅ 兜底，用目录名 |
| 格式畸形 | 中频 | 轻（Skill 仍能注册） | ✅ 兜底，用目录名 |
| YAML 解析失败 | 中频 | 轻（Skill 仍能注册） | ✅ 兜底，用目录名 |
| **写错 name 字段** | 低频 | 重（Skill 找不到） | ❌ 暴露，让用户发现 |

---

## 两层注入对比

```mermaid
flowchart LR
    subgraph OneLayer["一层注入（错误）"]
        O1["所有 Skill 内容"]
        O2["直接塞 system prompt"]
        O3["常驻 100000 tokens"]
        O4["注意力稀释"]
        O5["输出跑偏"]
    end

    subgraph TwoLayer["两层注入（正确）"]
        T1["Skill 描述列表"]
        T2["system prompt 常驻"]
        T3["Skill 内容"]
        T4["tool_result 按需"]
        T5["可压缩释放"]
        T6["认知质量保证"]
    end

    O1 --> O2 --> O3 --> O4 --> O5
    T1 --> T2
    T3 --> T4 --> T5
    T2 --> T6
    T5 --> T6

    style O5 fill:#ffebee,stroke:#333
    style T6 fill:#e8f5e9,stroke:#333
```

## 一层 vs 两层权衡

| 设计 | Token 成本 | 认知影响 | 压缩能力 |
|------|-----------|----------|----------|
| **一层（全塞）** | 高（常驻） | 注意力稀释 | ❌ 不可压缩 |
| **两层注入** | 低（按需） | 认知质量保证 | ✅ 可压缩释放 |

---

## Skill vs Tool 流程对比

```mermaid
flowchart TB
    subgraph Skill["Skill 加载流程"]
        S1["模型请求 load_skill"]
        S2["dispatch map 查找"]
        S3["get_content()"]
        S4["返回文本内容"]
        S5["注入到 messages"]
        S6["模型获得知识指引"]
    end

    subgraph Tool["Tool 执行流程"]
        T1["模型请求 tool"]
        T2["dispatch map 查找"]
        T3["执行具体操作"]
        T4["返回执行结果"]
        T5["注入到 messages"]
        T6["模型获得能力输出"]
    end

    S1 --> S2 --> S3 --> S4 --> S5 --> S6
    T1 --> T2 --> T3 --> T4 --> T5 --> T6

    style S4 fill:#f3e5f5,stroke:#333
    style T4 fill:#f3e5f5,stroke:#333
```

## Skill vs Tool 对比

| 维度 | Skill | Tool |
|------|-------|------|
| **触发** | load_skill(name) | read_file(path) 等 |
| **机制** | 都走 dispatch map | 都走 dispatch map |
| **返回值** | 文本内容（知识指引） | 执行结果（能力输出） |
| **目的** | 告诉模型"怎么做" | 让模型"能做什么" |

---

## 注意力稀释机制

```mermaid
flowchart TB
    subgraph Normal["正常情况"]
        N1["核心任务内容"]
        N2["权重分配"]
        N3["核心权重 = 1.0"]
        N4["输出精准"]
    end

    subgraph Diluted["稀释情况"]
        D1["核心任务内容"]
        D2["无关 Skill 内容"]
        D3["权重分配"]
        D4["核心权重 = 0.6"]
        D5["无关权重累加 = 0.4"]
        D6["每个 token 参考被稀释权重"]
        D7["混入无关内容"]
        D8["输出跑偏"]
    end

    N1 --> N2 --> N3 --> N4
    D1 --> D3
    D2 --> D3
    D3 --> D4
    D3 --> D5
    D4 --> D6 --> D7 --> D8
    D5 --> D6

    style N4 fill:#e8f5e9,stroke:#333
    style D8 fill:#ffebee,stroke:#333
```

## 注意力稀释链条

| 阶段 | 内容 | 结果 |
|------|------|------|
| 输入 | 核心任务 + 无关 Skill | 权重总和 = 1.0 |
| 分配 | 核心权重被稀释 | 0.6（核心） + 0.4（无关） |
| Token 生成 | 参考被稀释权重 | 混入无关内容 |
| 输出 | 原本应输出"错误处理" | 变成"检查文件大小"（PDF Skill 污染） |

---

## Subagent + Skill 流程

```mermaid
flowchart TB
    subgraph Parent["父 Agent"]
        P1["messages (可能很长)"]
        P2["调用 load_skill"]
    end

    subgraph Subagent["子 Agent"]
        S1["messages = [] (干净)"]
        S2["加载 Skill"]
        S3["Skill 内容进入 messages"]
        S4["执行任务"]
        S5["结束"]
        S6["丢弃 Skill 内容"]
    end

    subgraph Return["返回"]
        R1["返回摘要 text"]
        R2["父端收到 tool_result"]
        R3["父端 messages 不受污染"]
    end

    P1 --> P2 --> S1
    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> R1 --> R2 --> R3

    style S1 fill:#e8f5e9,stroke:#333
    style S6 fill:#fff3e0,stroke:#333
    style R3 fill:#e8f5e9,stroke:#333
```

## Subagent + Skill 关键点

| 内容类型 | 去向 | 原因 |
|----------|------|------|
| Skill 内容 | Subagent messages | 委托执行需要知识指引 |
| 中间过程 | 丢弃 | 不污染 Parent 上下文 |
| 最终摘要 | 返回 Parent | Parent 只需要结果 |

**设计原则**：认知质量 > 经济成本，宁可重复加载不污染 Parent 上下文。

---

## 与 L04/L06 的关系

```mermaid
flowchart LR
    subgraph L04["L04: Subagent"]
        A1["messages 隔离"]
        A2["委托执行"]
    end

    subgraph L05["L05: Skill Loading"]
        B1["两层注入"]
        B2["按需知识"]
    end

    subgraph L06["L06: Context Compact"]
        C1["三层压缩"]
        C2["释放策略"]
    end

    L04 -->|"Skill 进入 Subagent"| L05
    L05 -->|"tool_result 可压缩"| L06

    style A1 fill:#e8f5e9,stroke:#333
    style B1 fill:#e8f5e9,stroke:#333
    style C1 fill:#e8f5e9,stroke:#333
```

## 课程关系说明

| 课程 | 核心能力 | 与 L05 的关系 |
|------|----------|---------------|
| L04 Subagent | messages 隔离 | Skill 进入 Subagent messages，用完丢弃 |
| L05 Skill Loading | 两层注入 | 核心，按需知识加载 |
| L06 Context Compact | 三层压缩 | tool_result（第二层）可被压缩释放 |

---

## 第一层可放弃场景

```mermaid
flowchart TB
    subgraph Normal["正常场景"]
        N1["上下文 200K"]
        N2["两层都有"]
        N3["模型自主发现"]
        N4["按需加载"]
    end

    subgraph Extreme["极端场景"]
        E1["上下文 1000 tokens"]
        E2["放弃第一层"]
        E3["Skill 描述为空"]
        E4["用户显式请求"]
        E5["load_skill 'git'"]
        E6["仍然可用"]
    end

    N1 --> N2 --> N3 --> N4
    E1 --> E2 --> E3 --> E4 --> E5 --> E6

    style N4 fill:#e8f5e9,stroke:#333
    style E6 fill:#e8f5e9,stroke:#333
```

## 第一层可放弃说明

| 场景 | 第一层 | 第二层 | 可用性 |
|------|--------|--------|--------|
| 正常（200K） | ✅ 有（导航） | ✅ 有（内容） | ✅ 完全可用 |
| 极端（1000） | ❌ 放弃 | ✅ 有（内容） | ✅ 用户显式触发可用 |

**核心不变量**：第二层是本体，第一层是导航辅助。导航可以省略，本体不能。