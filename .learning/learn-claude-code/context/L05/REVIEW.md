# L05: Skill Loading - 快速复习

> **格言**：*"用到什么知识，临时加载什么知识"* -- 通过 tool_result 注入，不塞 system prompt。

---

## 核心代码（必背）

```python
class SkillLoader:
    def __init__(self, skills_dir: Path):
        self.skills = {}
        for f in sorted(skills_dir.rglob("SKILL.md")):  # 递归扫描
            text = f.read_text()
            meta, body = self._parse_frontmatter(text)  # 解析
            name = meta.get("name", f.parent.name)  # 容错性设计
            self.skills[name] = {"meta": meta, "body": body}

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

---

## 关键概念速记

| 概念 | 一句话定义 | 记忆口诀 |
|------|-----------|----------|
| **两层注入** | 系统提示放描述（便宜），tool_result 放内容（按需） | "外层导航，内层内容" |
| **第一层注入** | system prompt 中的 Skill 描述列表 | "常驻不压缩" |
| **第二层注入** | tool_result 中的 Skill 完整内容 | "按需可释放" |
| **SkillLoader** | 递归扫描 + frontmatter 解析 + 两层注入 | "扫描解析注册" |
| **容错性设计** | 高频轻后果兜底，低频重后果暴露 | "宽容有边界" |
| **统一入口原则** | Skill 和 Tool 都走 dispatch map | "Skill 也是 Tool" |
| **渐进式披露** | 主 Skill 暴露大纲，子 Skill 存详细步骤 | "大纲在外，细节在内" |
| **Skill ≠ Tool** | Skill 是知识指引，Tool 是执行能力 | "知识 vs 能力" |

---

## 核心原则（面试必答）

### 1. 两层注入 = 认知管理 + 生命周期控制

```
第一层：Skill 描述列表（system prompt）→ 常驻，不参与压缩
第二层：Skill 完整内容（tool_result）→ 按需加载，可被压缩释放
```

**价值**：不只是省 token，更是架构一致性——项目成长后无需重构。

### 2. 容错性设计 = 宽容有边界

```
三层兜底：无 frontmatter、格式畸形、YAML 解析失败 → 全返回空 meta
边界：写错 name 字段（低频重后果）→ 暴露，不兜底
```

**原则**：显式失败优于隐式错误，但"显式失败"不代表"任何错误都崩溃"。

### 3. Skill 与 Tool = 知识注入 vs 能力执行

```
Skill：返回文本内容（注入到 messages），告诉模型"怎么做"
Tool：返回执行结果（文件内容、命令输出），让模型"能做什么"
```

**本质差异**：职责不同，机制相同（都走 dispatch map）。

### 4. 注意力稀释 = token 级别污染

```
无关内容权重低但累加 → 稀释核心任务权重
每个 token 生成时参考被稀释的权重 → 混入无关内容 → 输出跑偏
```

**链条**：两层注入 → 第一层轻量 → 第二层按需 → 避免注意力稀释。

---

## 常见陷阱（13个已解决）

| 陷阱 | 错误理解 | 正确理解 | 状态 |
|------|----------|----------|------|
| "第一层是 message" | 第一层在 messages 数组 | 第一层是 system prompt，不在 messages | ✅ 已修正 |
| "tool_result 立刻释放" | 加载完立刻释放 | 在 messages 中，容量不足时才压缩释放 | ✅ 已修正 |
| "第一层必需" | 必须有两层 | 第一层可放弃，由外部触发替代 | ✅ 已修正 |
| "字典覆盖是显性设计" | SkillLoader 主动设计 | Python 字典隐性行为，应显式报错 | ✅ 已修正 |
| "随机顺序每次执行都变" | 每次执行结果不同 | 问题在每次启动，字典构建后固定 | ✅ 已修正 |
| "容错性是偶然" | Python 默认行为 | 三层兜底代码是主动编写的设计决策 | ✅ 已修正 |
| "Skill 共享池可行" | 可以复用 Skill | messages 隔离是物理约束，共享池技术上不可行 | ✅ 已修正 |
| "两层注入只省 token" | 目的是经济优化 | 架构一致性是更深价值，认知管理是核心 | ✅ 已修正 |
| "第二层一次性加载" | 加载所有 Skill 内容 | 第二层是按需，不是一次性 | ✅ 已修正 |
| "5000 tokens 是容量问题" | 物理层问题 | 认知层问题（注意力偏移），不是容量 | ✅ 已修正 |
| "Skill 与 Tool 格式差异是本质" | md vs py 是本质 | 格式不重要，职责（知识 vs 能力）才是本质 | ✅ 已修正 |
| "容错性是吞掉错误" | 反模式 | 宽容有边界，关键错误会暴露 | ✅ 已修正 |
| "玩具项目可以偷懒" | 小项目不需要两层注入 | 架构一致性价值，项目会成长 | ✅ 已修正 |

---

## s04 vs s05 对比

| 组件 | s04 | s05 | 变化 |
|------|-----|-----|------|
| Tools | 5 (基础 + task) | 5 (基础) + load_skill | + load_skill |
| 系统提示 | 静态字符串 | + Skill 描述列表 | **核心变化** |
| 知识库 | 无 | skills/*/SKILL.md | 新增 |
| 注入方式 | 无 | 两层（系统提示 + tool_result） | 新增 |

---

## 三轮苏格拉底诘问精要

| 轮次 | 核心问题 | 关键洞察 |
|------|----------|----------|
| R1 | "tool_result 可以被压缩释放"假设了什么？ | 压缩由 Harness 执行，第一层是 system prompt 不在 messages |
| R2 | 50 个 Skill 描述列表占 2500 tokens 怎么办？ | 提出 Skill Handler 主动管理，Skill 互斥避免干扰 |
| R3 | 两层注入价值是什么？ | 架构一致性 > 短期省钱，认知管理是核心 |

---

## 反事实情境速记

| 情境 | 核心发现 | 不变量提炼 |
|------|----------|------------|
| 资源约束反转 | 第一层可放弃 | 第二层是本体，第一层是导航辅助 |
| 时序错乱 | 字典覆盖是隐性行为 | 确定性优于随机性，显式失败优于隐式错误 |
| 主体替换 | 格式宽容度是显性设计 | 宽容有边界：高频轻后果兜底，低频重后果暴露 |
| 目标冲突 | 共享池技术上不可行 | messages 隔离是物理约束，不可打破 |
| 尺度折叠 | 架构一致性 > 短期省钱 | 物理问题 vs 认知问题需要分层解决 |

---

## 追问黑洞链条

```
两层注入 → 第一层轻量导航 → 第二层按需加载
    ↓
