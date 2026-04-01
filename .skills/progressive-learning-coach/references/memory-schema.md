# Memory Store JSON Schema

## 文件位置

```
D:\code\State-driven-progressive-learning-system\
├── learning-state.json          # 主状态文件
├── memory-store.json            # 记忆存储
└── backups\                     # 自动备份
    ├── learning-state.2026-03-19.json
    └── ...
```

## 主状态文件 (learning-state.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Learning State",
  "type": "object",
  "required": ["learning_state", "syllabus_progress", "version"],
  "properties": {
    "version": {
      "type": "string",
      "description": "Schema 版本",
      "default": "1.0.0"
    },
    "learning_state": {
      "type": "object",
      "required": ["domain", "current_lesson", "global_status", "started_at"],
      "properties": {
        "domain": {
          "type": "string",
          "description": "学习领域",
          "default": "llm_agent_architecture"
        },
        "current_lesson": {
          "type": "string",
          "pattern": "^L(0|1[0-1]|[0-9])$",
          "description": "当前课程 ID (L0-L11)"
        },
        "global_status": {
          "type": "string",
          "enum": ["active", "paused", "completed"],
          "description": "整体学习状态"
        },
        "started_at": {
          "type": "string",
          "format": "date",
          "description": "开始日期 (YYYY-MM-DD)"
        },
        "last_session": {
          "type": "string",
          "format": "date-time",
          "description": "上次会话时间 (ISO 8601)"
        },
        "total_study_time_minutes": {
          "type": "integer",
          "description": "累计学习时间（分钟）"
        }
      }
    },
    "syllabus_progress": {
      "type": "object",
      "patternProperties": {
        "^L(0|1[0-1]|[0-9])$": {
          "type": "object",
          "required": ["status"],
          "properties": {
            "status": {
              "type": "string",
              "enum": ["locked", "unlocked", "in_progress", "suspended", "completed", "review_needed", "challenged"]
            },
            "title": {
              "type": "string",
              "description": "课程标题"
            },
            "entered_at": {
              "type": "string",
              "format": "date-time"
            },
            "completed_at": {
              "type": "string",
              "format": "date-time"
            },
            "study_time_minutes": {
              "type": "integer"
            },
            "mastery_score": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "掌握度评分 (0-1)"
            },
            "todos_total": {
              "type": "integer"
            },
            "todos_completed": {
              "type": "integer"
            },
            "current_todo_id": {
              "type": "string",
              "description": "当前进行中的 TODO ID"
            },
            "core_points_mastered": {
              "type": "array",
              "items": { "type": "string" },
              "description": "已掌握的核心点列表"
            },
            "weak_points": {
              "type": "array",
              "items": { "type": "string" },
              "description": "薄弱点列表"
            },
            "prerequisites": {
              "type": "array",
              "items": { "type": "string" },
              "description": "前置课程"
            }
          }
        }
      }
    }
  }
}
```

## 记忆存储文件 (memory-store.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Memory Store",
  "type": "object",
  "required": ["core_models", "controversies", "vulnerability_log", "code_snippets"],
  "properties": {
    "core_models": {
      "type": "array",
      "description": "核心心智模型汇总",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "lesson_id": { "type": "string" },
          "model": { "type": "string", "description": "心智模型描述" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "created_at": { "type": "string", "format": "date-time" }
        }
      }
    },
    "controversies": {
      "type": "array",
      "description": "专家分歧记录",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "lesson_id": { "type": "string" },
          "topic": { "type": "string" },
          "side_a": { "type": "string" },
          "side_b": { "type": "string" },
          "my_position": { "type": "string", "enum": ["undecided", "side_a", "side_b", "synthesis"] },
          "notes": { "type": "string" }
        }
      }
    },
    "vulnerability_log": {
      "type": "array",
      "description": "脆弱点日志（所有课程）",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "lesson_id": { "type": "string" },
          "todo_id": { "type": "string" },
          "type": {
            "type": "string",
            "enum": ["边界条件误解", "概念混淆", "逻辑漏洞", "实践盲区", "迁移失败"]
          },
          "detail": { "type": "string" },
          "context": { "type": "string" },
          "created_at": { "type": "string", "format": "date-time" },
          "status": { "type": "string", "enum": ["open", "resolved", "debt"] },
          "resolution": { "type": "string" }
        }
      }
    },
    "code_snippets": {
      "type": "object",
      "description": "课程代码片段存档",
      "patternProperties": {
        "^L(0|1[0-1]|[0-9])$": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "description": { "type": "string" },
              "code": { "type": "string" },
              "language": { "type": "string" },
              "created_at": { "type": "string", "format": "date-time" }
            }
          }
        }
      }
    },
    "session_history": {
      "type": "array",
      "description": "会话历史（最近 20 次）",
      "maxItems": 20,
      "items": {
        "type": "object",
        "properties": {
          "session_id": { "type": "string" },
          "lesson_id": { "type": "string" },
          "started_at": { "type": "string", "format": "date-time" },
          "ended_at": { "type": "string", "format": "date-time" },
          "duration_minutes": { "type": "integer" },
          "todos_completed": { "type": "integer" }
        }
      }
    }
  }
}
```

