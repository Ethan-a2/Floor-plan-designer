// 冒烟测试: 语法 OK + app 初始化 + 关键 API 存在
// 这是最快的一个, 任何大改后先跑这个
const path = require('path');
const fs = require('fs');

console.log('\n=== 冒烟测试 ===');
let pass = 0, fail = 0;
const ok = (cond, desc) => {
    if (cond) { pass++; console.log('  ✓ ' + desc); }
    else { fail++; console.log('  ✗ ' + desc); }
};

// ============ 1. 语法检查 ============
const htmlPath = path.join(__dirname, '..', 'floor_planner.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
ok(m, '找到 <script> 块');
try {
    new Function(m[1]);
    ok(true, '脚本语法有效');
} catch (e) {
    ok(false, '脚本语法有效: ' + e.message);
    console.log('\n--- 1/2 passed ---');
    process.exit(1);
}

// ============ 2. JSDOM 启动 + app 初始化 ============
const { loadApp } = require('./setup');
loadApp((app, dom) => {
    ok(app, 'app 对象存在');
    ok(Array.isArray(app.floors), 'app.floors 是数组');
    ok(app.floors.length === 1, '默认 1 层');
    ok(app.floors[0].name === '1F', '默认名 1F');
    ok(Array.isArray(app.objects), 'objects 是数组');
    ok(app.objects.length === 0, '初始无对象');
    ok(typeof app.render === 'function', 'render 存在');
    ok(typeof app.hitTest === 'function', 'hitTest 存在');
    ok(typeof app.pushHistory === 'function', 'pushHistory 存在');
    ok(typeof app.undo === 'function', 'undo 存在');
    ok(typeof app.importData === 'function', 'importData 存在');
    ok(typeof app.saveJSON === 'function', 'saveJSON 存在');
    ok(typeof app.exportSVG === 'function', 'exportSVG 存在');
    ok(typeof app.exportDXF === 'function', 'exportDXF 存在');

    // 关键功能方法
    ok(typeof app.clearMeasures === 'function', 'clearMeasures 存在 (皮尺)');
    ok(typeof app.bringToFront === 'function', 'bringToFront 存在 (图层)');
    ok(typeof app.importBackground === 'function', 'importBackground 存在 (底图)');
    ok(typeof app.importSvgComponent === 'function', 'importSvgComponent 存在');
    ok(typeof app.nudgeSelected === 'function', 'nudgeSelected 存在 (方向键)');

    // 重要 FURNITURE 库
    ok(Array.isArray(app.FURNITURE) && app.FURNITURE.length > 50, '家具库非空 (>50 项)');

    const total = pass + fail;
    console.log(`--- 冒烟测试: ${pass}/${total} passed ---`);
    process.exit(fail > 0 ? 1 : 0);
});
