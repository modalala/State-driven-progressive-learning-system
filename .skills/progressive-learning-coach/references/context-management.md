# 上下文管理参考

本文档详细说明多项目管理中的上下文隔离和切换机制。

## 核心概念

### 什么是上下文？

上下文是 agent 运行时的状态，包括：
- 当前加载的 syllabus.yaml
- 当前加载的 resources/metadata.yaml
- 当前加载的 learning-state.json
- 会话开始时间
- 待处理的 TODO

### 上下文 vs 项目数据

| 类型 | 内容 | 切换项目时 |
|------|------|-----------|
| **上下文** | agent 运行时状态 | 清除并重新加载 |
| **项目数据** | learning-state.json, memory-store.json | 永久保留 |

**重要原则**：切换项目时不清除项目数据，只清除上下文。

## 上下文文件结构

文件位置：`.skill/context.json`

```json
{
  "version": "1.0.0",
  "active_project": "agent-learning",
  "context": {
    "loaded_resources": [
      "agent-learning/resources/metadata.yaml"
    ],
    "loaded_syllabus": "agent-learning/syllabus.yaml",
    "loaded_state": "agent-learning/.learning/learning-state.json",
    "session_start": "2026-03-29T10:00:00",
    "pending_todo": "TODO-2"
  },
  "last_switch": "2026-03-29T10:00:00",
  "switch_history": [
    {
      "from": null,
      "to": "agent-learning",
      "timestamp": "2026-03-29T10:00:00"
    }
  ],
  "previous_project": null
}
```

## 切换流程详解

### Step 1: 检测切换请求

用户输入触发切换的情况：
- "切换到 {项目名}"
- "学习 {项目名}"
- 从项目列表选择数字

### Step 2: 验证目标项目

```javascript
// 检查项目是否存在于注册表
const targetProject = registry.getProject(projectName);
if (!targetProject) {
  return error("项目不存在");
}

// 检查是否是当前项目
if (targetProject.name === currentProject.name) {
  return info("已经是当前项目");
}
```

### Step 3: 提示用户确认

```
切换到「Python基础」学习项目？

当前项目: Agent 架构学习 (25% 进度)
目标项目: Python 基础 (0% 进度)

切换后：
- Agent 架构学习 的学习进度和记忆已保存
- 将重新加载 Python 基础 的资源和课程内容

确认切换? [y/N]:
```

### Step 4: 执行上下文切换

```javascript
// 1. 清除当前上下文（不清除项目数据）
context.clearContext();

// 2. 加载新项目上下文
context.loadProjectContext(targetProject.path);

// 3. 更新注册表的活跃项目
registry.setActiveProject(targetProject.name);

// 4. 记录切换历史
context.recordSwitch(from, to);
```

### Step 5: 确认切换结果

```
✅ 已切换到: Python 基础
📂 项目路径: ./python-basics
📍 当前课程: L0

下一步: 对 AI 说 "继续学习"
```

## 结合项目学习

### 触发条件

用户明确说：
- "结合项目A和项目B"
- "同时学习A和B"
- "合并A和B的资源"

### 处理方式

```javascript
// 创建联合上下文
const combinedContext = {
  active_project: "combined:A+B",
  context: {
    loaded_resources: [
      "project-a/resources/metadata.yaml",
      "project-b/resources/metadata.yaml"
    ],
    loaded_syllabus: "project-a/syllabus.yaml", // 主项目
    combined_syllabus: "project-b/syllabus.yaml" // 辅助项目
  }
};
```

### 资源合并规则

1. 两个项目的 resources/metadata.yaml 合并
2. 资源 ID 添加项目前缀避免冲突
3. Skill 可以引用任一项目的资源

## 状态同步

### 同步时机

- TODO 完成时
- 课程完成时
- 会话结束时
- 项目切换前

### 同步内容

```javascript
// 从项目的 learning-state.json 同步到 registry
registry.syncProjectStatus(projectName);

// 更新的字段
{
  status: {
    global_status: state.learning_state.global_status,
    current_lesson: state.learning_state.current_lesson,
    progress_percentage: calculateProgress(state),
    todos_completed: state.statistics.todos_completed,
    todos_total: state.statistics.todos_total,
    total_study_time_minutes: state.statistics.total_study_time_minutes,
    last_session: state.learning_state.last_session
  }
}
```

## 错误处理

### 项目不存在

```
项目 "unknown-project" 不存在。

可用项目:
  - agent-learning
  - python-basics
```

### 项目无效（缺少必要文件）

```
项目 "incomplete" 缺少必要文件：
  - syllabus.yaml 不存在

请检查项目目录结构。
```

### 上下文加载失败

```
加载项目上下文失败：无法读取 syllabus.yaml

可能原因：
1. 文件权限问题
2. 文件格式错误
3. 文件被占用

请手动检查项目目录。
```

## CLI 命令

### plc list

列出所有项目，显示当前上下文状态。

### plc switch \<name\>

切换项目，显示确认提示。

### plc status

显示当前项目的详细状态和上下文信息。

### plc current

仅显示当前活跃项目名称。

### plc resume

继续当前项目学习，更新上下文会话时间。

## 实现参考

相关模块：
- `bin/context.js` - 上下文管理模块
- `bin/registry.js` - 注册表管理模块
- `bin/commands/switch.js` - 切换命令实现