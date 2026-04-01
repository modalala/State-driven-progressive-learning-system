# 状态机规则参考

## 状态定义

| 状态 | 说明 | 图标 | 进入条件 |
|-----|------|------|---------|
| `locked` | 锁定，前置课程未完成 | 🔒 | 初始化或前置未完成 |
| `unlocked` | 已解锁但未开始 | 🔓 | 前置课程 completed |
| `in_progress` | 进行中 | 📖 | 用户触发"开始" |
| `suspended` | 暂停（用户主动） | ⏸️ | 用户触发"暂停" |
| `completed` | 已完成 | ✅ | 所有 TODO 完成 |
| `review_needed` | 需复习（艾宾浩斯） | 🔄 | 到达复习时间点 |
| `challenged` | 挑战中（有严重脆弱点） | ⚠️ | 对抗测试发现问题 |

## 状态转换图

```
                    开始
                     ↓
locked ──前置完成──→ unlocked ───────────────→ in_progress
    ↑                      ↑                      │
    │                      │         ┌───────────┼──完成──→ completed
    │                      │         │           │           │
    │                      └──暂停────┤     suspended         │
    │                                │           ↑             │
    │                                └──恢复─────┘             │
    │                                                          │
    └──重新锁定（如需）                                         ├──复习完成──┘
                    ↑                                          │
                    └──复习时间到──→ review_needed ────────────┘

completed ──艾宾浩斯──→ review_needed ──复习完成──→ completed

in_progress ──发现问题──→ challenged ──修复完成──→ in_progress
```

## 状态转换规则

| 从状态 | 事件 | 到状态 | 条件 |
|--------|------|--------|------|
| locked | 前置课程完成 | unlocked | 所有 prerequisites 状态为 completed |
| unlocked | 用户说"开始" | in_progress | - |
| in_progress | 所有 TODO 完成 | completed | todos_completed == todos_total |
| in_progress | 用户说"暂停" | suspended | - |
| suspended | 用户说"继续" | in_progress | - |
| completed | 到达复习时间 | review_needed | 根据艾宾浩斯曲线计算 |
| review_needed | 用户完成复习 | completed | - |
| in_progress | 对抗测试发现问题 | challenged | 存在 critical 脆弱点 |
| challenged | 问题修复 | in_progress | 脆弱点状态变为 resolved |

## 艾宾浩斯复习时间点

根据艾宾浩斯遗忘曲线，在以下时间点（相对于完成时刻）标记 review_needed：

| 时间点 | 描述 |
|--------|------|
| 20 分钟 | 立即复习 |
| 1 小时 | 短期复习 |
| 9 小时 | 当天复习 |
| 1 天 | 次日复习 |
| 2 天 | 短期巩固 |
| 6 天 | 中期复习 |
| 31 天 | 长期巩固 |

## 优先级处理

当存在多个状态标记时，按以下优先级显示：

1. **challenged** - 最高优先级，有问题需要修复
2. **review_needed** - 需要复习
3. **in_progress** / **suspended** - 继续学习
4. **completed** - 已完成
5. **unlocked** - 可开始
6. **locked** - 最低优先级，未解锁

## JSON 状态示例

### 初始状态

```json
{
  "learning_state": {
    "current_lesson": "L0",
    "global_status": "active"
  },
  "syllabus_progress": {
    "L0": {"status": "unlocked"},
    "L1": {"status": "locked"}
  }
}
```

### 进行中

```json
{
  "syllabus_progress": {
    "L0": {
      "status": "in_progress",
      "todos_completed": 2,
      "todos_total": 5,
      "current_todo_id": "todo-3"
    }
  }
}
```

### 已完成

```json
{
  "syllabus_progress": {
    "L0": {
      "status": "completed",
      "completed_at": "2026-03-19T16:00:00",
      "mastery_score": 0.9
    }
  }
}
```

## 错误处理

| 场景 | 处理 |
|------|------|
| 状态字段缺失 | 默认为 locked |
| 状态值非法 | 回退到 locked，记录警告 |
| 状态不一致 | 以实际进度为准（todos_completed） |
| 时间戳格式错误 | 忽略，使用当前时间 |
