# Skills 目录

本目录包含 **Progressive Learning Coach** Skill 文件。

## 目录结构

```
skills/
└── progressive-learning-coach/        # 通用学习教练 Skill
    ├── SKILL.md                        # 核心协议
    └── references/                     # 参考文档
        ├── method1-mental-model.md    # 方法1：心智模型建构
        ├── method2-structured.md      # 方法2：结构化学习
        ├── method3-adversarial.md     # 方法3：对抗测试
        └── coach-instructions.md      # 教练行为准则
```

## 安装方法

### 方式1：手动复制到全局 Skills 目录

```bash
# Windows
xcopy /E /I skills\progressive-learning-coach %USERPROFILE%\.config\agents\skills\

# Mac/Linux
cp -r skills/progressive-learning-coach ~/.config/agents/skills/
```

### 方式2：使用 Kimi Code CLI 安装

```bash
# 如果支持 skill 安装命令
kimi skill install progressive-learning-coach
```

## 使用方法

1. **进入学习项目目录**（包含 `syllabus.yaml` 的项目）
2. **对 AI 说**："开始学习"
3. Skill 会自动读取课程大纲并引导学习

## Skill 职责

- ✅ 读取并解析 `syllabus.yaml`
- ✅ 管理 `.learning/learning-state.json`
- ✅ 执行方法1（心智模型建构）
- ✅ 执行方法2（结构化学习：SQ3R + 项目式 + KISS）
- ✅ 执行方法3（对抗测试：苏格拉底 + 反事实 + 漏洞注入）
- ✅ 管理课程进度和记忆存储
- ✅ 强制执行上下文隔离

## 与其他组件的关系

```
Progressive Learning Coach (Skill)
    ↓ 读取
syllabus.yaml (项目配置)
    ↓ 引用
lessons/*.md (课程内容)
    ↓ 生成/更新
.learning/learning-state.json (学习状态)
.learning/memory-store.json (记忆存储)
```

## 课程内容不在 Skill 中

**重要**：课程内容（`syllabus.yaml` 和 `lessons/*.md`）是项目资源，**不属于 Skill**。

这种分离设计的好处：
- Skill 可复用于任何学习项目
- 更换学习主题只需创建新的 syllabus
- 多人可以共享同一个 Skill，但各自有不同的课程内容

## 示例项目结构

```
my-learning-project/
├── syllabus.yaml              # 课程大纲
├── lessons/                   # 课程内容
│   ├── l0-topic.md
│   └── l1-topic.md
├── .learning/                 # 学习状态（自动生成）
│   ├── learning-state.json
│   └── memory-store.json
└── (其他项目文件)
```

## 开发说明

如果你想修改 Skill 的行为：

1. 编辑 `progressive-learning-coach/SKILL.md`
2. 重新复制到全局 skills 目录
3. 测试新行为

如果你想创建新的课程：

1. **不要修改 Skill**
2. 在项目根目录创建 `syllabus.yaml`
3. 在 `lessons/` 目录创建课程内容
4. 使用 Skill 进行学习
