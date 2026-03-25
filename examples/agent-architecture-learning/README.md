# LLM Agent Architecture 学习项目

这是一个使用 **Progressive Learning Coach** Skill 的学习项目示例。

## 课程概览

| 课程 | 主题 | TODO 数 | 预计时间 |
|-----|------|--------|---------|
| L0 | Agent 本质论 | 5 | 2h |
| L1 | 认知架构 | 7 | 3h |
| L2 | 记忆系统 | 6 | 3h |

**总预计时间**：约 8 小时

## 前置要求

已安装 `progressive-learning-coach` Skill：

```bash
# 从主项目复制 Skill
cp -r ../../skills/progressive-learning-coach ~/.config/agents/skills/
```

## 开始学习

```bash
# 在本目录下
# 对 AI 说："开始学习"
```

Skill 会自动读取 `syllabus.yaml` 并引导学习流程。

## 课程文件

- `syllabus.yaml` - 课程大纲配置
- `lessons/l0-agent-essence.md` - L0: Agent 本质论
- `lessons/l1-cognitive-architecture.md` - L1: 认知架构
- `lessons/l2-memory-system.md` - L2: 记忆系统

## 学习状态

学习过程中会自动生成 `.learning/` 目录：
- `learning-state.json` - 学习进度
- `memory-store.json` - 心智模型和脆弱点

## 作为模板使用

你可以复制本项目作为其他主题的学习模板：

```bash
# 复制示例
cp -r examples/agent-architecture-learning my-python-learning

# 修改内容
cd my-python-learning
# 编辑 syllabus.yaml 和 lessons/*.md

# 开始学习
# 对 AI 说："开始学习"
```

只需修改 `syllabus.yaml` 和 `lessons/` 中的内容，Skill 会自动适配新的课程。
