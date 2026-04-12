# L05: Skill Loading - Context 总结

## 元信息
- **生成时间**：2026-04-12
- **课程**：L05 - Skill Loading
- **核心能力**：理解 Skill 的两层注入机制与按需知识加载
- **学习状态**：✅ 完成（方法1-3全部完成）
- **格言**：*"用到什么知识，临时加载什么知识"*

---

## 一、心智模型构建

### 1.1 核心概念网络

| 概念 | 定义 | 依赖关系 | 熟练度 |
|------|------|----------|--------|
| **两层注入** | 系统提示放描述列表（便宜），tool_result 放完整内容（贵但按需） | → 上下文生命周期管理 | L2 |
| **第一层注入** | system prompt 中的 Skill 描述列表 | → 常驻，不参与压缩 | L2 |
| **第二层注入** | tool_result 中的 Skill 完整内容 | → 可被压缩释放 | L2 |
| **模型主动请求** | load_skill 是 dispatch map 的又一个 handler | → 统一入口原则 | L2 |
| **知识解耦** | Skill 以 SKILL.md 文件形式存在，Harness 不硬编码 | → 开闭原则 | L2 |
| **Skill ≠ Tool** | Skill 是"怎么做"的指引，Tool 是"做什么"的能力 | → 职责分离 | L2 |
| **SkillLoader** | 递归扫描 + frontmatter 解析 + 两层注入 | → 知识注册机制 | L2 |
| **frontmatter 解析** | YAML 元数据与 Markdown 内容分离 | → 容错性设计 | L2 |
| **容错性设计** | 对高频轻后果兜底，对低频重后果暴露 | → 显式失败优于隐式错误 | L2 |
| **渐进式披露** | 主 Skill 暴露大纲，子 Skill 存详细步骤 | → 注意力管理 | L2 |
| **确定性 vs 灵活性** | 固定工作流用确定性设计，通用场景用灵活性设计 | → 冺策权归属 | L2 |
| **Subagent + Skill** | Skill 进入 Subagent messages，用完丢弃 | → 认知质量 > 经济成本 | L2 |

### 1.2 专家视角

#### 专家共识

| 议题 | 共识内容 |
|------|----------|
| **两层注入本质** | 第一层是 system prompt（常驻不压缩），第二层是 tool_result（可压缩释放）。价值是"可以被释放"而非"立刻释放"。 |
| **模型主动请求** | load_skill 是 dispatch map 的一个 handler，和 Tool 用同样机制。统一入口原则：不改 agent loop 逻辑。 |
| **容错性设计** | frontmatter 解析失败返回空 meta，Skill 仍能注册（用目录名）。显式失败优于隐式错误。 |
| **Skill 渐进式披露** | 主 SKILL.md 暴露大纲和触发关键字，详细步骤在子 Skill。降低注意力偏移风险。 |
| **Subagent + Skill** | Skill 内容进入 Subagent messages，结束后丢弃。宁可重复加载不污染 Parent 上下文。 |

#### 专家分歧

| 议题 | 观点 A | 观点 B | 综合观点 |
|------|--------|--------|----------|
| **Skill 列表必要性** | 两层都要（模型自主决策需要知道有哪些） | 只在 tool_result（外部触发时列表多余） | 两层都要，但第一层必要性取决于决策权归属 |

### 1.3 深度测试问题

> **Q1**: 如果 Skill 只有 100 tokens，还需要两层注入吗？
>
> **预期理解层级**：
> - L0（表面）：不需要，直接放 system prompt
> - L1（关联）：两层注入省 token
> - L2（深层）：两层注入价值是上下文生命周期管理。Skill 放 tool_result 可被压缩释放，放 system prompt 则常驻。即使短 Skill 也应该两层注入，保持架构一致性。

> **Q2**: 为什么用目录名作为 Skill 标识的 fallback？
>
> **预期理解层级**：
> - L0（表面）：方便管理
> - L1（关联）：容错性设计，不写 name 也能用
> - L2（深层）：宽容设计的权衡——对高频轻后果错误（忘记写 name）兜底，对低频重后果错误（写错 name）暴露。显式失败优于隐式错误。

> **Q3**: Skill 和 Tool 为什么共用 dispatch map？
>
> **预期理解层级**：
> - L0（表面）：都是字典注册
> - L1（关联）：开闭原则
> - L2（深层）：统一入口原则。Skill 只是另一种 Tool——都是模型主动请求，都走 tool_use，都不改 agent loop 逻辑。

