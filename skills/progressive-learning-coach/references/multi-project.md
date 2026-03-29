# 多项目管理

## 全局命令

| 用户输入 | 动作 |
|---------|------|
| "列出学习项目" / "项目列表" | 显示所有已注册项目 |
| "切换项目 {name}" / "学习 {name}" | 切换到指定项目 |
| "查看学习统计" / "统计汇总" | 显示跨项目统计 |
| "注册当前项目" | 将当前目录注册为学习项目 |
| "新建学习项目" | 创建并注册新项目 |

## 项目选择菜单

当用户在非项目目录说 "开始学习"：

```
📚 你有以下学习项目：

  #   项目              状态      进度
  1   Agent 架构学习    active    25%
  2   Python 基础      paused    0%
  3   Rust 进阶       active    60%

选择操作：
- 输入数字 [1-3] 继续学习
- 输入 'n' 创建新项目
- 输入 's' 查看统计汇总

请选择: _
```

## 多项目检测流程

```
用户: "开始学习"
    ↓
检测当前目录
    ├─ 有 syllabus.yaml → 单项目模式
    │   └─ 正常学习流程
    │
    └─ 无 syllabus.yaml → 检查 .skill/registry.json
        ├─ 无注册表 → 首次使用引导
        │   └─ 创建注册表 + 创建项目
        │
        ├─ 有注册表 → 展示项目列表
        │   ├─ 选择现有项目 → 切换目录 + 继续
        │   └─ 选择新建 → 创建 + 注册
        │
        └─ 用户指定项目名 → 直接切换
```

---

## 上下文管理

### 核心原则

切换项目时：
- **不清除**：学习进度（learning-state.json）、记忆内容（memory-store.json）、课程完成状态
- **重新加载**：目标项目的 syllabus、resources、learning-state

### 上下文切换流程

```
用户: "切换到 python-basics"

检测当前项目 ≠ 目标项目
    ↓
提示用户:
    "切换到「Python基础」学习项目？
     注意：将重新加载新项目的资源和课程内容。
     你之前的学习进度和记忆都已保存在原项目中，随时可以继续。"
    ↓
用户确认 → 上下文切换流程:
    1. 保存当前项目的进度状态（如有未完成的 TODO）
    2. 清除 agent 当前上下文（释放旧资源引用）
    3. 加载目标项目的 syllabus.yaml
    4. 加载目标项目的 resources/metadata.yaml
    5. 加载目标项目的 learning-state.json（恢复进度）
    6. 更新 .skill/context.json 的 active_project
    ↓
继续学习，从目标项目的上次进度开始
```

### 上下文状态文件

文件位置：`.skill/context.json`

```json
{
  "version": "1.0.0",
  "active_project": "agent-learning",
  "context": {
    "loaded_resources": ["agent-learning/resources/metadata.yaml"],
    "loaded_syllabus": "agent-learning/syllabus.yaml",
    "loaded_state": "agent-learning/.learning/learning-state.json",
    "session_start": "...",
    "pending_todo": null
  },
  "last_switch": "...",
  "switch_history": [...]
}
```

### 结合项目学习

用户明确说 "结合项目A和项目B" 时：
- 不清空记忆
- 合并两个项目的 resources/metadata.yaml
- Skill 同时引用两个项目的资源
- 创建临时联合上下文

### 状态同步

每次学习会话结束时：

1. 更新项目的 `.learning/learning-state.json`
2. 同步更新 `.skill/registry.json` 中的项目状态
3. 更新统计汇总

```json
// 同步到 registry.json 的字段
{
  "status": {
    "global_status": "...",
    "current_lesson": "...",
    "progress_percentage": "...",
    "last_session": "...",
    "total_study_time_minutes": "..."
  }
}
```

### 跨项目统计

```
用户: "查看学习统计"

Skill:
📊 跨项目学习统计

总项目数: 3
活跃项目: 2
总学习时间: 12.5 小时
总完成 TODO: 45
总完成课程: 5

学习时间分布:
- Agent 架构: 8.5 小时 (68%)
- Rust 进阶: 4 小时 (32%)

最近7天学习时间:
[柱状图]
```