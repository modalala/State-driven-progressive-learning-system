#!/usr/bin/env node

/**
 * PLC current 命令 - 显示当前活跃项目名称
 */

const registry = require('../registry');

function main() {
  const baseDir = process.cwd();

  if (!registry.registryExists(baseDir)) {
    console.log('当前目录没有注册的学习项目。\n');
    return;
  }

  const activeProject = registry.getActiveProject(baseDir);

  if (!activeProject) {
    console.log('没有设置活跃项目。\n');
    return;
  }

  console.log(activeProject.name);
}

module.exports = { main };

if (require.main === module) {
  main();
}