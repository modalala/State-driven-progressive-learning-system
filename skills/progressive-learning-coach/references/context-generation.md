# Context 生成参考文档

本文档是 Context 生成的入口索引，具体内容在子目录中。

---

## 快速执行指南

AI执行Context生成时，请先阅读：

| 文档 | 内容 | 何时阅读 |
|------|------|----------|
| **`context-generation/EXECUTION.md`** | 执行指令、输入输出、格式约束 | 必读（每次生成前） |
| **`context-generation/templates.md`** | 输出模板字段定义 | 必读（生成输出时） |
| **`context-generation/IMPLEMENTATION.md`** | 正则规则、Python示例、完整YAML | 可选（开发者参考） |

---

## Context 三大目标

Context 的设计围绕三个核心目标展开：

### 1. 心智模型构建

**目标**：帮助学生建立领域专家的思维框架，形成系统化的认知结构。

| 维度 | 说明 | 实现方式 |
|------|------|----------|
| 概念网络 | 构建概念之间的关联关系 | 通过核心概念定义和依赖映射 |
| 专家视角 | 理解领域专家如何看待问题 | 展示专家共识与分歧点 |
| 思维模式 | 掌握专家解决问题的思路 | 深度测试问题引导思考 |
| 迁移能力 | 将知识应用到新情境 | 跨领域类比和变体练习 |

### 2. 结构化流程管理

**目标**：通过标准化的学习流程确保学习的完整性和可追溯性。

| 方法 | 阶段 | 说明 |
|------|------|------|
| SQ3R | Survey → Question → Read → Recite → Review | 系统化的阅读理解流程 |
| 项目式学习 | 定义 → 规划 → 执行 → 交付 | 实践驱动的学习方式 |
| KISS 复盘 | Keep → Improve → Start → Stop | 持续改进的反思机制 |

### 3. 对抗性压力测试

**目标**：暴露认知盲区，验证理解深度，确保知识的稳健性。

| 测试类型 | 目的 | 实现方式 |
|----------|------|----------|
| 脆弱点测试 | 识别理解薄弱环节 | 历史错误回顾 + 预测性诊断 |
| 反事实推理 | 验证因果理解 | "如果...会怎样"情境 |
| 漏洞注入 | 测试边界条件 | 刻意引入错误检测 |
| 矛盾检测 | 发现认知冲突 | 对立观点对比分析 |

---

## 输出产物概览

| 文件 | 生成时机 | 内容 |
|-----|---------|-----|
| `README.md` | 每次更新 | 知识总结（心智模型+结构化学习+对抗测试） |
| `REVIEW.md` | 课程完成时 | 快速复习文档 |
| `flowchart.mermaid.md` | SQ3R状态变化时 | 学习流程图 |
| `mindmap.mermaid.md` | 核心概念变化时 | 概念思维导图 |
| `context-meta.yaml` | 每次更新 | 增量更新元数据 |

---

## 内容来源速查

| Context内容 | 数据来源 |
|------------|---------|
| 核心概念 | `syllabus.yaml` → `core_points` |
| 概念定义 | `lessons/*.md` |
| SQ3R状态 | `.learning/learning-state.json` |
| 脆弱点 | `.learning/memory-store.json` → `fragile_points` |
| KISS复盘 | `.learning/memory-store.json` → `kiss_reviews` |

详细映射见 `IMPLEMENTATION.md` 第2节。

---

## 与其他流程的关联

### lesson-transition.md

课程完成时的调用顺序：
1. 生成结束总结（lesson-transition Step 1）
2. 生成 REVIEW.md（lesson-transition Step 2）
3. 生成 README.md + flowchart + mindmap（本流程）

### SKILL.md

触发条件定义：
- 用户说"生成 context" → 手动触发
- 课程完成 → 自动触发

---

详细执行流程和模板定义，请阅读子目录中的对应文件。