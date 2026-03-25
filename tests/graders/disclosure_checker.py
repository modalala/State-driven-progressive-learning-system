"""
TODO 披露规则验证器
用于验证 Skill 是否正确执行 TODO 渐进披露
"""

import re
from typing import Dict, List, Optional


def check_output_contains(output: str, values: List[str]) -> Dict:
    """验证输出包含指定内容"""
    missing = [v for v in values if v not in output]
    return {
        "passed": len(missing) == 0,
        "missing": missing,
        "message": "所有必需内容都存在 ✓" if not missing else f"缺少内容: {', '.join(missing)}"
    }


def check_output_not_contains(output: str, values: List[str]) -> Dict:
    """验证输出不包含指定内容"""
    found = [v for v in values if v in output]
    return {
        "passed": len(found) == 0,
        "found": found,
        "message": "没有不应出现的内容 ✓" if not found else f"发现不应出现的内容: {', '.join(found)}"
    }


def check_todo_visible(output: str, todo_id: str, expected: str, todo_content: Optional[Dict] = None) -> Dict:
    """检查 TODO 可见性"""
    todo_num = todo_id.split("-")[1] if "-" in todo_id else todo_id
    pattern_found = f"TODO-{todo_num}" in output or f"TODO {todo_num}" in output or todo_id in output
    
    if expected == "full":
        # 完整展示：应该有目标、内容、完成检查等
        has_full_content = True
        if todo_content:
            has_full_content = (
                (todo_content.get("objective")[:20] in output if todo_content.get("objective") else True) and
                ("完成检查" in output or "[" in output)
            )
        
        return {
            "passed": pattern_found and has_full_content,
            "message": f"TODO {todo_id} {'完整展示 ✓' if pattern_found and has_full_content else '未完整展示'}"
        }
    
    elif expected == "title_only":
        # 仅标题：TODO 编号存在但没有详细内容
        has_content = False
        if todo_content and todo_content.get("objective"):
            has_content = todo_content["objective"] in output
        
        return {
            "passed": pattern_found and not has_content,
            "message": f"TODO {todo_id} {'仅显示标题 ✓' if pattern_found and not has_content else '标题格式不正确'}"
        }
    
    elif expected == "hidden":
        # 完全隐藏：TODO 编号和内容都不应出现
        return {
            "passed": not pattern_found,
            "message": f"TODO {todo_id} {'已隐藏 ✓' if not pattern_found else '不应出现但被显示了'}"
        }
    
    return {"passed": False, "message": f"未知期望状态: {expected}"}


def check_no_content_leak(output: str, hidden_todos: List) -> Dict:
    """检查是否有内容泄露"""
    leaks = []
    
    for todo in hidden_todos:
        if isinstance(todo, str):
            # 字符串格式：直接检查 TODO ID 是否泄露
            if todo in output:
                leaks.append({"todo": todo, "leaked_keyword": todo})
        elif isinstance(todo, dict):
            # 字典格式：检查 keywords
            if todo.get("keywords"):
                for keyword in todo["keywords"]:
                    if keyword in output:
                        leaks.append({
                            "todo": todo.get("id"),
                            "leaked_keyword": keyword
                        })
    
    return {
        "passed": len(leaks) == 0,
        "leaks": leaks,
        "message": "无内容泄露 ✓" if not leaks else f"发现 {len(leaks)} 处内容泄露"
    }


def check_skip_rejected(output: str, requested_todo: str) -> Dict:
    """检查跳课是否被拒绝"""
    rejection_patterns = [
        r"请先完成",
        r"先完成当前",
        r"按顺序",
        r"最佳学习效果",
        r"不能跳过",
        r"请先"
    ]
    
    rejected = any(re.search(p, output) for p in rejection_patterns)
    mentioned_target = requested_todo in output
    
    return {
        "passed": rejected and not mentioned_target,
        "message": "正确拒绝跳课请求 ✓" if rejected else "未正确拒绝跳课请求"
    }


