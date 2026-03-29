#!/usr/bin/env node

/**
 * PLC list 命令 - 列出当前目录下所有学习项目
 *
 * 用法: plc list [-v]
 */

const path = require('path');
const registry = require('../registry');

/**
 * 格式化时间显示
 * @param {string|null} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
function formatTime(timestamp) {
  if (!timestamp) return '-';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? '刚刚' : `${diffMinutes}分钟前`;
    }
    return `${diffHours}小时前`;
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

/**
 * 格式化学习时间
 * @param {number} minutes - 分钟数
 * @returns {string} 格式化后的时间
 */
function formatStudyTime(minutes) {
  if (!minutes || minutes === 0) return '-';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * 获取状态图标
 * @param {string} status - 状态
 * @returns {string} 状态图标
 */
function getStatusIcon(status) {
  switch (status) {
    case 'active': return '🟢';
    case 'paused': return '🟡';
    case 'completed': return '✅';
    case 'new': return '⚪';
    default: return '⚪';
  }
}

/**
 * 打印表格
 * @param {object[]} data - 数据
 * @param {string[]} headers - 表头
 */
function printTable(data, headers) {
  // 计算每列最大宽度
  const widths = headers.map((h, i) => {
    const maxDataWidth = Math.max(...data.map(row => String(row[i] || '').length));
    return Math.max(h.length, maxDataWidth);
  });

  // 打印表头
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join('  ');
  console.log('  ' + headerRow);
  console.log('  ' + widths.map(w => '─'.repeat(w)).join('  '));

  // 打印数据行
  for (const row of data) {
    const dataRow = row.map((cell, i) => String(cell || '').padEnd(widths[i])).join('  ');
    console.log('  ' + dataRow);
  }
}

/**
 * 主函数
 * @param {object} options - 命令选项
 */
function main(options = {}) {
  const baseDir = process.cwd();
  const verbose = options.verbose || options.v || false;

  console.log('\n🎓 Progressive Learning Coach - 项目列表\n');

  // 检查注册表是否存在
  if (!registry.registryExists(baseDir)) {
    // 尝试发现项目
    const discovered = registry.discoverProjects(baseDir);

    if (discovered.length === 0) {
      console.log('当前目录没有学习项目。\n');
      console.log('使用 "plc init <项目名>" 创建新项目。\n');
      return;
    }

    console.log(`发现 ${discovered.length} 个未注册的学习项目:\n`);

    for (const project of discovered) {
      console.log(`  📁 ${project.name}`);
      console.log(`     路径: ${project.path}`);
      console.log('');
    }

    console.log('使用 "plc register <项目名>" 注册这些项目。\n');
    return;
  }

  // 加载注册表
  const projects = registry.listProjects(baseDir);

  if (projects.length === 0) {
    console.log('已注册 0 个学习项目。\n');
    console.log('使用 "plc init <项目名>" 创建新项目。\n');
    return;
  }

  // 同步所有项目状态
  for (const project of projects) {
    registry.syncProjectStatus(project.name, baseDir);
  }

  // 重新加载更新后的数据
  const updatedProjects = registry.listProjects(baseDir);
  const activeProject = registry.getActiveProject(baseDir);

  // 简单列表模式
  const tableData = updatedProjects.map((p, index) => {
    const isActive = p.name === activeProject?.name;
    return [
      isActive ? `${index + 1}*` : `${index + 1}`,
      getStatusIcon(p.status?.global_status) + ' ' + p.display_name,
      p.status?.global_status || 'new',
      `${p.status?.progress_percentage || 0}%`,
      p.status?.current_lesson || '-',
      formatTime(p.status?.last_session)
    ];
  });

  printTable(tableData, ['#', '项目名称', '状态', '进度', '当前课程', '最后学习']);

  console.log('\n当前激活: ' + (activeProject?.display_name || '无') + '\n');

  // 详细模式
  if (verbose) {
    console.log('详细信息:\n');

    for (const p of updatedProjects) {
      const isActive = p.name === activeProject?.name;
      console.log(`📁 ${p.display_name} ${isActive ? '(当前)' : ''}`);
      console.log(`   名称: ${p.name}`);
      console.log(`   路径: ${p.path}`);
      console.log(`   领域: ${p.domain}`);
      console.log(`   课程数: ${p.metadata?.total_lessons || 0}`);
      console.log(`   预计时长: ${p.metadata?.estimated_total_hours || 0}h`);
      console.log(`   学习时间: ${formatStudyTime(p.status?.total_study_time_minutes)}`);
      console.log(`   完成 TODO: ${p.status?.todos_completed}/${p.status?.todos_total}`);
      console.log('');
    }

    // 统计汇总
    const reg = registry.loadRegistry(baseDir);
    console.log('统计汇总:');
    console.log(`  总项目数: ${reg.statistics.total_projects}`);
    console.log(`  总学习时间: ${formatStudyTime(reg.statistics.total_study_time_minutes)}`);
    console.log(`  总完成 TODO: ${reg.statistics.total_todos_completed}\n`);
  }

  console.log('操作提示:');
  console.log('  [数字]  切换到对应项目');
  console.log('  plc switch <项目名>  切换项目');
  console.log('  plc status           查看当前项目详情\n');
}

// 导出
module.exports = { main };

// 如果直接运行
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('-v') || args.includes('--verbose')
  };
  main(options);
}