> **Q4**: Skill 内容太长（5000 tokens）有什么影响？
>
> **预期理解层级**：
> - L0（表面）：占用上下文空间
> - L1（关联）：挤占其他内容
> - L2（深层）：两个层面——物理问题（上下文容量）和认知问题（注意力偏移）。前者 L06 压缩可解决，后者需 Skill 设计层解决（渐进式披露）。

> **Q5**: Subagent 加载 Skill 后，Skill 内容去哪里？
>
> **预期理解层级**：
> - L0（表面）：进入 messages
> - L1（关联）：进入 Subagent messages
> - L2（深层）：Subagent messages 隔离，Skill 用完随 Subagent 结束丢弃。宁可重复加载不污染 Parent 上下文。认知质量 > 经济成本。

---

## 二、结构化学习

### 2.1 SQ3R 进度

| 阶段 | 状态 | 关键产出 | 下一步 |
|------|------|----------|--------|
| Survey | ✅ 完成 | 理解 SkillLoader 三层功能 | - |
| Question | ✅ 完成 | 提出扫描、解析、失败处理三个问题 | - |
| Read | ✅ 完成 | 阅读 SkillLoader 代码 | - |
| Recite | ✅ 完成 | 图书馆类比：索引（meta）+ 内容（body） | - |
| Review | ✅ 完成 | 确认四项检查清单通过 | - |

### 2.2 项目成果

| 项目 | 状态 | 关键交付物 | 学习价值 |
|------|------|-----------|----------|
| SKILL.md 设计 | ✅ 完成 | progressive-learning-coach 主 SKILL.md | 理解渐进式披露架构 |

**设计产出**：

```markdown
---
name: progressive-learning-coach
description: |
  Progressive learning coach implementing 3 methods.
  Use when: (1) syllabus.yaml exists in current directory, 
  (2) user says "开始学习"/"继续学习"/"查看进度".
metadata:
  version: 2.0.0
---

# Progressive Learning Coach

## 可用工作流

| 工作流 | 描述 | 子 Skill |
|--------|------|----------|
| 心智模型建构 | 建立专家思维框架 | references/method1-mental-model.md |
| 结构化学习 | 系统化掌握并实践 | references/method2-structured.md |
| 对抗测试 | 暴露并修复盲区 | references/method3-adversarial.md |

## 触发场景
...
```

### 2.3 KISS 复盘

| 类别 | 内容 |
|------|------|
| **Keep** | 图书馆类比帮助理解 SkillLoader 机制 |
| **Improve** | - |
| **Stop** | - |
| **Start** | - |

---

## 三、对抗测试（已完成）

### 3.1 苏格拉底诘问记录

#### 第一轮：逻辑前提挑战

| 问题 | 学习者回答 | 发现的脆弱点 | 状态 |
|------|-----------|--------------|------|
| "tool_result 可以被压缩释放"假设了什么？ | 容量不足时 agent 自动压缩 | 压缩由 Harness 执行，模型只接收提醒 | ✅ 已澄清 |
| 第一层注入是什么？ | message | **概念混淆**：第一层是 system prompt，不在 messages | ✅ 已修正 |
| tool_result 立刻释放吗？ | 会释放 | **过度简化**：tool_result 在 messages 中，容量不足时才压缩 | ✅ 已修正 |

**核心澄清**：

| 位置 | 内容 | 能否被压缩 |
|------|------|-----------|
| system prompt | Skill 描述列表（第一层） | ❌ 不压缩，常驻 |
| messages 数组 | 用户 prompt、模型输出、tool_result | ✅ 可压缩 |
| tool_result | Skill 完整内容（第二层） | ✅ 可压缩释放 |

#### 第二轮：边界条件攻击

| 问题 | 学习者回答 | 发现的洞察 | 状态 |
|------|-----------|--------------|------|
| 50 个 Skill 描述列表占 2500 tokens | 提出增加 Skill Handler 做 Skill 管理 | SkillLoader 被动响应 vs Skill Handler 主动管理 | ✅ 已讨论 |
| Skill 干扰问题 | Skill 之间应该互斥 | 描述不够精准可能加载错误 Skill | ✅ 已讨论 |

**用户提出的架构改进**：
1. **Skill Handler**：管理 + 挑选 + 调度（区别于 SkillLoader 的被动响应）
2. **Skill 互斥**：避免同时加载相似 Skill 导致目标偏移