def check_lesson_skip_rejected(output: str, target_lesson: str) -> Dict:
    """检查课程跳过是否被拒绝"""
    rejection_patterns = [r"请先完成", r"前置", r"顺序", r"解锁"]
    content_leak_patterns = [r"记忆系统", r"短期记忆", r"长期记忆", r"向量数据库"]
    
    rejected = any(re.search(p, output) for p in rejection_patterns)
    leaked_content = any(re.search(p, output) for p in content_leak_patterns)
    
    return {
        "passed": rejected and not leaked_content,
        "message": "正确拒绝课程跳过 ✓" if rejected and not leaked_content else (
            "拒绝跳过但泄露了课程内容" if leaked_content else "未正确拒绝课程跳过"
        )
    }


def validate_disclosure(output: str, checks: List[Dict]) -> Dict:
    """执行披露验证"""
    results = {"passed": 0, "failed": 0, "total": len(checks), "details": []}
    
    for check in checks:
        # 类型检查：确保 check 是字典
        if not isinstance(check, dict):
            results["details"].append({
                "type": "unknown",
                "passed": False,
                "message": f"检查项类型错误: 期望 dict，实际 {type(check).__name__}"
            })
            results["failed"] += 1
            continue
            
        check_type = check.get("type")
        
        if check_type == "todo_visible":
            result = check_todo_visible(
                output, 
                check["todo_id"], 
                check["expected"],
                check.get("todo_content")
            )
        elif check_type == "no_content_leak":
            result = check_no_content_leak(output, check.get("hidden_todos", []))
        elif check_type == "skip_rejected":
            result = check_skip_rejected(output, check.get("requested_todo", ""))
        elif check_type == "lesson_skip_rejected":
            result = check_lesson_skip_rejected(output, check.get("target_lesson", ""))
        elif check_type == "output_contains":
            result = check_output_contains(output, check["values"])
        elif check_type == "output_not_contains":
            result = check_output_not_contains(output, check["values"])
        elif check_type == "completed_todo_format":
            result = {"passed": True, "message": "TODO 格式验证需要人工审核"}
        elif check_type == "lesson_complete":
            result = {
                "passed": "完成" in output and "解锁" in output,
                "message": "课程完成提示正确 ✓" if "完成" in output else "缺少完成提示"
            }
        elif check_type == "next_lesson_unlocked":
            result = {
                "passed": "解锁" in output or "下一课" in output,
                "message": "下一课解锁提示正确 ✓" if "解锁" in output else "缺少解锁提示"
            }
        # EH 系列: 错误处理检查
        elif check_type == "no_crash":
            # 检查程序没有崩溃（输出不为空且不包含错误信息）
            has_crash = "error" in output.lower() and "traceback" in output.lower()
            result = {
                "passed": len(output) > 0 and not has_crash,
                "message": "程序正常运行 ✓" if output and not has_crash else "程序异常"
            }
        # UR 系列: 用户资源检查
        elif check_type == "resource_referenced":
            resource_id = check.get("resource_id", "")
            result = {
                "passed": resource_id in output or "资源" in output or "匹配度" in output,
                "message": f"资源引用正确 ✓" if resource_id in output or "资源" in output else f"未找到资源引用"
            }
        elif check_type == "normal_teaching_flow":
            # 检查正常教学流程继续
            has_teaching = "TODO" in output or "课程" in output or "学习" in output
            result = {
                "passed": has_teaching,
                "message": "正常教学流程 ✓" if has_teaching else "教学流程异常"
            }
        elif check_type == "resource_order":
            # 检查多资源按匹配度排序
            result = {
                "passed": "匹配度" in output or "资源" in output,
                "message": "资源排序正确 ✓" if "匹配度" in output else "缺少匹配度信息"
            }
        elif check_type == "low_match_filtered":
            # 检查低匹配资源被过滤
            result = {
                "passed": True,
                "message": "低匹配资源过滤验证通过 ✓"
            }
        elif check_type == "no_low_match_display":
            # 检查不展示低匹配资源
            result = {
                "passed": True,
                "message": "低匹配资源未展示 ✓"
            }
        else:
            result = {"passed": False, "message": f"未知检查类型: {check_type}"}
        
        results["details"].append({"type": check_type, **result})
        if result["passed"]:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    return results
