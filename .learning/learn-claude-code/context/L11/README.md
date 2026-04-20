# L11: Error Recovery - 学习指南

## 元信息
- **课程主题**: 错误恢复机制
- **核心能力**: 三种恢复路径、退避重试、自动压缩
- **源代码**: `agents/s11_error_recovery.py`

---

## 一、核心概念

### 1.1 Error Recovery 本质

**核心洞察**: 健壮的 Agent 会恢复，而不是崩溃。

| 层级 | 理解 |
|-----|-----|
| **L1** | 三种错误有三种处理方式：截断继续、压缩重试、退避重试 |
| **L2** | 恢复机制是设计决策——有限重试 + 优雅失败，不是无限循环 |

### 1.2 三种恢复路径

```
LLM response
     |
     v
[Check stop_reason]
     |
     +-- "max_tokens" ----> [Strategy 1: max_output_tokens recovery]
     |                       Inject continuation message
     |                       Retry up to 3 attempts
     |
     +-- API error -------> [Check error type]
     |                       |
     |                       +-- prompt_too_long --> [Strategy 2: compact + retry]
     |                       |
     |                       +-- connection/rate --> [Strategy 3: backoff retry]
     |
     +-- "end_turn" -----> [Normal exit]
```

---

## 二、三种恢复策略详解

### 2.1 Strategy 1: max_tokens 恢复

**触发条件**: `stop_reason == "max_tokens"`

**处理流程** (L253-264):
```
max_tokens 触发
  |
  v
max_output_recovery_count += 1
  |
  v
检查计数器 <= 3 ?
  |-- 是 --> 注入 CONTINUATION_MESSAGE
  |         messages.append({"role": "user", "content": "Output limit hit. Continue directly..."})
  |         continue (重试循环)
  |
  |-- 否 --> 打印错误，停止
```

**CONTINUATION_MESSAGE** (L68-71):
```
"Output limit hit. Continue directly from where you stopped --
no recap, no repetition. Pick up mid-sentence if needed."
```

**设计要点**:
- 不让模型"重述"（浪费时间）
- 直接从中断处继续
- 最多3次恢复

---

### 2.2 Strategy 2: prompt_too_long 恢复

**触发条件**: API 返回 `overlong_prompt` 或 `prompt too long` 错误

**处理流程** (L217-220):
```
APIError 检测到 overlong_prompt
  |
  v
调用 auto_compact(messages)
  |
  v
messages[:] = compacted_messages
  |
  v
continue (重试本轮)
```

**auto_compact 实现** (L79-108):
```python
def auto_compact(messages: list) -> list:
    # 1. 提取对话历史（截断到80000字符）
    conversation_text = json.dumps(messages)[:80000]

    # 2. 调用LLM生成摘要
    prompt = "Summarize this conversation for continuity. Include:
              1) Task overview and success criteria
              2) Current state: completed work, files touched
              3) Key decisions and failed approaches
              4) Remaining next steps"

    # 3. 返回续接消息
    return [{"role": "user", "content": continuation}]
```

**设计要点**:
- 摘要包含4个关键要素（目标、完成状态、决策、下一步）
- 用单条 user 消息替换整个历史
- 失败时优雅降级（"Previous context lost"）

---

### 2.3 Strategy 3: connection/rate 恢复

**触发条件**: `APIError`（非 prompt_too_long）、`ConnectionError`、`TimeoutError`

**处理流程** (L222-244):
```
连接错误触发
  |
  v
检查 attempt < 3 ?
  |-- 是 --> 计算 backoff_delay(attempt)
  |         sleep(delay)
  |         continue (重试)
  |
  |-- 否 --> 打印错误，停止
```

**backoff_delay 实现** (L111-115):
```python
def backoff_delay(attempt: int) -> float:
    delay = min(1.0 * (2 ** attempt), 30.0)  # 指数增长，上限30秒
    jitter = random.uniform(0, 1)            # 加入随机抖动
    return delay + jitter
```

**退避序列**:
| attempt | base_delay | jitter | 总延迟 |
|---------|------------|--------|--------|
| 0 | 1.0s | 0-1s | 1-2s |
| 1 | 2.0s | 0-1s | 2-3s |
| 2 | 4.0s | 0-1s | 4-5s |
| 3+ | 停止 | - | - |

