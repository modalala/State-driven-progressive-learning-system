# 项目结构说明

## 文件树

```
State-driven-progressive-learning-system/
│
├── 📦 package.json                          # NPM 配置
│
├── 📁 bin/                                  # 脚手架脚本
│   ├── cli.js                               # 🆕 CLI 命令入口 (plc)
│   ├── init.js                              # 项目初始化（智能引导版）
│   ├── registry.js                          # 🆕 本地注册表管理
│   ├── context.js                           # 🆕 上下文状态管理
│   └── commands/                            # 🆕 子命令
│       ├── list.js                          # 项目列表
│       ├── switch.js                        # 项目切换
│       ├── status.js                        # 项目状态
│       ├── current.js                       # 当前项目名称
│       ├── resume.js                        # 继续学习
│       └── register.js                      # 注册外部项目
│
├── 📁 skills/                               # Skill 核心（npm 打包内容）
│   └── progressive-learning-coach/
│       ├── SKILL.md                         # 主协议
│       └── references/                      # 运行时参考
│           ├── method1-mental-model.md
│           ├── method2-structured.md
│           ├── method3-adversarial.md
│           ├── coach-instructions.md
│           ├── state-machine.md             # 状态机规则
│           ├── todo-disclosure.md           # TODO 渐进披露
│           ├── user-resources.md            # 用户资源处理
│           ├── memory-schema.md             # 存储规范
│           └── context-management.md        # 🆕 上下文管理
│
├── 📁 templates/                            # 项目模板
│   └── default/
│       ├── syllabus.yaml                    # 课程大纲模板
│       ├── README.md                        # 项目 README 模板
│       └── lessons/                         # 课程模板
│           ├── l0-basics.md
│           ├── l1-advanced.md
│           └── l2-practice.md
│
├── 📁 examples/                             # 示例项目
│   ├── agent-architecture-learning/
│   │   ├── syllabus.yaml
│   │   ├── README.md
│   │   └── lessons/
│   │       ├── l0-agent-essence.md
│   │       ├── l1-cognitive-architecture.md
│   │       └── l2-memory-system.md
│   │
│   └── claude-harness-learning/
│       ├── syllabus.yaml
│       ├── README.md
│       ├── lessons/
│       └── resources/
│           ├── code-snippets/
│           ├── documents/
│           └── metadata.yaml
│
├── 📁 docs/                                 # 开发文档（不打包）
│   ├── architecture-redesign.md
│   ├── memory-schema.md                     # 🆕 包含 registry/context schema
│   ├── ROADMAP.md
│   └── ...
│
└── 📁 .skills/                              # 可视化 Skills（第三方）
    ├── excalidraw-diagram/
    ├── mermaid-visualizer/
    └── obsidian-canvas-creator/
```

## 新增内容（多项目管理）

| 文件/目录 | 说明 |
|-----------|------|
| `bin/cli.js` | CLI 命令入口，支持 plc 命令 |
| `bin/registry.js` | 本地注册表管理，项目发现和注册 |
| `bin/context.js` | 上下文状态管理，项目切换隔离 |
| `bin/commands/` | 子命令实现（list/switch/status 等） |
| `bin/init.js` | 改造为智能引导版（首次/已有区分） |
| `references/context-management.md` | 上下文管理参考文档 |
| `SKILL.md` | 新增多项目管理章节和激活条件 |

## 用户项目结构（多项目布局）

```
用户工作目录/
├── 📁 .skill/                               # 🆕 本地项目管理
│   ├── registry.json                        # 项目注册表
│   └── context.json                         # 上下文状态
│
├── 📁 agent-learning/                       # 学习项目A
│   ├── syllabus.yaml                        # 课程大纲
│   ├── lessons/                             # 课程内容
│   ├── resources/                           # 学习资源
│   │   ├── metadata.yaml                    # 资源索引
│   │   ├── code-snippets/
│   │   ├── documents/
│   │   └── images/
│   └── .learning/                           # 学习状态
│       ├── learning-state.json              # 学习进度（永久保留）
│       └── memory-store.json                # 学习记忆（永久保留）
│
└── 📁 python-basics/                        # 学习项目B
    ├── syllabus.yaml
    ├── lessons/
    ├── resources/
    └── .learning/
        ├── learning-state.json
        └── memory-store.json
```

## 使用方式

### 安装 Skill

```bash
# NPM 安装
npm install -g progressive-learning-coach

# 或手动复制
cp -r skills/progressive-learning-coach ~/.config/agents/skills/
```

### CLI 命令

```bash
# 创建新项目（智能引导）
plc init [项目名]

# 列出所有项目
plc list [-v]

# 切换项目（上下文隔离）
plc switch <项目名>

# 查看项目状态
plc status [项目名]

# 显示当前项目
plc current

# 继续学习
plc resume

# 注册外部项目
plc register <项目路径>
```

### 多项目管理

```bash
# 首次创建项目
$ plc init

🎓 Progressive Learning Coach

检测到这是第一次使用...

请输入新项目名称: agent-learning
...

# 已有项目时
$ plc init

🎓 Progressive Learning Coach

当前目录已有 2 个学习项目:

  #   项目名称          状态      进度
  1   agent-learning   active    25%
  2   python-basics    paused    0%

选择操作:
  [1-2] 切换到该项目
  [n]   创建新项目
  [c]   继续当前项目学习
```

### 项目切换（上下文隔离）

```bash
$ plc switch python-basics

🔄 切换项目

当前项目: agent-learning (25% 进度)
目标项目: python-basics (0% 进度)

切换后：
- agent-learning 的学习进度和记忆已保存
- 将重新加载 python-basics 的资源和课程内容

确认切换? [y/N]: y

✅ 已切换到 python-basics
```

## Skill 核心功能

1. **读取 syllabus.yaml** - 解析课程大纲
2. **初始化状态** - 创建 `.learning/` 目录和状态文件
3. **执行三种学习方法** - 方法1/2/3 教学协议
4. **管理学习状态** - 实时保存进度
5. **多项目管理** - 🆕 项目注册、切换、上下文隔离
6. **上下文管理** - 🆕 切换项目时保留进度，清除运行时上下文
7. **边界控制** - TODO 渐进披露、资源隔离

## 上下文隔离原则

切换项目时：
- **不清除**：学习进度、记忆内容、课程完成状态
- **重新加载**：目标项目的 syllabus、resources、learning-state

这确保了每个项目的学习数据永久保留，同时避免上下文混淆。