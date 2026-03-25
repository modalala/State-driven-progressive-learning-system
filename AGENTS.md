# State-driven Progressive Learning System

## 项目概述

这是一个关于**AI驱动的个性化学习系统**的文档项目。项目记录了一个基于状态机架构设计的渐进式学习方法论，专门针对 **LLM Agent Architecture（大语言模型智能体架构）** 领域的学习。

### 核心概念

该系统结合了多种学习理论和实践方法：

1. **金字塔原理** - 将知识分层结构化，从核心概念到细节实现
2. **三种学习方法论**：
   - 方法1：心智地图构建（识别专家共识与分歧）
   - 方法2：结构化流程管理（SQ3R + 项目式学习）
   - 方法3：对抗性压力测试（苏格拉底诘问 + 反事实验证）
3. **渐进式披露** - 类似SubAgent的上下文隔离，按需展示学习内容
4. **状态驱动** - 通过全局状态管理课程进度和知识掌握度

## 目录结构

```
D:\code\State-driven-progressive-learning-system\
├── README.md          # 项目标题和简介（双语）
├── AGENTS.md          # 本文件 - 项目上下文说明
└── talk_record.md     # 对话记录 - 系统设计的完整讨论
```

## 关键文件说明

### talk_record.md
**最重要的文件**，包含完整的系统设计讨论：

- **学习方法设计**：三种互补的学习方法详细描述
- **系统架构**：三层状态金字塔（Master Orchestrator / Lesson SubAgent / Memory Store）
- **课程大纲**：LLM Agent Architecture领域的12个课程模块（L0-L11）
- **Prompt模板**：Master Agent和Lesson SubAgent的具体提示词设计
- **记忆管理规范**：JSON格式的状态存储结构

### README.md
项目的基础说明文件，包含中英文标题：
- 英文：State-driven-progressive-learning-system
- 中文：状态驱动的渐进式学习系统

## 项目用途

本项目的目的是：

1. **记录学习系统的设计方案** - 保存与AI助手关于学习方法的完整讨论
2. **作为未来开发的参考** - 如果要将这个学习系统实现为Skill或应用程序，这些文档是需求规格
3. **个人学习管理** - 用户可以使用这里设计的课程大纲和Prompt模板来指导自己的学习过程

## 如何使用

这是一个**非代码项目**，主要内容是设计文档。使用方式：

1. **阅读talk_record.md** - 了解完整的学习系统设计理念
2. **参考课程大纲** - 按照L0-L11的12个模块学习LLM Agent Architecture
3. **使用Prompt模板** - 将文中设计的Master Agent和Lesson SubAgent Prompt用于实际的AI对话
4. **管理学习状态** - 使用文档中定义的JSON格式跟踪学习进度

## 课程大纲概览

| 课程ID | 模块主题 |
|--------|---------|
| L0 | Meta-Cognition: Agent 本质论 |
| L1 | 认知架构：ReAct vs Reflexion |
| L2 | 记忆系统：从短期到长期 |
| L3 | 工具调用：Function Calling 的边界 |
| L4 | 规划能力：从单步到多步推理 |
| L5 | 多 Agent 协作：竞争与共识 |
| L6 | 安全与对齐：护栏设计 |
| L7 | 评估体系：如何证明 Agent 有效 |
| L8 | 工程化：从 Prompt 到 Production |
| L9 | 前沿范式：Agent-as-a-Judge / Voyager |
| L10 | 综合实战：构建你的垂直领域 Agent |
| L11 | 复盘与范式迁移 |

## 技术说明

- **项目类型**：文档/设计规范
- **无代码文件**：本项目不包含源代码、构建脚本或依赖配置
- **无运行要求**：无需安装任何环境或运行命令
- **纯文本内容**：Markdown格式，可在任何文本编辑器中查看

## 相关资源

文档中提到了以下外部资源：
- Skill Marketplace (https://skillsmp.com) - 用于查找相关的Agent Skills
- Playbooks.com - 金字塔原理相关的Skill
- LobeHub Skills Marketplace - 数据叙事Skill

---

**注意**：本项目是一个学习系统的设计文档集合，而非可运行的软件项目。核心内容都在 `talk_record.md` 中。
