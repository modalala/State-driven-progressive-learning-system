#!/usr/bin/env node

/**
 * Progressive Learning Coach - 本地注册表管理模块
 *
 * 功能：
 * - 管理 .skill/registry.json（当前目录下的项目注册表）
 * - 项目发现、注册、注销
 * - 活跃项目跟踪
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // 需要在 package.json 中添加依赖

// 注册表文件名
const SKILL_DIR = '.skill';
const REGISTRY_FILE = 'registry.json';

/**
 * 获取注册表文件路径
 * @param {string} baseDir - 基础目录（默认当前工作目录）
 * @returns {string} 注册表文件路径
 */
function getRegistryPath(baseDir = process.cwd()) {
  return path.join(baseDir, SKILL_DIR, REGISTRY_FILE);
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
 * 初始化空注册表结构
 * @returns {object} 空注册表对象
 */
function createEmptyRegistry() {
  return {
    version: '1.0.0',
    projects: {},
    active_project: null,
    statistics: {
      total_projects: 0,
      total_study_time_minutes: 0,
      total_todos_completed: 0
    }
  };
}

/**
 * 加载注册表
 * @param {string} baseDir - 基础目录
 * @returns {object} 注册表对象
 */
function loadRegistry(baseDir = process.cwd()) {
  const registryPath = getRegistryPath(baseDir);

  if (!fs.existsSync(registryPath)) {
    // 创建 .skill 目录
    const skillDir = getSkillDir(baseDir);
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }

    // 创建空注册表
    const emptyRegistry = createEmptyRegistry();
    saveRegistry(emptyRegistry, baseDir);
    return emptyRegistry;
  }

  try {
    const content = fs.readFileSync(registryPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`加载注册表失败: ${err.message}`);
    return createEmptyRegistry();
  }
}

/**
 * 保存注册表
 * @param {object} registry - 注册表对象
 * @param {string} baseDir - 基础目录
 */
function saveRegistry(registry, baseDir = process.cwd()) {
  const registryPath = getRegistryPath(baseDir);
  const skillDir = getSkillDir(baseDir);

  // 确保 .skill 目录存在
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  // 更新时间戳
  registry.last_updated = new Date().toISOString();

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
}

/**
 * 从 syllabus.yaml 提取项目元信息
 * @param {string} projectPath - 项目路径
 * @returns {object} 项目元信息
 */
