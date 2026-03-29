# 工作流程详解

## 主流程

```
检测 syllabus.yaml
    ↓
读取课程大纲
    ↓
检测 .learning/ 目录
    ├─ 存在 → 读取 learning-state.json
    └─ 不存在 → 初始化新学习项目
        ↓
        创建 .learning/ 目录
        生成初始 learning-state.json
        生成空 memory-store.json
    ↓
确定当前课程和 TODO
    ↓
根据课程配置执行三种学习方法
    ↓
更新学习状态（实时保存）
```

---

## 状态初始化详细流程

当检测到 `.learning/learning-state.json` 不存在时：

### Step 1: 创建目录结构

```bash
mkdir -p .learning/
```

### Step 2: 生成初始 learning-state.json

```json
{
  "version": "1.0.0",
  "learning_state": {
    "domain": "{{from_syllabus_meta_domain}}",
    "current_lesson": "{{syllabus[0].id}}",
    "global_status": "active",
    "started_at": "{{current_date}}",
    "last_session": null,
    "total_study_time_minutes": 0
  },
  "syllabus_progress": {
    "{{syllabus[0].id}}": {
      "status": "unlocked",
      "title": "{{syllabus[0].title}}",
      "todos_total": {{syllabus[0].todos_count}},
      "todos_completed": 0,
      "prerequisites": []
    },
    "{{syllabus[1].id}}": {
      "status": "locked",
      "title": "{{syllabus[1].title}}",
      "prerequisites": ["{{syllabus[0].id}}"]
    }
    // ... 其他课程
  }
}
```

### Step 3: 生成空 memory-store.json

```json
{
  "core_models": [],
  "controversies": [],
  "vulnerability_log": [],
  "code_snippets": {},
  "session_history": []
}
```

### Step 4: 通知用户

```
🎉 新的学习项目初始化完成！

项目：{{domain_cn}}
总课程：{{total_lessons}} 课
预计时间：{{estimated_total_hours}} 小时

准备开始学习第一课：{{lesson_0_title}}
输入"开始"开始学习
```

---

## 状态检查点

以下时刻自动保存状态：

1. **TODO 完成时**：更新 todos_completed
2. **课程完成时**：更新 status 为 completed，解锁下一课
3. **发现脆弱点时**：添加到 vulnerability_log
4. **会话结束时**：更新 last_session 和 total_study_time_minutes
5. **用户说"暂停"时**：保存当前进度

---

## 状态文件位置

```
项目根目录/
├── syllabus.yaml              # 课程大纲（用户维护）
├── lessons/                   # 课程内容（用户维护）
└── .learning/                 # 学习状态（自动生成）
    ├── learning-state.json    # 进度状态
    └── memory-store.json      # 记忆存储
```

**注意**：`.learning/` 目录应添加到 `.gitignore`（如果使用 git），因为这是个人学习数据。

---

## 状态更新规则

### TODO 完成时

当学生完成一个 TODO 时：

1. **验证完成标准**
   - 检查所有完成检查项
   - 执行对抗测试（如配置）
   - 确认无重大盲区

2. **更新状态文件**
   ```json
   {
     "syllabus_progress": {
       "L0": {
         "todos_completed": 3,
         "current_todo_id": "todo-4"
       }
     }
   }
   ```

3. **记录学习摘要**
   - 记录到 memory-store.json
   - 更新 session_history

### 课程完成时

当所有 TODO 完成时：

1. **更新课程状态**
   ```json
   {
     "syllabus_progress": {
       "L0": {
         "status": "completed",
         "completed_at": "2026-03-19T16:00:00",
         "mastery_score": 0.9
       },
       "L1": {
         "status": "unlocked"
       }
     }
   }
   ```

2. **解锁下一课**
   - 检查 prerequisites
   - 自动解锁满足条件的课程

3. **生成学习报告**
   ```
   🎉 Lesson L0 完成！

   掌握情况：
   - 🔴 核心点：4/4
   - 🟠 重点：2/2
   - 🟡 了解：1/1

   学习时间：120 分钟
   脆弱点：2 个（已修复）

   下一课 L1 已解锁！
   输入"下一课"继续
   ```

### 脆弱点记录

当对抗测试发现问题时：

```json
{
  "vulnerability_log": [
    {
      "id": "vuln-001",
      "lesson_id": "L0",
      "todo_id": "todo-2",
      "type": "边界条件误解",
      "detail": "误以为 Agent 必须实时响应",
      "context": "讨论异步处理时",
      "created_at": "2026-03-19T15:30:00",
      "status": "open",
      "resolution": null
    }
  ]
}
```

**类型定义**：
- `边界条件误解`：对极限情况的理解错误
- `概念混淆`：混淆相关概念
- `逻辑漏洞`：推理链条断裂
- `实践盲区`：缺乏实际操作经验
- `迁移失败`：无法应用到新场景

**状态定义**：
- `open`：未解决
- `resolved`：已修复
- `debt`：标记为技术债（暂不深究）