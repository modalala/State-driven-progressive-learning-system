#!/usr/bin/env node

/**
 * Progressive Learning Coach - 上下文状态管理模块
 *
 * 功能：
 * - 管理 .skill/context.json（agent 运行时上下文）
 * - 上下文切换（不清除项目数据，只清除 agent 运行时状态）
 * - 资源加载跟踪
 *
 * 重要原则：
 * - 不清除项目的 learning-state.json 和 memory-store.json
 * - 只清除 agent 当前运行的上下文引用
 */

const fs = require('fs');
const path = require('path');

// 上下文文件名
const SKILL_DIR = '.skill';
const CONTEXT_FILE = 'context.json';

/**
 * 获取上下文文件路径
 * @param {string} baseDir - 基础目录
 * @returns {string} 上下文文件路径
 */
function getContextPath(baseDir = process.cwd()) {
  return path.join(baseDir, SKILL_DIR, CONTEXT_FILE);
}

/**
 * 获取 .skill 目录路径
 * @param {string} baseDir - 基础目录
 * @returns {string} .skill 目录路径
 */
function getSkillDir(baseDir = process.cwd()) {
  return path.join(baseDir, SKILL_DIR);
}

/**
 * 初始化空上下文结构
 * @returns {object} 空上下文对象
 */
function createEmptyContext() {
  return {
    version: '1.0.0',
    active_project: null,
    context: {
      loaded_resources: [],
      loaded_syllabus: null,
      loaded_state: null,
      session_start: null,
      pending_todo: null
    },
    last_switch: null,
    switch_history: []
  };
}

/**
 * 加载上下文
 * @param {string} baseDir - 基础目录
 * @returns {object} 上下文对象
 */
function loadContext(baseDir = process.cwd()) {
  const contextPath = getContextPath(baseDir);

  if (!fs.existsSync(contextPath)) {
    // 创建 .skill 目录
    const skillDir = getSkillDir(baseDir);
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }

    // 创建空上下文
    const emptyContext = createEmptyContext();
    saveContext(emptyContext, baseDir);
    return emptyContext;
  }

  try {
    const content = fs.readFileSync(contextPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`加载上下文失败: ${err.message}`);
    return createEmptyContext();
  }
}

/**
 * 保存上下文
 * @param {object} context - 上下文对象
 * @param {string} baseDir - 基础目录
 */
function saveContext(context, baseDir = process.cwd()) {
  const contextPath = getContextPath(baseDir);
  const skillDir = getSkillDir(baseDir);

  // 确保 .skill 目录存在
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2), 'utf8');
}

/**
 * 清除当前上下文（释放资源引用）
 *
 * 重要：不清除项目的 learning-state.json 和 memory-store.json
 * 只清除 agent 运行时的上下文引用
 *
 * @param {string} baseDir - 基础目录
 * @returns {object} 清除后的上下文
 */
function clearContext(baseDir = process.cwd()) {
  const context = loadContext(baseDir);

  // 记录清除前的状态用于调试
  const previousProject = context.active_project;

  // 清除运行时上下文
  context.context = {
    loaded_resources: [],
    loaded_syllabus: null,
    loaded_state: null,
    session_start: null,
    pending_todo: null
  };

  context.last_clear = new Date().toISOString();
  context.previous_project = previousProject;

  saveContext(context, baseDir);

  return context;
}

/**
 * 加载项目上下文
 * @param {string} projectPath - 项目路径
 * @param {string} baseDir - 基础目录（上下文所在目录）
 * @returns {object} 加载后的上下文
 */
function loadProjectContext(projectPath, baseDir = process.cwd()) {
  const absoluteProjectPath = path.resolve(projectPath);
  const projectName = path.basename(absoluteProjectPath);

  // 检查项目有效性
  const syllabusPath = path.join(absoluteProjectPath, 'syllabus.yaml');
  if (!fs.existsSync(syllabusPath)) {
    throw new Error(`"${absoluteProjectPath}" 不是有效的学习项目`);
  }

  const context = loadContext(baseDir);

  // 更新上下文
  context.active_project = projectName;
  context.context = {
    loaded_resources: [path.join(absoluteProjectPath, 'resources', 'metadata.yaml')],
    loaded_syllabus: path.join(absoluteProjectPath, 'syllabus.yaml'),
    loaded_state: path.join(absoluteProjectPath, '.learning', 'learning-state.json'),
    session_start: new Date().toISOString(),
    pending_todo: null
  };

  saveContext(context, baseDir);

  return context;
}

/**
 * 切换项目上下文
 *
 * 流程：
 * 1. 保存当前状态（如有未完成 TODO）
 * 2. 清除上下文（释放旧资源引用）
 * 3. 加载新项目上下文
 *
 * 重要：不清除原项目的 learning-state.json 和 memory-store.json
 *
 * @param {string} targetProject - 目标项目名称或路径
 * @param {string} baseDir - 基础目录
 * @returns {object} 切换结果
 */