#### 第三轮：范式转移挑战

| 问题 | 学习者回答 | 发现的洞察 | 状态 |
|------|-----------|--------------|------|
| 两层注入价值误认为只省 token | 提出认知管理+生命周期控制 | 架构一致性是更深价值 | ✅ 已讨论 |

### 3.2 反事实情境（已完成）

| 情境 | 核心发现 | 不变量提炼 |
|------|----------|------------|
| 1. 资源约束反转 | 第一层可放弃 | 第二层是本体，第一层是导航辅助 |
| 2. 时序错乱 | 字典覆盖是隐性行为 | 确定性优于随机性，显式失败优于隐式错误 |
| 3. 主体替换 | 格式宽容度是显性设计 | 宽容有边界：高频轻后果兜底，低频重后果暴露 |
| 4. 目标冲突 | 共享池技术上不可行 | messages 隔离是物理约束，不可打破 |
| 5. 尺度折叠 | 架构一致性 > 短期省钱 | 物理问题 vs 认知问题需要分层解决 |

### 3.3 漏洞注入（已完成）

#### 故意误解测试

| 误解 | 类型 | 学习者纠正 | 状态 |
|------|------|-----------|------|
| 两层注入只是省 token/省空间 | 过度简化 | 两层注入=认知管理+生命周期控制+经济优化+架构一致性 | ✅ 已纠正 |
| Skill 与 Tool 格式差异是本质差异 | 概念混淆 | 本质差异：Skill=知识注入，Tool=能力执行 | ✅ 已纠正 |
| 容错性设计是"吞掉错误"反模式 | 反模式曲解 | 宽容有边界：高频轻后果兜底，低频重后果暴露 | ✅ 已纠正 |

#### 追问黑洞（11问）

完整链条：两层注入 → 第一层轻量导航 → 第二层按需加载 → 大模型注意力问题 → 权重分配 → 归一化约束 → 稀释 → token 级别污染 → 输出跑偏

**关键洞察**：Transformer 注意力权重稀释导致每个 token 生成时参考被稀释的权重，混入无关内容，导致输出跑偏。

#### 迁移挑战

| 类比 | 评分 | 评价 |
|------|------|------|
| 食堂排队 | 合格 | 方向正确，第二层类比不够精确 |
| 垃圾分类 | **优秀** | 准确传达注意力稀释导致错误行为 |
| 恋爱关系 | 良好 | 信息淹没 → 无法决策 |

---

## 四、脆弱点追踪（已解决 13 个）

| ID | 类型 | 主题 | 来源 | 修正 |
|------|------|------|------|------|
| L05-V01 | 概念混淆 | 第一层注入概念混淆 | 苏格拉底诘问第一轮 | 第一层是 system prompt，不在 messages 数组 |
| L05-V02 | 过度简化 | tool_result 立刻释放误解 | 苏格拉底诘问第一轮 | tool_result 在 messages 中，容量不足时才压缩释放 |
| L05-V03 | 逻辑漏洞 | 假设第一层是必需的 | 反事实情境1 | 第一层可放弃，由外部触发替代 |
| L05-V04 | 概念混淆 | 隐性行为误认为显性设计 | 反事实情境2 | 字典覆盖是 Python 特性，不是 SkillLoader 的主动设计决策 |
| L05-V05 | 逻辑漏洞 | 随机顺序的影响时机 | 反事实情境2 | 问题在"每次启动"，不是"每次执行" |
| L05-V06 | 概念混淆 | 容错性设计误认为偶然 | 反事实情境3 | 格式宽容度是显性设计决策，三层兜底代码是主动编写 |
| L05-V07 | 逻辑漏洞 | 设计权衡误认为可逆转 | 反事实情境4 | messages 隔离是物理约束，共享池技术上不可行 |
| L05-V08 | 逻辑漏洞 | 两层注入价值误认为只省 token | 反事实情境5 | 架构一致性是更深价值 |
| L05-V09 | 概念混淆 | 按需加载误认为一次性全部加载 | 反事实情境5 | 第二层是按需，不是一次性 |
| L05-V10 | 边界误解 | 物理问题与认知问题混淆 | 反事实情境5 | 5000 tokens 问题是认知层（注意力偏移），不是物理层（容量） |
| L05-V11 | 过度简化 | 两层注入只省 token/省空间 | 漏洞注入-误解1 | 两层注入=认知管理+生命周期控制+经济优化+架构一致性 |
| L05-V12 | 概念混淆 | Skill 与 Tool 格式差异是本质差异 | 漏洞注入-误解2 | 本质差异：Skill=知识注入，Tool=能力执行 |
| L05-V13 | 反模式曲解 | 容错性设计误认为吞掉错误 | 漏洞注入-误解3 | 宽容有边界：高频轻后果兜底，低频重后果暴露 |

