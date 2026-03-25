# 我的学习项目

使用 Progressive Learning Coach Skill 的学习项目。

## 课程概览

| 课程 | 主题 | TODO 数 | 预计时间 |
|-----|------|--------|---------|
| L0 | 基础概念 | 4 | 3h |
| L1 | 进阶主题 | 5 | 4h |
| L2 | 实战应用 | 3 | 3h |

**总预计时间**：约 10 小时

## 开始学习

确保已安装 Skill：

```bash
# 全局安装 Skill
npm install -g progressive-learning-coach
# 或复制到 skills 目录
cp -r path/to/progressive-learning-coach/skills/progressive-learning-coach ~/.config/agents/skills/
```

在本目录下对 AI 说：

```
开始学习
```

## 项目结构

```
.
├── syllabus.yaml          # 课程大纲配置
├── lessons/               # 课程内容
│   ├── l0-basics.md
│   ├── l1-advanced.md
│   └── l2-practice.md
└── .learning/             # 学习状态（自动生成）
    ├── learning-state.json
    └── memory-store.json
```

## 自定义内容

编辑以下文件来自定义你的学习项目：

1. **syllabus.yaml**
   - 修改 `meta.domain` 和 `meta.domain_cn`
   - 调整 `syllabus` 中的课程列表
   - 修改 `core_points`

2. **lessons/*.md**
   - 修改学习目标
   - 自定义 TODO 内容
   - 更新对抗测试题库
   - 添加你的学习资源

## 程度分级

- 🔴 **核心点**：必须掌握，对抗测试必须通过
- 🟠 **重点**：重要参考，能复述核心思想
- 🟡 **了解**：开阔视野，知道存在即可

## 学习方法

本 Skill 使用三种学习方法：

1. **心智模型建构**（20%）：专家共识 + 分歧探讨 + 深度测试
2. **结构化学习**（50%）：SQ3R + 项目式学习 + KISS复盘
3. **对抗测试**（30%）：苏格拉底诘问 + 反事实情境 + 漏洞注入
