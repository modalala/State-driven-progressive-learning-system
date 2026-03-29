#!/usr/bin/env node

/**
 * PLC register 命令 - 注册外部项目
 *
 * 用法: plc register <项目路径>
 */

const path = require('path');
const registry = require('../registry');

function main(projectPath) {
  const baseDir = process.cwd();

  console.log('\n📝 注册项目\n');

  if (!projectPath) {
    console.log('用法: plc register <项目路径>\n');
    console.log('示例: plc register ../my-learning-project\n');
    return;
  }

  const absolutePath = path.resolve(baseDir, projectPath);

  try {
    const result = registry.registerProject(absolutePath, baseDir);

    console.log(`✅ 已注册项目: ${result.display_name}`);
    console.log(`   名称: ${result.name}`);
    console.log(`   路径: ${result.path}`);
    console.log(`   领域: ${result.domain}`);
    console.log('');

    console.log('下一步:');
    console.log(`  plc switch ${result.name}  切换到此项目`);
    console.log('  对 AI 说 "继续学习" 开始学习\n');

  } catch (err) {
    console.log(`注册失败: ${err.message}\n`);
  }
}

module.exports = { main };

if (require.main === module) {
  const projectPath = process.argv[2];
  main(projectPath);
}