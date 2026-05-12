// 共用测试工具: 加载 floor_planner.html 到 jsdom, 暴露 app, 提供断言函数
//
// 用法:
//   const { loadApp, suite } = require('./setup');
//   loadApp((app, dom) => {
//     const t = suite('我的测试组');
//     t.ok(app.floors.length === 1, 'floors init');
//     t.done();
//   });

const path = require('path');
const fs = require('fs');

// 按需加载 jsdom (允许测试前由 run.sh 提前装好)
function getJSDOM() {
    try {
        return require('jsdom').JSDOM;
    } catch (e) {
        console.error('[setup] jsdom 未安装。请运行 bash tests/run.sh 自动安装');
        process.exit(2);
    }
}

/**
 * 加载 floor_planner.html, 构造 JSDOM 环境, 等待 app.init() 完成
 * callback(app, dom) 拿到应用实例
 */
function loadApp(callback, { htmlPath, waitMs = 300 } = {}) {
    const JSDOM = getJSDOM();
    const resolvedHtml = htmlPath || path.join(__dirname, '..', 'floor_planner.html');
    const html = fs.readFileSync(resolvedHtml, 'utf8');
    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        url: 'file://' + resolvedHtml
    });
    setTimeout(() => {
        const app = dom.window.eval('app');
        if (!app) {
            console.error('[setup] app 未初始化, 检查 floor_planner.html 的 init()');
            process.exit(2);
        }
        // 通用 mock: 让坐标转换不依赖 SVG layout
        app.svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
        try {
            callback(app, dom);
        } catch (e) {
            console.error('[setup] 测试代码抛错:', e.message);
            console.error(e.stack);
            process.exit(1);
        }
    }, waitMs);
}

/**
 * 创建一个轻量测试套件
 *   const t = suite('名字');
 *   t.ok(cond, '描述');
 *   t.eq(actual, expected, '描述');
 *   t.done();  // 打印汇总并根据失败数 exit
 */
function suite(name) {
    const results = { pass: 0, fail: 0, failures: [] };
    console.log('\n=== ' + name + ' ===');
    return {
        ok(cond, desc) {
            if (cond) {
                results.pass++;
                console.log('  ✓ ' + desc);
            } else {
                results.fail++;
                results.failures.push(desc);
                console.log('  ✗ ' + desc);
            }
        },
        eq(actual, expected, desc) {
            const same = JSON.stringify(actual) === JSON.stringify(expected);
            this.ok(same, desc + (same ? '' : ` (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`));
        },
        done() {
            const total = results.pass + results.fail;
            console.log(`--- ${name}: ${results.pass}/${total} passed ---`);
            if (results.fail > 0) {
                console.log('FAILURES:');
                results.failures.forEach(f => console.log('  - ' + f));
                process.exit(1);
            }
            process.exit(0);
        }
    };
}

/**
 * 构造假鼠标事件（JSDOM 下坐标转换需要 svg rect）
 *   const e = fakeMouseEvent(app, 100, 200, { button: 0 });
 */
function fakeMouseEvent(app, clientX, clientY, opts = {}) {
    return Object.assign({ button: 0, clientX, clientY }, opts);
}

module.exports = { loadApp, suite, fakeMouseEvent };