function switchContext(targetProject, baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  const previousProject = context.active_project;

  // 确定目标项目路径
  let targetPath;
  if (path.isAbsolute(targetProject) || targetProject.startsWith('./') || targetProject.startsWith('../')) {
    targetPath = path.resolve(baseDir, targetProject);
  } else {
    // 按项目名称查找
    const registry = require('./registry');
    const project = registry.getProject(targetProject, baseDir);
    if (project) {
      targetPath = project.path;
    } else {
      // 尝试作为相对路径
      targetPath = path.join(baseDir, targetProject);
    }
  }

  // 记录切换历史
  const switchRecord = {
    from: previousProject,
    to: path.basename(targetPath),
    timestamp: new Date().toISOString()
  };

  context.switch_history.push(switchRecord);
  context.last_switch = switchRecord.timestamp;

  // 清除旧上下文（不清除项目数据）
  clearContext(baseDir);

  // 加载新项目上下文
  const newContext = loadProjectContext(targetPath, baseDir);

  // 同时更新 registry 的 active_project
  const registry = require('./registry');
  registry.setActiveProject(path.basename(targetPath), baseDir);

  return {
    success: true,
    from: previousProject,
    to: path.basename(targetPath),
    context: newContext,
    message: `已切换到项目 "${path.basename(targetPath)}"，原项目 "${previousProject}" 的学习进度已保存`
  };
}

/**
 * 获取当前加载的资源列表
 * @param {string} baseDir - 基础目录
 * @returns {string[]} 资源路径列表
 */
function getLoadedResources(baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  return context.context.loaded_resources || [];
}

/**
 * 获取当前活跃项目名称
 * @param {string} baseDir - 基础目录
 * @returns {string|null} 项目名称
 */
function getActiveProject(baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  return context.active_project;
}

/**
 * 获取加载的 syllabus 路径
 * @param {string} baseDir - 基础目录
 * @returns {string|null} syllabus 路径
 */
function getLoadedSyllabus(baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  return context.context.loaded_syllabus;
}

/**
 * 获取加载的状态文件路径
 * @param {string} baseDir - 基础目录
 * @returns {string|null} learning-state.json 路径
 */
function getLoadedState(baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  return context.context.loaded_state;
}

/**
 * 设置待处理的 TODO
 * @param {string} todoId - TODO ID
 * @param {string} baseDir - 基础目录
 */
function setPendingTodo(todoId, baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  context.context.pending_todo = todoId;
  saveContext(context, baseDir);
}

/**
 * 清除待处理的 TODO
 * @param {string} baseDir - 基础目录
 */
function clearPendingTodo(baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  context.context.pending_todo = null;
  saveContext(context, baseDir);
}

/**
 * 获取待处理的 TODO
 * @param {string} baseDir - 基础目录
 * @returns {string|null} TODO ID
 */
function getPendingTodo(baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  return context.context.pending_todo;
}

/**
 * 检查上下文是否存在
 * @param {string} baseDir - 基础目录
 * @returns {boolean}
 */
function contextExists(baseDir = process.cwd()) {
  return fs.existsSync(getContextPath(baseDir));
}

/**
 * 获取切换历史
 * @param {string} baseDir - 基础目录
 * @returns {object[]} 切换历史记录
 */
function getSwitchHistory(baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  return context.switch_history || [];
}

/**
 * 更新会话开始时间
 * @param {string} baseDir - 基础目录
 */
function updateSessionStart(baseDir = process.cwd()) {
  const context = loadContext(baseDir);
  context.context.session_start = new Date().toISOString();
  saveContext(context, baseDir);
}

/**
 * 获取上下文状态摘要（用于展示给用户）
 * @param {string} baseDir - 基础目录
 * @returns {object} 状态摘要
 */
function getContextSummary(baseDir = process.cwd()) {
  const context = loadContext(baseDir);

  return {
    active_project: context.active_project,
    has_loaded_resources: context.context.loaded_resources?.length > 0,
    has_loaded_syllabus: context.context.loaded_syllabus !== null,
    session_start: context.context.session_start,
    pending_todo: context.context.pending_todo,
    last_switch: context.last_switch,
    previous_project: context.previous_project || null
  };
}

// 导出模块
module.exports = {
  getContextPath,
  getSkillDir,
  loadContext,
  saveContext,
  clearContext,
  loadProjectContext,
  switchContext,
  getLoadedResources,
  getActiveProject,
  getLoadedSyllabus,
  getLoadedState,
  setPendingTodo,
  clearPendingTodo,
  getPendingTodo,
  contextExists,
  getSwitchHistory,
  updateSessionStart,
  getContextSummary
};