---

## 五、核心代码模式

```python
class SkillLoader:
    def __init__(self, skills_dir: Path):
        self.skills = {}
        for f in sorted(skills_dir.rglob("SKILL.md")):  # 递归扫描
            text = f.read_text()
            meta, body = self._parse_frontmatter(text)  # 解析
            name = meta.get("name", f.parent.name)  # 容错性设计
            self.skills[name] = {"meta": meta, "body": body}

    def _parse_frontmatter(self, text: str) -> tuple[dict, str]:
        if not text.startswith("---"):
            return {}, text  # 无 frontmatter → 空 meta + 全文
        parts = text.split("---", 2)
        if len(parts) < 3:
            return {}, text  # 格式畸形 → 空 meta + 全文
        try:
            meta = yaml.safe_load(parts[1].strip()) or {}
        except yaml.YAMLError:
            meta = {}  # YAML 解析失败 → 空 meta
        return meta, parts[2].strip()

    def get_descriptions(self) -> str:  # 第一层：系统提示
        lines = []
        for name, skill in self.skills.items():
            desc = skill["meta"].get("description", "")
            lines.append(f"  - {name}: {desc}")
        return "\n".join(lines)

    def get_content(self, name: str) -> str:  # 第二层：tool_result
        skill = self.skills.get(name)
        if not skill:
            return f"Error: Unknown skill '{name}'."
        return f"<skill name=\"{name}\">\n{skill['body']}\n</skill>"
```

**关键行解读**：
- 第 4 行：`rglob("SKILL.md")` → 递归扫描 skills 目录
- 第 7 行：`meta.get("name", f.parent.name)` → 容错性设计，目录名兜底
- 第 11-20 行：三层错误处理 → 全部返回空 meta，不崩溃
- 第 22-26 行：`get_descriptions()` → 第一层注入，常驻
- 第 28-32 行：`get_content()` → 第二层注入，可压缩

---

## 六、与其他课程的关系

```
L05 (Skill Loading) ─┬─→ L01 (Agent Loop)  统一入口：Skill 和 Tool 都走 tool_use
                     ├─→ L02 (Tool Use)    开闭原则：加 Skill 不改 dispatch map
                     ├─→ L04 (Subagent)    上下文隔离：Skill 进入 Subagent messages
                     ├─→ L06 (Context Compact) tool_result 可压缩释放
                     ▼
L06 (Context Compact)
```

---

## 七、复习计划

| 时间点 | 复习内容 | 复习方式 | 状态 |
|--------|----------|----------|------|
| 2026-04-16 | 两层注入机制 + 上下文生命周期 | 重读代码，自问自答 | ⬜ |
| 2026-04-23 | 容错性设计原则 | 对比其他系统的错误处理 | ⬜ |
| 2026-05-07 | 与 L06 Context Compact 的关系 | 理解压缩机制的配合 | ⬜ |

---

## 八、用户提出的架构改进（对抗测试中验证）

### 8.1 Skill Handler 设计

**问题**：当前 SkillLoader 是被动响应（模型请求什么，返回什么）

**用户建议**：增加 Skill Handler，做主动管理（判断应该给什么，限制给什么）

**验证结论**：有价值，但需进一步设计
- Skill Handler 可以解决字典隐性覆盖问题（检测同名冲突，显式报错）
- Skill Handler 可以主动管理注册，拒绝重复 Skill
- 与 SkillLoader 的边界：SkillLoader 负责扫描解析，Skill Handler 负责注册管理

### 8.2 Skill 互斥机制

**问题**：描述不够精准时，模型可能加载错误的 Skill

**用户建议**：Skill 之间应该互斥，避免同时加载相似 Skill

**验证结论**：有价值，但需区分层级
- Harness 层限制：Skill Handler 检测相似 Skill，加载时提示冲突
- 描述层区分：优化 Skill 描述，使其更加精准，减少误判
- Skill 分组：按功能域分组，同组 Skill 互斥