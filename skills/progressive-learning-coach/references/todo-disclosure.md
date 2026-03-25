# TODO 渐进披露机制

## 核心概念

**渐进披露**：学生只能看到**当前激活的 TODO**，完成后才展示下一个。

## 当前 TODO 判定算法

```python
def get_current_todo(lesson_id, state):
    """
    根据状态确定当前应该展示的 TODO
    
    参数:
        lesson_id: 课程 ID (如 "L0")
        state: learning-state.json 的内容
    
    返回:
        current_todo_id: 当前 TODO ID (如 "todo-3")
        或 None (如果所有 TODO 完成)
    """
    lesson_state = state['syllabus_progress'][lesson_id]
    todos_total = lesson_state['todos_total']
    todos_completed = lesson_state.get('todos_completed', 0)
    
    if todos_completed >= todos_total:
        return None  # 所有 TODO 完成
    
    # 当前 TODO 序号 = 已完成数 + 1
    current_todo_number = todos_completed + 1
    current_todo_id = f"todo-{current_todo_number}"
    
    return current_todo_id
```

## 筛选逻辑

### 输入

- `lesson_content`: 课程内容文件（如 `l0-agent-essence.md`）
- `current_todo_id`: 当前 TODO ID（如 "todo-3"）

### 处理流程

```python
def render_todo_view(lesson_content, current_todo_id):
    """
    渲染学生可见的 TODO 视图
    """
    all_todos = parse_todos_from_markdown(lesson_content)
    
    result = {
        'completed': [],      # 已完成的 TODO（仅显示标题）
        'current': None,      # 当前 TODO（显示完整内容）
        'locked': []          # 未解锁的 TODO（仅显示 🔒）
    }
    
    current_number = int(current_todo_id.split('-')[1])
    
    for todo in all_todos:
        todo_number = int(todo['id'].split('-')[1])
        
        if todo_number < current_number:
            # 已完成的 TODO
            result['completed'].append({
                'id': todo['id'],
                'title': todo['title'],
                'symbol': todo['symbol']  # 🔴/🟠/🟡
            })
        
        elif todo_number == current_number:
            # 当前 TODO（显示完整内容）
            result['current'] = todo
        
        else:
            # 未解锁的 TODO
            result['locked'].append({
                'id': todo['id'],
                'placeholder': True  # 只显示 🔒
            })
    
    return result
```

### 输出示例

```json
{
  "completed": [
    {"id": "todo-1", "title": "概念辨析", "symbol": "🔴"},
    {"id": "todo-2", "title": "架构拆解", "symbol": "🔴"}
  ],
  "current": {
    "id": "todo-3",
    "title": "专家共识与分歧",
    "symbol": "🔴",
    "objective": "理解领域专家对 Agent 的共识和争议",
    "content": "...",
    "completion_criteria": ["..."]
  },
  "locked": [
    {"id": "todo-4", "placeholder": true},
    {"id": "todo-5", "placeholder": true}
  ]
}
```

## 展示格式

### 学生看到的界面

```markdown
# Lesson L0: Agent 本质论

## 📊 进度
第 3 / 5 个任务 | 预计剩余：60 分钟

✅ 已完成：
  - TODO-1: 概念辨析（🔴）
  - TODO-2: 架构拆解（🔴）

📍 当前任务：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### TODO-3: 专家共识与分歧（🔴）
**目标**: 理解领域专家对 Agent 的共识和争议

**内容**:
1. 提取 5 个专家共识
2. 探讨 3 个专家分歧
3. 选择立场并说明理由

**完成检查**:
- [ ] 能复述共识点
- [ ] 立场选择有明确理由
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 待解锁：
  - TODO-4: MVP 实战（🔴）
  - TODO-5: 深度测试（🔴）
```

## 状态流转示例

### 场景 1：新课程

```
初始状态：
{
  "L0": {
    "todos_completed": 0,
    "todos_total": 5
  }
}

current_todo_id = "todo-1"

显示：
- 当前：TODO-1 完整内容
- 待解锁：TODO-2, 3, 4, 5
```

### 场景 2：完成一个 TODO

```
学生完成 TODO-1
    ↓
更新状态：
{
  "L0": {
    "todos_completed": 1
  }
}
    ↓
current_todo_id = "todo-2"
    ↓
显示：
- 已完成：TODO-1
- 当前：TODO-2 完整内容
- 待解锁：TODO-3, 4, 5
```

### 场景 3：恢复学习

```
状态：
{
  "L0": {
    "todos_completed": 2,
    "current_todo_id": "todo-3"
  }
}

current_todo_id = "todo-3"

显示：
- 已完成：TODO-1, 2
- 当前：TODO-3 完整内容（继续）
- 待解锁：TODO-4, 5
```

### 场景 4：全部完成

```
状态：
{
  "L0": {
    "todos_completed": 5,
    "todos_total": 5
  }
}

current_todo_id = None

显示：
"🎉 本课所有 TODO 已完成！

已完成：
- TODO-1: 概念辨析（🔴）
- TODO-2: 架构拆解（🔴）
- TODO-3: 专家共识（🔴）
- TODO-4: MVP 实战（🔴）
- TODO-5: 深度测试（🔴）

输入'下一课'继续学习"
```

## 边界情况处理

### 情况 1：学生询问后续 TODO

```
学生：TODO-4 是什么？

Skill：
"为了最佳学习效果，请专注于当前任务（TODO-3）。
完成 TODO-3 后，我会自动为你展示 TODO-4 的内容。

记住：渐进式学习是为了让你扎实掌握每个知识点。
继续加油！💪"
```

### 情况 2：学生想跳过当前 TODO

```
学生：能不能跳过 TODO-3，直接做 TODO-4？

Skill：
"TODO 的设计是有顺序的，每个都建立在前面的基础上。

TODO-3 帮助你理解专家的思维方式，这对完成 TODO-4 的实战至关重要。

如果你感觉 TODO-3 有困难，我可以帮你：
1. 调整难度
2. 提供更多示例
3. 分解任务

你想怎么继续？"
```

### 情况 3：状态不一致

```
状态文件显示 todos_completed = 3
但 lesson 文件只有 2 个 TODO

处理：
1. 以 lesson 文件为准
2. 重置 todos_completed = 2
3. 记录警告日志
```

## 实现检查清单

- [ ] 正确解析课程文件中的所有 TODO
- [ ] 根据 todos_completed 计算 current_todo_id
- [ ] 只渲染当前 TODO 的完整内容
- [ ] 已完成 TODO 只显示标题和符号
- [ ] 未解锁 TODO 只显示 🔒 占位符
- [ ] 正确显示进度（第 X / Y 个任务）
- [ ] 完成 TODO 后自动更新视图
- [ ] 处理状态不一致的情况
