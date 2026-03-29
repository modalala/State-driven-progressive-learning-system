#!/usr/bin/env node

/**
 * PLC status 命令 - 显示当前项目详细状态
 *
 * 用法: plc status [项目名]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const registry = require('../registry');
const context = require('../context');

/**
 * 格式化时间显示
 */
function formatTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}

/**
 * 格式化学习时间
 */
function formatStudyTime(minutes) {
  if (!minutes || minutes === 0) return '0分钟';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  return `${mins}分钟`;
}

/**
 * 获取状态图标
 */
function getStatusIcon(status) {
  const icons = {
    'active': '🟢 进行中',
    'paused': '🟡 已暂停',
    'completed': '✅ 已完成',
    'new': '⚪ 未开始',
    'locked': '🔒 未解锁',
    'unlocked': '🔓 已解锁',
    'in_progress': '📖 学习中',
    'todo_active': '✓ TODO激活'
  };
  return icons[status] || status;
}

/**
 * 读取课程进度详情
 */
function getLessonProgress(projectPath) {
  const statePath = path.join(projectPath, '.learning', 'learning-state.json');

  if (!fs.existsSync(statePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(statePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * 读取课程大纲
 */
function getSyllabus(projectPath) {
  const syllabusPath = path.join(projectPath, 'syllabus.yaml');

  if (!fs.existsSync(syllabusPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(syllabusPath, 'utf8');
    return yaml.load(content);
  } catch (err) {
    return null;
  }
}

/**
 * 主函数
 */
function main(projectName = null) {
  const baseDir = process.cwd();

  console.log('\n📊 项目状态\n');

  // 检查注册表
  if (!registry.registryExists(baseDir)) {
    console.log('当前目录没有注册的学习项目。\n');
    console.log('使用 "plc init" 创建新项目。\n');
    return;
  }

  // 获取目标项目
  let targetProject;
  if (projectName) {
    targetProject = registry.getProject(projectName, baseDir);
    if (!targetProject) {
      console.log(`项目 "${projectName}" 不存在。\n`);
      const projects = registry.listProjects(baseDir);
      console.log('可用项目:');
      for (const p of projects) {
        console.log(`  - ${p.name}`);
      }
      console.log('');
      return;
    }
  } else {
    targetProject = registry.getActiveProject(baseDir);
    if (!targetProject) {
      console.log('没有设置活跃项目。\n');
      console.log('使用 "plc list" 查看所有项目。\n');
      return;
    }
  }

  // 同步状态
  registry.syncProjectStatus(targetProject.name, baseDir);
  targetProject = registry.getProject(targetProject.name, baseDir);

  // 显示基本信息
  console.log(`📁 ${targetProject.display_name}`);
  console.log(`   名称: ${targetProject.name}`);
  console.log(`   路径: ${targetProject.path}`);
  console.log('');

  console.log('学习状态:');
  console.log(`   状态: ${getStatusIcon(targetProject.status?.global_status)}`);
  console.log(`   当前课程: ${targetProject.status?.current_lesson || '未开始'}`);
  console.log(`   进度: ${targetProject.status?.progress_percentage || 0}%`);
  console.log(`   学习时间: ${formatStudyTime(targetProject.status?.total_study_time_minutes)}`);
  console.log(`   最后学习: ${formatTime(targetProject.status?.last_session)}`);
  console.log('');

  console.log('TODO 统计:');
  console.log(`   已完成: ${targetProject.status?.todos_completed || 0}`);
  console.log(`   总数: ${targetProject.status?.todos_total || 0}`);
  console.log('');

  // 读取详细进度
  const state = getLessonProgress(targetProject.path);
  const syllabus = getSyllabus(targetProject.path);

  if (state && syllabus && state.syllabus_progress) {
    console.log('课程进度详情:\n');

    for (const lesson of syllabus.syllabus || []) {
      const lessonState = state.syllabus_progress[lesson.id];
      const status = lessonState?.status || 'locked';
      const icon = getStatusIcon(status);

      console.log(`   ${icon} ${lesson.id}: ${lesson.title}`);
      if (lesson.subtitle) {
        console.log(`      ${lesson.subtitle}`);
      }
      if (lessonState && lessonState.todos) {
        const completedTodos = Object.values(lessonState.todos)
          .filter(t => t.status === 'completed').length;
        const totalTodos = Object.keys(lessonState.todos).length;
        console.log(`      TODO: ${completedTodos}/${totalTodos}`);
      }
      console.log('');
    }
  }

  // 上下文状态
  const ctxSummary = context.getContextSummary(baseDir);
  if (targetProject.name === registry.getActiveProject(baseDir)?.name) {
    console.log('上下文状态:');
    console.log(`   会话开始: ${formatTime(ctxSummary.session_start)}`);
    if (ctxSummary.pending_todo) {
      console.log(`   待处理 TODO: ${ctxSummary.pending_todo}`);
    }
    console.log('');
  }

  console.log('操作提示:');
  console.log('  plc switch <项目名>  切换项目');
  console.log('  对 AI 说 "继续学习"  开始学习\n');
}

// 导出
module.exports = { main };

// 如果直接运行
if (require.main === module) {
  const projectName = process.argv[2];
  main(projectName);
}