## 示例数据

### 新用户初始化状态

```json
{
  "version": "1.0.0",
  "learning_state": {
    "domain": "llm_agent_architecture",
    "current_lesson": "L0",
    "global_status": "active",
    "started_at": "2026-03-19",
    "last_session": null,
    "total_study_time_minutes": 0
  },
  "syllabus_progress": {
    "L0": {
      "status": "unlocked",
      "title": "Meta-Cognition: Agent 本质论",
      "todos_total": 5,
      "todos_completed": 0,
      "prerequisites": []
    },
    "L1": {
      "status": "locked",
      "title": "认知架构：ReAct vs Reflexion",
      "prerequisites": ["L0"]
    },
    "L2": {
      "status": "locked",
      "title": "记忆系统：从短期到长期",
      "prerequisites": ["L1"]
    }
  }
}
```

### L0 完成后状态

```json
{
  "version": "1.0.0",
  "learning_state": {
    "domain": "llm_agent_architecture",
    "current_lesson": "L1",
    "global_status": "active",
    "started_at": "2026-03-19",
    "last_session": "2026-03-19T16:30:00",
    "total_study_time_minutes": 120
  },
  "syllabus_progress": {
    "L0": {
      "status": "completed",
      "title": "Meta-Cognition: Agent 本质论",
      "entered_at": "2026-03-19T14:00:00",
      "completed_at": "2026-03-19T16:00:00",
      "study_time_minutes": 120,
      "mastery_score": 0.9,
      "todos_total": 5,
      "todos_completed": 5,
      "core_points_mastered": [
        "Agent = 状态机 + 工具调用 + 环境反馈",
        "感知-思考-行动循环是 Agent 的基础架构"
      ],
      "weak_points": [
        "实时性与异步处理的边界判断"
      ]
    },
    "L1": {
      "status": "unlocked",
      "title": "认知架构：ReAct vs Reflexion",
      "todos_total": 7,
      "todos_completed": 0,
      "prerequisites": ["L0"]
    }
  }
}
```

### memory-store.json 示例

```json
{
  "core_models": [
    {
      "id": "model-001",
      "lesson_id": "L0",
      "model": "Agent = 状态机 + 工具调用 + 环境反馈",
      "confidence": 0.95,
      "created_at": "2026-03-19T15:30:00"
    }
  ],
  "controversies": [
    {
      "id": "cont-001",
      "lesson_id": "L0",
      "topic": "System Prompt 是否算一种 Fine-tuning",
      "side_a": "是，因为它改变了模型的行为分布",
      "side_b": "否，因为它没有更新模型权重",
      "my_position": "undecided",
      "notes": "需要更深入理解 Fine-tuning 的本质"
    }
  ],
  "vulnerability_log": [
    {
      "id": "vuln-001",
      "lesson_id": "L0",
      "todo_id": "todo-3",
      "type": "边界条件误解",
      "detail": "误以为 Agent 必须实时响应所有请求",
      "context": "讨论异步处理机制时",
      "created_at": "2026-03-19T15:45:00",
      "status": "open",
      "resolution": null
    }
  ],
  "code_snippets": {
    "L0": {
      "agent_loop": {
        "description": "基础的 Agent 感知-思考-行动循环",
        "code": "while True:\n    perception = observe_environment()\n    thought = llm_reason(perception)\n    action = parse_action(thought)\n    result = execute(action)\n    update_memory(perception, thought, action, result)",
        "language": "python",
        "created_at": "2026-03-19T15:20:00"
      }
    }
  },
  "session_history": [
    {
      "session_id": "sess-001",
      "lesson_id": "L0",
      "started_at": "2026-03-19T14:00:00",
      "ended_at": "2026-03-19T16:00:00",
      "duration_minutes": 120,
      "todos_completed": 5
    }
  ]
}
```

## API 操作

### 读取状态

```python
def get_learning_state() -> dict:
    """读取当前学习状态"""
    with open('learning-state.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def get_memory_store() -> dict:
    """读取记忆存储"""
    with open('memory-store.json', 'r', encoding='utf-8') as f:
        return json.load(f)
```

### 更新状态

```python
def update_lesson_status(lesson_id: str, updates: dict):
    """更新课程状态"""
    state = get_learning_state()
    state['syllabus_progress'][lesson_id].update(updates)
    state['learning_state']['last_session'] = datetime.now().isoformat()
    save_learning_state(state)

def add_vulnerability(vulnerability: dict):
    """添加脆弱点记录"""
    memory = get_memory_store()
    vulnerability['id'] = f"vuln-{len(memory['vulnerability_log']) + 1:03d}"
    vulnerability['created_at'] = datetime.now().isoformat()
    memory['vulnerability_log'].append(vulnerability)
    save_memory_store(memory)
```

### 自动备份

```python
def backup_state():
    """自动备份状态文件"""
    timestamp = datetime.now().strftime('%Y-%m-%d')
    shutil.copy('learning-state.json', f'backups/learning-state.{timestamp}.json')
    shutil.copy('memory-store.json', f'backups/memory-store.{timestamp}.json')
```
