# L08: Hook System - 知识总结

## 元信息
- **生成时间**：2026-04-17
- **课程**：L08 - Hook System（Hook 系统）
- **核心能力**：Hook 管道、三种事件、统一返回协议、扩展机制
- **学习进度**：三种方法全部完成

---

## 一、心智模型构建

### 1.1 核心概念网络

| 概念 | 定义 | 依赖关系 | 熟练度 |
|------|------|----------|--------|
| **Hook 管道** | 主循环在固定时机对外发出的调用 | → 主循环 | ✅ L2 |
| **三种事件** | SessionStart、PreToolUse、PostToolUse | → 时机暴露 | ✅ L2 |
| **统一返回协议** | exit_code: 0(继续)/1(阻止)/2(补充) | → 结果处理 | ✅ L2 |
| **HookRunner** | 统一运行 hook 的抽象层 | → 主循环解耦 | ✅ L2 |
| **扩展机制** | 不改主循环代码，也能插入额外行为 | → 可扩展性 | ✅ L2 |

### 1.2 专家视角

#### 专家共识

- **Hook 不是主循环替代品**：主循环在固定时机对外发出调用
- **统一返回协议**：先学统一语义，再学事件细化
- **最小事件集**：SessionStart + PreToolUse + PostToolUse 足够支撑核心扩展
- **事件名 + payload + 返回结果**：Hook 至少需要这三样

#### Hook 与 Permission 的区别

| 机制 | 目的 | 返回语义 |
|------|------|----------|
| Permission | 允许/拒绝判断 | allow/deny/ask |
| Hook | 扩展/观察/拦截 | 0/1/2 |

---

## 二、关键数据结构

### 2.1 HookEvent

```python
event = {
    "name": "PreToolUse",
    "payload": {
        "tool_name": "bash",
        "input": {"command": "pytest"},
    },
}
```

### 2.2 HookResult

```python
result = {
    "exit_code": 0,  # 0=继续, 1=阻止, 2=补充
    "message": "",
}
```

### 2.3 HookRunner

```python
def run_hooks(event_name: str, payload: dict) -> dict:
    for handler in HOOKS.get(event_name, []):
        result = handler(payload)
        if result["exit_code"] in (1, 2):
            return result
    return {"exit_code": 0, "message": ""}
```

---

## 三、执行流程

```text
model 发起 tool_use
    |
    v
run_hook("PreToolUse", ...)
    |
    +-- exit 1 -> 阻止工具执行
    +-- exit 2 -> 先补一条消息给模型，再继续
    +-- exit 0 -> 直接继续
    |
    v
执行工具
    |
    v
run_hook("PostToolUse", ...)
    |
    +-- exit 2 -> 追加补充说明
    +-- exit 0 -> 正常结束
```

---

## 四、常见错误

| 错误 | 正确理解 |
|------|----------|
| Hook = 到处插 if/else | Hook = 预留插口 + 统一调用 |
| 返回类型混乱 | 统一返回结构 |
| 一开始做全所有事件 | 先学3个事件 → 统一协议 → 扩事件面 |

---

## 五、一句话记住

> **Hook 不是主循环的替代品，是主循环在固定时机对外发出的调用。**