# L13: Background Tasks (后台任务)

## 核心命题

> **主循环仍然只有一条，并行的是等待，不是主循环本身。**

---

## 问题背景

同步执行慢命令（npm install、pytest、docker build）会导致：
1. 模型在等待期间**什么都做不了**
2. 用户还想继续别的工作，却被**整轮流程堵住**

解决方案：把"慢执行"移到后台，让主循环继续推进别的事情。

---

## 关键概念

### 前台 vs 后台

| 概念 | 定义 |
|------|------|
| 前台 | 主循环发起后，必须立刻等待结果的执行路径 |
| 后台 | 命令在另一条执行线跑，主循环先做别的事 |

### 通知队列

"稍后再告诉主循环"的收件箱。后台任务完成后写摘要通知，等下一轮统一带回。

---

## 核心心智模型

```text
主循环
  |
  +-- background_run("pytest")
  |      -> 立刻返回 task_id
  |
  +-- 继续别的工作
  |
  +-- 下一轮模型调用前
         -> drain_notifications()
         -> 把摘要注入 messages

后台执行线
  |
  +-- 真正执行 pytest
  +-- 完成后写入通知队列
```

**关键：并行的是等待与执行槽位，不是主循环本身。**

---

## 数据结构

### RuntimeTaskRecord

```python
task = {
    "id": "a1b2c3d4",
    "command": "pytest",
    "status": "running",  # running/completed/failed/timeout
    "started_at": 1710000000.0,
    "result_preview": "",
    "output_file": "",
}
```

职责：管**执行状态**（谁在跑、跑到哪）

### Notification

```python
notification = {
    "type": "background_completed",
    "task_id": "a1b2c3d4",
    "status": "completed",
    "preview": "tests passed",  # 只放摘要，不放全文
}
```

职责：管**结果投递**（完成了、通知主循环）

---

## 主循环流程变更

```text
1. 先 drain_notifications() 排空通知队列
2. 把通知摘要 append 到 messages (user role)
3. 再调用模型
4. 普通工具照常同步执行
5. background_run → 登记任务 + 立刻返回 task_id
```

---

## 设计原则

### 通知只放 preview

| 放什么 | 不放什么 |
|--------|----------|
| task_id | 完整输出 |
| status | 文件路径 |
| preview（500字摘要） | |

原因：
- 防止上下文撑爆
- 防止注意力稀释
- 模型要看全文时用 read_file 读磁盘文件

### 任务表 vs 通知队列职责分离

| 状态块 | 职责 |
|--------|------|
| tasks（任务表） | 执行状态管理 |
| notifications（通知队列） | 结果投递通道 |

---

## 与 L12 Task System 的边界

| 概念 | 关注点 | 一句话 |
|------|------|--------|
| s12 task | **工作目标** | 做什么、谁依赖谁、进度如何 |
| s13 background task | **运行作业** | 哪个命令在跑、什么状态、结果何时回来 |

**task = 工作板，background task = 运行中的作业。**

---

## 最小工具

| 工具 | 作用 |
|------|------|
| background_run | 登记后台任务，立刻返回 task_id |
| background_check | 主动查询任务状态 |

---

## 常见错误

| 错误 | 正确理解 |
|------|----------|
| "后台就是另一条主循环" | 主循环保持单主线 |
| "只开线程不登记状态" | 必须有任务表和通知队列 |
| "长日志全文塞进上下文" | 只放 preview，全文写文件 |
| "task 和 background task 混为一谈" | 工作板 vs 运行作业 |

---

## 模型获取后台状态

```text
用户问"后台任务跑完了吗"：
→ notification 已 drain 到 messages → 直接回答（不需工具）
→ notification 未 drain → 调用 background_check 查询
```

---

## 迁移能力

| Harness 组件 | Web API 对应 |
|-------------|-------------|
| notifications 队列 | 消息队列 (Redis pub/sub, RabbitMQ) 或 WebSocket |
| drain_notifications() | 消费者轮询或事件监听 |
| RuntimeTaskRecord | Job 状态表 (Redis/DB) |

---

## 学完应掌握的四句话

1. 主循环只有一条，并行的是等待，不是主循环本身。
2. 后台任务至少需要"任务表 + 通知队列"两块状态。
3. background_run 应该立刻返回 task_id，而不是同步卡住。
4. 通知只放摘要，完整输出放文件。
