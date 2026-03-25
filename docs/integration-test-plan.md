# 集成测试计划

## 测试目标

验证整个学习系统的端到端流程：
1. Master Agent 正确管理状态
2. Lesson SubAgent 正确教学
3. 状态文件正确更新
4. 边界控制严格执行

## 测试场景

### 场景1：新用户首次使用

**前置条件**：
- `learning-state.json` 存在且为初始状态
- `memory-store.json` 存在且为空

**测试步骤**：
1. 用户输入："开始学习"
2. 预期输出：
   - 欢迎消息
   - 显示课程概览
   - 提示输入"开始"进入 L0
3. 用户输入："开始"
4. 预期输出：
   - 显示 L0 信息
   - 激活 Lesson-L0 SubAgent
   - 显示 TODO-1

**验证点**：
- [ ] Master 正确读取初始状态
- [ ] L0 状态从 unlocked 变为 in_progress
- [ ] 正确传递上下文给 SubAgent
- [ ] SubAgent 显示正确的 TODO

---

### 场景2：中断后恢复

**前置条件**：
- L0 状态为 in_progress
- TODO-2 已完成，当前 TODO-3
- last_session 为昨天

**测试步骤**：
1. 用户输入："继续"
2. 预期输出：
   - 欢迎回来消息
   - 显示当前位置（L0, TODO-3）
   - 提示"上次学习到..."
3. 用户输入："继续"
4. 预期输出：
   - 恢复 Lesson-L0 SubAgent
   - 加载 TODO-3 上下文

**验证点**：
- [ ] Master 正确识别 in_progress 状态
- [ ] 正确恢复上次进度
- [ ] SubAgent 加载正确的 TODO 上下文

---

### 场景3：完成课程进入下一课

**前置条件**：
- L0 所有 TODO 完成
- L0 状态为 completed

**测试步骤**：
1. 用户输入："下一课"
2. 预期输出：
   - 祝贺完成 L0
   - 显示掌握情况
   - 提示输入确认进入 L1
3. 用户输入："开始"
4. 预期输出：
   - 解锁 L1 消息
   - 显示 L1 学习目标
   - 激活 Lesson-L1 SubAgent

**验证点**：
- [ ] Master 检查 L0 完成状态
- [ ] L0 保持 completed，L1 变为 unlocked → in_progress
- [ ] current_lesson 更新为 L1
- [ ] 正确初始化 L1 的 SubAgent

---

### 场景4：边界控制 - 禁止跳课

**前置条件**：
- 当前在 L0，L1 状态为 locked

**测试步骤**：
1. 用户输入："我想学 L2"
2. 预期输出：
   - 温和拒绝
   - 说明需要按顺序完成
   - 提示当前位置和解锁条件

**验证点**：
- [ ] Master 拒绝访问 locked 课程
- [ ] 不提供 L2 的任何具体内容
- [ ] 正确引导用户回到当前课程

---

### 场景5：对抗测试暴露脆弱点

**前置条件**：
- 在 L0 TODO-5 对抗测试环节

**测试步骤**：
1. SubAgent 执行对抗测试
2. 学生回答有误
3. 预期输出：
   - 记录脆弱点
   - 提供修复指导
   - 询问是否继续或修复

**验证点**：
- [ ] 正确识别理解盲区
- [ ] 脆弱点记录到 memory-store.json
- [ ] 提供有针对性的修复建议

---

### 场景6：查看进度

**前置条件**：
- 已完成 L0
- L1 进行中（TODO-3/7）
- 有 1 个未解决脆弱点

**测试步骤**：
1. 用户输入："查看进度"
2. 预期输出：
   - 显示总体进度（1/12 完成，1/12 进行中）
   - 显示当前课程详情
   - 显示脆弱点数量
   - 显示课程大纲（带状态图标）

**验证点**：
- [ ] 正确计算完成/进行中课程数
- [ ] 正确显示 TODO 进度
- [ ] 显示脆弱点信息
- [ ] 课程大纲状态正确

---

### 场景7：SubAgent 上下文隔离

**前置条件**：
- 在 L1 学习中

**测试步骤**：
1. 学生问："L2 会学什么？"
2. 预期输出：
   - SubAgent 拒绝透露
   - 回复"请先完成本课基础"

3. 学生问："之前 L0 学的是什么来着？"
4. 预期输出：
   - 简要复述 L0 核心概念
   - 不引用"L0"课程编号

**验证点**：
- [ ] 不透露未来课程内容
- [ ] 简要复述前置知识时不引用编号
- [ ] 保持上下文隔离

---

## 测试数据

### 初始状态（新用户）

```json
{
  "learning_state": {
    "current_lesson": "L0",
    "global_status": "active"
  },
  "syllabus_progress": {
    "L0": {"status": "unlocked", ...},
    "L1": {"status": "locked", ...},
    ...
  }
}
```

### 中断恢复状态

```json
{
  "learning_state": {
    "current_lesson": "L0"
  },
  "syllabus_progress": {
    "L0": {
      "status": "in_progress",
      "todos_completed": 2,
      "current_todo_id": "todo-3"
    }
  }
}
```

### 完成状态

```json
{
  "syllabus_progress": {
    "L0": {
      "status": "completed",
      "completed_at": "2026-03-19T16:00:00",
      "mastery_score": 0.9
    },
    "L1": {"status": "unlocked"}
  }
}
```

## 自动化测试脚本（可选）

```python
# test_integration.py

def test_new_user_flow():
    """测试新用户首次使用流程"""
    # 初始化状态
    reset_state()
    
    # 模拟用户输入
    response = agent.process("开始学习")
    
    # 验证
    assert "欢迎" in response
    assert "L0" in response
    
    state = load_state()
    assert state["syllabus_progress"]["L0"]["status"] == "in_progress"

def test_resume_flow():
    """测试中断后恢复"""
    # 设置中断状态
    set_state({
        "current_lesson": "L0",
        "L0": {"status": "in_progress", "current_todo_id": "todo-3"}
    })
    
    response = agent.process("继续")
    
    assert "TODO-3" in response or "todo-3" in response

def test_boundary_control():
    """测试边界控制 - 禁止跳课"""
    set_state({"current_lesson": "L0"})
    
    response = agent.process("我想直接学 L3")
    
    assert "请先完成" in response
    assert "L3" not in response or "锁定" in response
```

## 手动测试检查清单

在实际对话中验证：

- [ ] 新用户欢迎流程正确
- [ ] 恢复学习流程正确
- [ ] 完成课程后解锁下一课
- [ ] 禁止跳课功能正常
- [ ] 进度显示准确
- [ ] SubAgent 不透露未来课程
- [ ] SubAgent 简要复述前置知识
- [ ] 脆弱点正确记录
- [ ] 状态文件正确更新

## 通过标准

所有测试场景通过，即可认为 L0-L2 验证模式成功，可以批量生产 L3-L11。
