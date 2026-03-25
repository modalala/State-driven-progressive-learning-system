# 项目结构说明

## 文件树

```
State-driven-progressive-learning-system/
│
├── 📦 package.json                          # NPM 配置（支持 npx 安装）
│
├── 📁 bin/                                  # 🆕 脚手架脚本
│   └── init.js                             # 交互式项目初始化
│
├── 📁 skills/                               # Skill 核心（npm 打包内容）
│   └── progressive-learning-coach/
│       ├── SKILL.md                        # 主协议
│       └── references/                     # 运行时参考
│           ├── method1-mental-model.md
│           ├── method2-structured.md
│           ├── method3-adversarial.md
│           ├── coach-instructions.md
│           ├── state-machine.md            # 🆕 状态机规则
│           └── memory-schema.md            # 🆕 存储规范
│
├── 📁 templates/                            # 🆕 项目模板
│   └── default/
│       ├── syllabus.yaml                   # 课程大纲模板
│       ├── README.md                       # 项目 README 模板
│       └── lessons/                        # 课程模板
│           ├── l0-basics.md
│           ├── l1-advanced.md
│           └── l2-practice.md
│
├── 📁 examples/                             # 示例项目
│   ├── agent-architecture-learning/
│   │   ├── syllabus.yaml
│   │   ├── README.md
│   │   ├── learning-state.example.json     # 状态示例
│   │   ├── memory-store.example.json       # 记忆示例
│   │   └── lessons/
│   │       ├── l0-agent-essence.md
│   │       ├── l1-cognitive-architecture.md
│   │       └── l2-memory-system.md
│   │
│   └── claude-harness-learning/            # 🆕 Claude Harness 学习示例
│       ├── syllabus.yaml
│       ├── README.md
│       ├── l0-closeout-summary.md
│       ├── lessons/
│       │   ├── l0-claude-foundations.md
│       │   ├── l1-tool-use-and-harness.md
│       │   └── l2-skills-context-and-subagents.md
│       └── resources/
│           ├── code-snippets/
│           ├── documents/
│           └── metadata.yaml
│
├── 📁 docs/                                 # 开发文档（不打包）
│   ├── architecture-redesign.md
│   ├── integration-test-plan.md
│   ├── memory-schema.md
│   ├── prompts/
│   │   ├── method-1-mental-model.md
│   │   ├── method-2-structured-learning.md
│   │   └── method-3-adversarial-testing.md
│   └── ...
│
└── 📁 .skills/                              # 可视化 Skills（第三方）
    ├── excalidraw-diagram/
    ├── mermaid-visualizer/
    └── obsidian-canvas-creator/
```

## 新增内容（Phase 1）

| 文件/目录 | 说明 |
|-----------|------|
| `package.json` | NPM 配置，支持 `npm install` 和 `npx` |
| `templates/default/` | 项目模板，快速创建新学习项目 |
| `SKILL.md` 状态初始化 | 新增完整的状态初始化流程说明 |
| `SKILL.md` 状态更新规则 | 新增 TODO 完成、课程完成、脆弱点记录规则 |
| `references/state-machine.md` | 状态机规则参考 |
| `references/memory-schema.md` | 存储规范参考 |

## 使用方式

### 安装 Skill

```bash
# NPM 安装（发布后）
npm install -g progressive-learning-coach

# 或手动复制
cp -r skills/progressive-learning-coach ~/.config/agents/skills/
```

### 创建新项目

```bash
# 使用模板（待实现脚手架）
npx progressive-learning-coach init my-project

# 或手动复制模板
cp -r templates/default my-project
```

### 开始学习

```bash
cd my-project
# 对 AI 说："开始学习"
```

## Skill 核心功能

1. **读取 syllabus.yaml** - 解析课程大纲
2. **初始化状态** - 创建 `.learning/` 目录和状态文件
3. **执行三种学习方法** - 方法1/2/3 教学协议
4. **管理学习状态** - 实时保存进度
5. **边界控制** - 上下文隔离、TODO 渐进披露