function extractProjectMeta(projectPath) {
  const syllabusPath = path.join(projectPath, 'syllabus.yaml');

  if (!fs.existsSync(syllabusPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(syllabusPath, 'utf8');
    const syllabus = yaml.load(content);

    return {
      domain: syllabus.meta?.domain || 'unknown',
      domain_cn: syllabus.meta?.domain_cn || syllabus.meta?.domain || '未知领域',
      total_lessons: syllabus.meta?.total_lessons || 0,
      estimated_hours: syllabus.meta?.estimated_total_hours || 0
    };
  } catch (err) {
    console.error(`读取 syllabus.yaml 失败: ${err.message}`);
    return null;
  }
}

/**
 * 从 learning-state.json 提取项目状态
 * @param {string} projectPath - 项目路径
 * @returns {object} 项目状态
 */
function extractProjectStatus(projectPath) {
  const statePath = path.join(projectPath, '.learning', 'learning-state.json');

  if (!fs.existsSync(statePath)) {
    return {
      global_status: 'new',
      current_lesson: null,
      progress_percentage: 0,
      todos_completed: 0,
      todos_total: 0,
      total_study_time_minutes: 0,
      last_session: null
    };
  }

  try {
    const content = fs.readFileSync(statePath, 'utf8');
    const state = JSON.parse(content);

    // 计算进度百分比
    const totalTodos = state.statistics?.todos_total || 0;
    const completedTodos = state.statistics?.todos_completed || 0;
    const progressPercentage = totalTodos > 0
      ? Math.round((completedTodos / totalTodos) * 100)
      : 0;

    return {
      global_status: state.learning_state?.global_status || 'new',
      current_lesson: state.learning_state?.current_lesson || null,
      progress_percentage: progressPercentage,
      todos_completed: completedTodos,
      todos_total: totalTodos,
      total_study_time_minutes: state.statistics?.total_study_time_minutes || 0,
      last_session: state.learning_state?.last_session || null
    };
  } catch (err) {
    console.error(`读取 learning-state.json 失败: ${err.message}`);
    return {
      global_status: 'new',
      current_lesson: null,
      progress_percentage: 0,
      todos_completed: 0,
      todos_total: 0,
      total_study_time_minutes: 0,
      last_session: null
    };
  }
}

/**
 * 注册项目
 * @param {string} projectPath - 项目路径
 * @param {string} baseDir - 基础目录（注册表所在目录）
 * @returns {object} 注册的项目信息
 */
function registerProject(projectPath, baseDir = process.cwd()) {
  const absoluteProjectPath = path.resolve(projectPath);
  const projectName = path.basename(absoluteProjectPath);

  // 检查是否是有效的学习项目
  const syllabusPath = path.join(absoluteProjectPath, 'syllabus.yaml');
  if (!fs.existsSync(syllabusPath)) {
    throw new Error(`"${absoluteProjectPath}" 不是有效的学习项目（缺少 syllabus.yaml）`);
  }

  // 提取项目信息
  const meta = extractProjectMeta(absoluteProjectPath);
  const status = extractProjectStatus(absoluteProjectPath);

  // 构建项目记录
  const projectRecord = {
    name: projectName,
    display_name: meta?.domain_cn || projectName,
    domain: meta?.domain || 'unknown',
    path: absoluteProjectPath,
    relative_path: path.relative(baseDir, absoluteProjectPath),
    status: status,
    metadata: {
      total_lessons: meta?.total_lessons || 0,
      estimated_total_hours: meta?.estimated_hours || 0
    },
    created_at: new Date().toISOString(),
    is_active: false
  };

  // 加载并更新注册表
  const registry = loadRegistry(baseDir);

  // 检查是否已注册
  if (registry.projects[projectName]) {
    // 更新现有记录
    registry.projects[projectName] = {
      ...registry.projects[projectName],
      ...projectRecord,
      created_at: registry.projects[projectName].created_at // 保留原创建时间
    };
  } else {
    // 新增项目
    registry.projects[projectName] = projectRecord;
    registry.statistics.total_projects += 1;
  }

  // 如果是第一个项目，设置为活跃项目
  if (!registry.active_project) {
    registry.active_project = projectName;
    registry.projects[projectName].is_active = true;
  }

  saveRegistry(registry, baseDir);

  return projectRecord;
}

/**
 * 注销项目
 * @param {string} projectName - 项目名称
 * @param {string} baseDir - 基础目录
 * @returns {boolean} 是否成功注销
 */
function unregisterProject(projectName, baseDir = process.cwd()) {
  const registry = loadRegistry(baseDir);

  if (!registry.projects[projectName]) {
    return false;
  }

  // 如果是活跃项目，需要切换
  if (registry.active_project === projectName) {
    const otherProjects = Object.keys(registry.projects).filter(p => p !== projectName);
    registry.active_project = otherProjects.length > 0 ? otherProjects[0] : null;
    if (registry.active_project) {
      registry.projects[registry.active_project].is_active = true;
    }
  }

  delete registry.projects[projectName];
  registry.statistics.total_projects -= 1;

  saveRegistry(registry, baseDir);

  return true;
}

/**
 * 获取单个项目信息
 * @param {string} projectName - 项目名称
 * @param {string} baseDir - 基础目录
 * @returns {object|null} 项目信息
 */
function getProject(projectName, baseDir = process.cwd()) {
  const registry = loadRegistry(baseDir);
  return registry.projects[projectName] || null;
}

/**
 * 列出所有项目
 * @param {string} baseDir - 基础目录
 * @returns {object[]} 项目列表
 */
function listProjects(baseDir = process.cwd()) {
  const registry = loadRegistry(baseDir);
  return Object.entries(registry.projects).map(([name, project]) => ({
    name,
    ...project
  }));
}

/**
 * 设置活跃项目
 * @param {string} projectName - 项目名称
 * @param {string} baseDir - 基础目录
 * @returns {boolean} 是否成功设置
 */
function setActiveProject(projectName, baseDir = process.cwd()) {
  const registry = loadRegistry(baseDir);

  if (!registry.projects[projectName]) {
    return false;
  }

  // 清除当前活跃项目的标记
  if (registry.active_project) {
    registry.projects[registry.active_project].is_active = false;
  }

  // 设置新的活跃项目
  registry.active_project = projectName;
  registry.projects[projectName].is_active = true;

  saveRegistry(registry, baseDir);

  return true;
}

/**
 * 获取当前活跃项目
 * @param {string} baseDir - 基础目录
 * @returns {object|null} 活跃项目信息
 */
function getActiveProject(baseDir = process.cwd()) {
  const registry = loadRegistry(baseDir);

  if (!registry.active_project) {
    return null;
  }

  return registry.projects[registry.active_project] || null;
}

/**
 * 发现当前目录下的所有学习项目
 * @param {string} baseDir - 基础目录
 * @returns {object[]} 发现的项目列表
 */
function discoverProjects(baseDir = process.cwd()) {
  const discovered = [];

  // 扫描当前目录下的子目录
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // 跳过 .skill 和其他隐藏目录
    if (entry.name.startsWith('.')) continue;

    const subDirPath = path.join(baseDir, entry.name);
    const syllabusPath = path.join(subDirPath, 'syllabus.yaml');

    if (fs.existsSync(syllabusPath)) {
      discovered.push({
        name: entry.name,
        path: subDirPath,
        is_registered: false // 需要后续检查注册表
      });
    }
  }

  return discovered;
}

/**
 * 同步项目状态（从项目的 learning-state.json 更新注册表）
 * @param {string} projectName - 项目名称
 * @param {string} baseDir - 基础目录
 */
function syncProjectStatus(projectName, baseDir = process.cwd()) {
  const registry = loadRegistry(baseDir);

  if (!registry.projects[projectName]) {
    return;
  }

  const project = registry.projects[projectName];
  const status = extractProjectStatus(project.path);

  registry.projects[projectName].status = status;

  // 更新全局统计
  registry.statistics.total_study_time_minutes = Object.values(registry.projects)
    .reduce((sum, p) => sum + (p.status?.total_study_time_minutes || 0), 0);
  registry.statistics.total_todos_completed = Object.values(registry.projects)
    .reduce((sum, p) => sum + (p.status?.todos_completed || 0), 0);

  saveRegistry(registry, baseDir);
}

/**
 * 检查注册表是否存在
 * @param {string} baseDir - 基础目录
 * @returns {boolean}
 */
function registryExists(baseDir = process.cwd()) {
  return fs.existsSync(getRegistryPath(baseDir));
}

// 导出模块
module.exports = {
  getRegistryPath,
  getSkillDir,
  loadRegistry,
  saveRegistry,
  registerProject,
  unregisterProject,
  getProject,
  listProjects,
  setActiveProject,
  getActiveProject,
  discoverProjects,
  syncProjectStatus,
  registryExists,
  extractProjectMeta,
  extractProjectStatus
};