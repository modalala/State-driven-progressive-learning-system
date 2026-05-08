---
name: fastlearn-context-organization
description: |
  Fast Learn模式下的文件组织规范。
  定义原文、Context文件夹、产出文件的命名和位置规则。
  
  TRIGGER when: Fast Learn完成后需要组织文件、生成Context时
  Keywords: 文件组织, context, 原文移动, 命名规范, L-{lesson}
---

# Fast Learn Context 文件组织规范

## 核心原则

**一句话**：原文与Context统一存放，文件夹名与原文标题一致。

---

## 文件命名规则

### 规则1：文件夹名与原文标题一致

| 原文标题示例 | Context文件夹名 | 转换规则 |
|-------------|-----------------|----------|
| Claude Skills 入门：把"会用 AI"变成"可复制的工程能力".md | `L-SKILLS` | 取核心关键词，大写，加L前缀 |
| 为什么我不再相信「完美 Prompt」？.md | `L-PROMPT-TRAP` | 取核心关键词，大写，加L前缀 |

**转换步骤**：
1. 提取原文标题的核心关键词（1-2个单词）
2. 转换为大写
3. 添加 `L-` 前缀（表示Lesson）
4. 用 `-` 连接多个单词

---

## 目录结构规范

### 标准结构

```
.learning/{project}/
├── {原文标题}.md                    # 学习前：原文在根目录
│
└── .learning/                       # 学习后：组织到context下
    └── context/
        └── L-{KEYWORD}/              # 文件夹名与原文对应
            ├── {原文标题}.md          # 原文移动到此
            ├── README.md              # 知识总结
            ├── REVIEW.md              # 快速复习
            ├── flowchart.mermaid.md   # 流程图
            ├── mindmap.mermaid.md     # 思维导图
            └── {补充笔记}.md          # 学习过程中产生的补充知识
```

### 示例：Claude Skills

**学习前**：
```
.learning/temp-lean/
├── Claude Skills 入门：把"会用 AI"变成"可复制的工程能力".md
└── .learning/
    └── learning-state.json
```

**学习后**：
```
.learning/temp-lean/
└── .learning/
    ├── context/
    │   └── L-SKILLS/                  # 文件夹名：L + 核心关键词
    │       ├── Claude Skills 入门：把"会用 AI"变成"可复制的工程能力".md  # 原文移动到此
    │       ├── README.md              # 知识总结
    │       ├── REVIEW.md              # 快速复习
    │       ├── flowchart.mermaid.md   # 流程图
    │       ├── mindmap.mermaid.md     # 思维导图
    │       └── skill-verification-non-deterministic.md  # 补充笔记
    ├── learning-state.json
    └── skill-verification-non-deterministic.md  # 补充笔记也移动到context下
```

---

## 执行流程

### Step 1: 确定文件夹名

```
原文标题 → 提取关键词 → 大写 → 加L前缀 → L-{KEYWORD}
```

**示例**：
- 原文：`Claude Skills 入门：把"会用 AI"变成"可复制的工程能力".md`
- 关键词：Skills
- 文件夹名：`L-SKILLS`

---

### Step 2: 创建Context文件夹

```bash
mkdir -p ".learning/{project}/.learning/context/L-{KEYWORD}"
```

---

### Step 3: 移动原文

```bash
# 从根目录移动到context文件夹
mv ".learning/{project}/{原文标题}.md" ".learning/{project}/.learning/context/L-{KEYWORD}/{原文标题}.md"
```

**必须做**：
- 原文必须移动到对应的Context文件夹下
- 保持原文文件名不变（包括中文字符）

---

### Step 4: 移动补充笔记

```bash
# 学习过程中产生的补充笔记也移动到context文件夹
mv ".learning/{project}/.learning/{补充笔记}.md" ".learning/{project}/.learning/context/L-{KEYWORD}/{补充笔记}.md"
```

---

### Step 5: 生成Context文件

在Context文件夹下生成：
- `README.md`：知识总结
- `REVIEW.md`：快速复习
- `flowchart.mermaid.md`：流程图
- `mindmap.mermaid.md`：思维导图

---

## 命名冲突处理

| 场景 | 处理方式 |
|------|----------|
| 关键词冲突（多个原文关键词相同） | 加序号：`L-SKILLS-01`, `L-SKILLS-02` |
| 原文标题过长 | 取前2个关键词：`L-AGENT-LOOP` |
| 原文标题全英文 | 保持英文：`L-AGENT-LOOP` |

---

## 必须做（Must Do）

| 序号 | 规则 | 说明 |
|------|------|------|
| 1 | 文件夹名与原文对应 | `L-{KEYWORD}` 格式 |
| 2 | 原文移动到Context | 不留在根目录 |
| 3 | 保持原文文件名不变 | 包括中文字符 |
| 4 | 补充笔记移动到Context | 与原文同目录 |
| 5 | Context文件统一存放 | README/REVIEW/图表都在同一文件夹 |

---

## 必须不做（Must Not Do）

| 序号 | 禁止行为 | 原因 |
|------|----------|------|
| 1 | ❌ 原文留在根目录 | 破坏组织结构 |
| 2 | ❌ 修改原文文件名 | 可能导致引用失效 |
| 3 | ❌ 文件夹名与原文无关 | 无法追溯来源 |
| 4 | ❌ 补充笔记分散存放 | 不便于复习 |
| 5 | ❌ Context文件夹嵌套多层 | 保持扁平结构 |

---

## 与其他Skill的关系

| Skill | 触发时机 | 关系 |
|-------|----------|------|
| method4-fastLearn | Fast Learn执行 | 学习过程 |
| **fastlearn-context-organization** | Fast Learn完成后 | 文件组织 |
| fastlearn-flowchart-generator | 文件组织后 | 生成flowchart |

---

## 完整执行示例

### 输入

```
原文位置: .learning/temp-lean/Claude Skills 入门.md
补充笔记: .learning/temp-lean/.learning/skill-verification.md
```

### 执行

```bash
# 1. 确定文件夹名
关键词 = "SKILLS"
文件夹名 = "L-SKILLS"

# 2. 创建目录
mkdir -p ".learning/temp-lean/.learning/context/L-SKILLS"

# 3. 移动原文
mv ".learning/temp-lean/Claude Skills 入门.md" \
   ".learning/temp-lean/.learning/context/L-SKILLS/Claude Skills 入门.md"

# 4. 移动补充笔记
mv ".learning/temp-lean/.learning/skill-verification.md" \
   ".learning/temp-lean/.learning/context/L-SKILLS/skill-verification.md"

# 5. 生成Context文件（由其他skill完成）
# README.md, REVIEW.md, flowchart.mermaid.md, mindmap.mermaid.md
```

### 输出

```
.learning/temp-lean/
└── .learning/
    └── context/
        └── L-SKILLS/
            ├── Claude Skills 入门.md          # 原文
            ├── README.md                      # 知识总结
            ├── REVIEW.md                      # 快速复习
            ├── flowchart.mermaid.md           # 流程图
            ├── mindmap.mermaid.md             # 思维导图
            └── skill-verification.md          # 补充笔记
```

---

## 验收清单

Fast Learn完成后，检查以下内容：

| 检查项 | 标准 |
|--------|------|
| 文件夹名 | `L-{KEYWORD}` 格式，与原文关键词对应 |
| 原文位置 | 在 `context/L-{KEYWORD}/` 下 |
| 原文文件名 | 保持不变 |
| 补充笔记位置 | 与原文同目录 |
| Context文件 | README/REVIEW/图表齐全 |
| 根目录清理 | 原文已不在根目录 |