为什么两层能解决认知偏差？
    ↓
大模型注意力问题 → 看到但被分散
    ↓
注意力机制如何分散？
    ↓
权重分配 → 归一化约束 → 无关内容累加 → 稀释核心权重
    ↓
权重稀释具体后果？
    ↓
每个 token 生成时参考被稀释权重 → 混入无关内容 → 输出跑偏
```

---

## 与后续课程的关系

```
L05 (Skill Loading)
    │
    │ 两层注入 + 按需加载 + 容错性设计
    │
    ├─→ L01 Agent Loop   统一入口：Skill 和 Tool 都走 tool_use
    ├─→ L02 Tool Use     开闭原则：加 Skill 不改 dispatch map
    ├─→ L04 Subagent     上下文隔离：Skill 进入 Subagent messages
    ├─→ L06 Context Compact  tool_result 可压缩释放
    └─→ L07 Task System  Skill + 持久化
```

---

## 费曼检验速记

| 概念 | 类比 | 核心要点 |
|------|------|----------|
| 两层注入 | 垃圾分类 | 分类宣传单（导航）+ 垃圾桶上的具体说明（内容） |
| SkillLoader | 图书馆 | 索引卡片（meta）+ 书架上的书（body） |
| 容错性设计 | 驾考 | 小错扣分（兜底），闯红灯直接挂（暴露） |
| 注意力稀释 | 恋爱简介 | 100 页简介卡片 → 无法判断是否喜欢 |

**费曼检验通过项**：4/4（垃圾分类类比优秀）

---

## 自测问题（面试级）

1. **为什么两层注入？**
   <details>
   <summary>点击查看答案</summary>
   认知管理 + 生命周期控制 + 架构一致性。第一层是导航（常驻），第二层是内容（按需可释放）。不只是省 token，更是避免注意力稀释和为项目成长做准备。
   </details>

2. **Skill 和 Tool 有什么区别？**
   <details>
   <summary>点击查看答案</summary>
   职责不同：Skill 是"怎么做"的知识指引，Tool 是"做什么"的能力执行。机制相同：都走 dispatch map，统一入口原则。返回值不同：Skill 返回文本内容（注入 messages），Tool 返回执行结果。
   </details>

3. **容错性设计为什么不是"吞掉错误"？**
   <details>
   <summary>点击查看答案</summary>
   宽容有边界：高频轻后果（忘记写 frontmatter）兜底，低频重后果（写错 name）暴露。三层兜底是主动设计，不是 Python 默认行为。关键错误必须让用户知道。
   </details>

4. **注意力稀释具体怎么导致输出跑偏？**
   <details>
   <summary>点击查看答案</summary>
   Transformer 注意力权重归一化约束（总和=1）。无关内容权重低但累加会稀释核心任务权重。每个 token 生成时参考被稀释的权重，可能混入无关内容。例如：代码审查建议变成"先检查文件大小"（从 PDF Skill 污染）。
   </details>

5. **第一层可以放弃吗？为什么？**
   <details>
   <summary>点击查看答案</summary>
   可以放弃。第一层是导航辅助，第二层是本体。极端约束（1000 tokens）下，放弃第一层，用户显式请求"加载 git Skill"即可。导航可以省略，本体不能。
   </details>

---

## 复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| 2026-04-16 | 两层注入机制 + 上下文生命周期 | ⬜ |
| 2026-04-23 | 容错性设计原则 + 注意力稀释机制 | ⬜ |
| 2026-05-07 | 与 L06 Context Compact 的关系 | ⬜ |

---

## 核心格言

> *"用到什么知识，临时加载什么知识"*
>
> 两层注入的本质：第一层让模型知道有哪些，第二层按需给完整内容。
>
> 核心价值：认知管理 > 经济优化，架构一致性 > 短期省钱。