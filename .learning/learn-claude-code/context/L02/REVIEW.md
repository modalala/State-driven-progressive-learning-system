# L02: Tool Use - 快速复习

> **格言**：*"加一个工具，只加一个 handler"* -- 循环不用动，新工具注册进 dispatch map 就行。

---

## 核心代码（必背）

```python
# Dispatch map: 加工具不改循环
TOOL_HANDLERS = {
    "bash":       lambda **kw: run_bash(kw["command"]),
    "read_file":  lambda **kw: run_read(kw["path"], kw.get("limit")),
    "write_file": lambda **kw: run_write(kw["path"], kw["content"]),
    "edit_file":  lambda **kw: run_edit(kw["path"], kw["old_text"], kw["new_text"]),
}

# 循环中按名查找（不变）
for block in response.content:
    if block.type == "tool_use":
        handler = TOOL_HANDLERS.get(block.name)
        output = handler(**block.input) if handler else f"Unknown tool: {block.name}"
        results.append({"type": "tool_result", "tool_use_id": block.id, "content": output})

# safe_path: 信任边界
def safe_path(p: str) -> Path:
    path = (WORKDIR / p).resolve()  # 解析符号链接
    if not path.is_relative_to(WORKDIR):
        raise ValueError(f"Path escapes workspace: {p}")
    return path
```

---

## 关键概念速记

| 概念 | 一句话定义 | 记忆口诀 |
|------|-----------|----------|
| **Dispatch Map** | `{name: handler}` 字典分发 | "字典一发，工具到家" |
| **Tool Schema** | name + description + input_schema | "三要素定调用时机" |
| **safe_path** | 路径沙箱防逃逸 | "resolve 查真，relative 判界" |
| **Trust Boundary** | Harness 不信任 LLM | "LLM 可错，Harness 拦" |
| **专用工具优先** | read/write 优于 bash | "专用窄，bash宽" |

---

## 核心原则（面试必答）

### 1. 开闭原则

```
加工具 = 加 handler + 加 schema
循环代码 = 零改动
```

**原理**：`TOOL_HANDLERS.get(block.name)` 一行代码实现了对扩展开放、对修改封闭。

### 2. 信任边界原则

```
LLM = 决策智能（可能犯错）
Harness = 安全护栏（必须拦截）
```

**示例**：LLM 要求读取 `/etc/passwd`，safe_path 拦截——这不是 LLM 的责任，是 Harness 的。

### 3. 减少攻击面原则

```
bash = 最大攻击面（任意命令）
专用工具 = 约束范围（只读/写/编辑）
```

**实践**：优先用 read_file/write_file/edit_file，bash 作为最后手段。

---

## 常见陷阱

| 陷阱 | 错误理解 | 正确理解 |
|------|----------|----------|
| "字典查找就是开闭原则" | 只看代码形式 | 看设计意图——扩展不改循环 |
| "safe_path 检查路径" | 只看功能 | 看信任边界——LLM 可犯错 |
| "LLM 应该判断安全" | LLM 做决策 | Harness 做护栏 |
| "bash 更灵活" | 灵活就好 | 灵活 = 大攻击面 |

---

## s01 vs s02 对比

| 组件 | s01 | s02 | 变化 |
|------|-----|-----|------|
| Tools | 1 (bash) | 4 (bash, read, write, edit) | +3 |
| Dispatch | 硬编码 | `TOOL_HANDLERS` 字典 | 结构化 |
| 安全 | 无 | `safe_path()` 沙箱 | 新增 |
| 循环 | - | **不变** | 核心 |

---

## 与后续课程的关系

```
L02 (Tool Use)
    │
    │ dispatch map + safe_path
    │
    ├─→ L03 TodoWrite    + todo handler
    ├─→ L04 Subagent     独立 dispatch map
    ├─→ L05 Skill Loading tool_result 注入知识
    ├─→ L06 Context Compact 压缩 tool_result
    └─→ L07 Task System  持久化 CRUD
```

**核心洞察**：后面所有课程都在 dispatch map 上叠加——循环本身始终不变。

---

## 自测问题

1. **为什么加工具不需要改循环代码？**
   <details>
   <summary>点击查看答案</summary>
   因为 dispatch map 是字典结构，`TOOL_HANDLERS.get(block.name)` 查找。加工具只需在字典里加一项（handler）和在 TOOLS 数组加 schema，循环体代码零改动。这是开闭原则。
   </details>

2. **safe_path 为什么用 resolve() + is_relative_to()？**
   <details>
   <summary>点击查看答案</summary>
   resolve() 解析符号链接，防止 `../` 或 symlink 逃逸。is_relative_to() 检查最终路径是否仍在工作区内。两者结合确保信任边界。
   </details>

3. **为什么专用工具比 bash 更安全？**
   <details>
   <summary>点击查看答案</summary>
   bash 可以执行任意 shell 命令，攻击面最大。read_file/write_file/edit_file 只能做特定操作，范围受限，攻击面小。减少攻击面原则。
   </details>

4. **block.name 从哪里来？**
   <details>
   <summary>点击查看答案</summary>
   block.name 由 LLM 决定。LLM 看到 Tool Schema，根据 description 判断调用时机，在 tool_use block 中提供 name。Harness 只是执行。
   </details>

---

## 复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| 2026-04-06 | 开闭原则+策略模式+颗粒度权衡 | ⬜ |
| 2026-04-12 | 信任边界原则+安全护栏设计 | ⬜ |
| 2026-04-26 | 与其他课程的关系 | ⬜ |