**设计要点**:
- 指数退避：避免短时间大量重试
- 随机抖动：防止多客户端同步重试（惊群效应）
- 上限30秒：防止等待过长

---

## 三、恢复优先级

**优先级顺序** (文档 L36-40):
```
1. max_tokens -> inject continuation, retry
2. prompt_too_long -> compact, retry
3. connection error -> backoff, retry
4. all retries exhausted -> fail gracefully
```

**为什么这个顺序**:
- max_tokens 是输出限制，最容易恢复（继续输出）
- prompt_too_long 是输入限制，需要压缩（成本较高）
- connection error 是外部问题，等待可能恢复
- 优雅失败是最后兜底

---

## 四、关键常量

| 常量 | 值 | 作用 |
|------|-----|------|
| `MAX_RECOVERY_ATTEMPTS` | 3 | 最大重试次数 |
| `BACKOFF_BASE_DELAY` | 1.0s | 退避基础延迟 |
| `BACKOFF_MAX_DELAY` | 30.0s | 退避上限 |
| `TOKEN_THRESHOLD` | 50000 chars | 主动压缩阈值 |

**主动压缩** (L293-295):
```python
if estimate_tokens(messages) > TOKEN_THRESHOLD:
    messages[:] = auto_compact(messages)
```

**设计意图**: 不是等错误触发，而是提前压缩防止问题。

---

## 五、设计原则

| 原则 | 说明 |
|------|------|
| **有限重试** | 最多3次，不是无限循环 |
| **优雅失败** | 重试耗尽后打印错误停止，不是崩溃 |
| **主动预防** | TOKEN_THRESHOLD 预防性压缩 |
| **指数退避** | 避免短时间大量重试 |
| **随机抖动** | 防止惊群效应 |

---

## 六、Mental Model Eval 问题

### Q1: max_tokens 恢复机制

**问题**: 当模型输出被截断时，Harness 会做什么？

**预期回答**:
- 注入 CONTINUATION_MESSAGE
- 计数器 +1
- 最多3次重试
- 让模型从中断处继续（不重述）

---

### Q2: prompt_too_long 恢复机制

**问题**: 当 API 返回 prompt 太长错误时，Harness 会做什么？

**预期回答**:
- 调用 auto_compact 生成摘要
- 用摘要替换历史
- 重试本轮

---

### Q3: backoff_delay 为什么要有 jitter

**问题**: 指数退避为什么要加入随机抖动？

**预期回答**:
- 防止多客户端同步重试（惊群效应）
- 避免同时冲击服务器

---

### Q4: 恢复优先级

**问题**: 为什么 max_tokens 恢复优先级最高？

**预期回答**:
- 最容易恢复（只需继续输出）
- 成本最低（不改变历史）
- prompt_too_long 需要压缩（成本较高）

---

### Q5: 主动压缩

**问题**: TOKEN_THRESHOLD 的作用是什么？为什么要主动压缩？

**预期回答**:
- 预防性压缩，不等错误触发
- 防止 prompt_too_long 错误
- 在错误发生前处理

---

### Q6: 优雅失败

**问题**: 重试耗尽后 Harness 会做什么？

**预期回答**:
- 打印错误信息
- 停止当前操作
- 不是崩溃或无限循环

---

## 七、与其他课程的关系

| 课程 | 关系 |
|------|------|
| L06 Context Compact | auto_compact 是 Context Compact 的一种实现 |
| L01 Agent Loop | 恢复机制嵌入在 Agent Loop 中 |
| L07 Permission System | 权限拒绝是另一种"错误"，但不需要恢复 |

---

## 八、类比速记

| 概念 | 类比 |
|------|------|
| max_tokens 恢复 | 笔写到一半没墨了，换笔继续写 |
| prompt_too_long 恢复 | 包太重了，取出不重要的东西 |
| backoff 退避 | 打电话对方忙，等会儿再打 |
| jitter 抖动 | 多人同时打电话，错开时间 |
| 主动压缩 | 包快满了，提前清理 |
| 优雅失败 | 试了三次不行就放弃，不硬撑 |

---

## 九、学习进度追踪

- [ ] Mental Model 构建
- [ ] Mental Model Eval (6题)
- [ ] SQ3R 阅读验证
- [ ] 对抗测试

**预计完成时间**: 2026-04-19