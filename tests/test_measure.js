// 皮尺工具: 绘制 + 选中 + 端点拖动 + 属性面板 + JSON / undo
const { loadApp, suite, fakeMouseEvent } = require('./setup');

loadApp((app, dom) => {
    const doc = dom.window.document;
    const t = suite('皮尺测量');

    // ========== 1. 绘制 ==========
    app.setTool('measure');
    app.onMouseDown(fakeMouseEvent(app, 100, 100));
    t.ok(app.measuring != null, '首次点击开始 measuring');
    app.onMouseMove(fakeMouseEvent(app, 400, 100));
    t.eq(app.measuring.x2, 400, '预览跟随鼠标');
    app.onMouseDown(fakeMouseEvent(app, 400, 100));
    t.ok(app.measuring === null, '第二次点击清空 measuring');
    const m1 = app.objects.find(o => o.type === 'measure');
    t.ok(m1, '测量保存到 objects');
    t.ok(m1.x1===100 && m1.x2===400, '坐标正确');
    t.ok(m1.id, '分配了 id');

    // ========== 2. 可选中 ==========
    app.setTool('select');
    const hit = app.hitTest({ x: 250, y: 100 });
    t.ok(hit === m1, 'hitTest 命中测量线');
    app.select(m1);
    t.ok(app.selected === m1, '可选中');

    // ========== 3. 端点识别 ==========
    t.eq(app.pickEndpoint({x:100, y:100}, m1), 1, '起点 endpoint=1');
    t.eq(app.pickEndpoint({x:400, y:100}, m1), 2, '终点 endpoint=2');
    t.eq(app.pickEndpoint({x:250, y:100}, m1), 0, '中间 endpoint=0');

    // ========== 4. 整体平移 (方向键) ==========
    app.select(m1);
    app.nudgeSelected(50, 30);
    t.ok(m1.x1 === 150 && m1.y1 === 130 && m1.x2 === 450 && m1.y2 === 130, '方向键整体平移');

    // ========== 5. 删除 ==========
    const before = app.objects.length;
    app.deleteSelected();
    t.eq(app.objects.length, before - 1, 'delete 移除');
    t.ok(!app.objects.some(o => o.type === 'measure'), '无测量残留');

    // ========== 6. 属性面板 ==========
    app.objects.push({ id:100, type:'measure', x1:0, y1:0, x2:500, y2:300 });
    app.select(app.objects[app.objects.length-1]);
    const panel = doc.getElementById('props').innerHTML;
    t.ok(panel.includes('X1'), '面板有 X1');
    t.ok(panel.includes('测量结果'), '面板有测量结果');
    // sqrt(500^2 + 300^2) * 10 = 5831mm
    t.ok(panel.includes('5831'), '显示计算长度 5831 mm');

    // ========== 7. 渲染为红色线 ==========
    app.render();
    const lines = doc.querySelectorAll('line[stroke="#dc2626"]');
    t.ok(lines.length > 0, '渲染为红色虚线');

    // ========== 8. clearMeasures 选择性清除 ==========
    app.objects.push({ id:201, type:'wall', x1:0, y1:0, x2:100, y2:0 });
    app.objects.push({ id:202, type:'measure', x1:100, y1:100, x2:200, y2:200 });
    app.objects.push({ id:203, type:'measure', x1:300, y1:300, x2:400, y2:400 });
    const wallsBefore = app.objects.filter(o => o.type === 'wall').length;
    app.clearMeasures();
    t.eq(app.objects.filter(o => o.type === 'measure').length, 0, '所有测量被清');
    t.eq(app.objects.filter(o => o.type === 'wall').length, wallsBefore, '墙不受影响');

    // ========== 9. JSON 往返 ==========
    app.objects.push({ id:300, type:'measure', x1:0, y1:0, x2:1000, y2:500 });
    const json = JSON.stringify({ version:2, floors: app.floors, currentFloor:0, nextId: app.nextId });
    app.importData(JSON.parse(json));
    t.ok(app.objects.some(o => o.type === 'measure' && o.x2 === 1000), '测量线 JSON 往返成功');

    // ========== 10. undo/redo ==========
    app.objects = [];
    app.nextId = 1;
    app.pushHistory();
    app.objects.push({ id:1, type:'measure', x1:0, y1:0, x2:100, y2:0 });
    app.pushHistory();
    t.eq(app.objects.length, 1, '添加测量');
    app.undo();
    t.eq(app.objects.length, 0, 'undo 撤销');
    app.redo();
    t.eq(app.objects.length, 1, 'redo 重做');

    // ========== 11. 端点拖动完整流程 ==========
    app.objects = [];
    app.nextId = 10;
    app.objects.push({ id:10, type:'measure', x1:100, y1:100, x2:400, y2:100 });
    const m = app.objects[0];
    app.setTool('select');
    app.select(m);
    // clientToWorld 简化
    app.clientToWorld = (cx, cy) => ({ x: cx, y: cy });
    app.onMouseDown({ button:0, clientX:100, clientY:100 });
    t.ok(app.dragState && app.dragState.type === 'move-end', 'dragState = move-end');
    t.eq(app.dragState.endpoint, 1, '拾取 endpoint 1');
    app.onMouseMove({ clientX:150, clientY:200 });
    app.onMouseUp({ clientX:150, clientY:200 });
    t.ok(m.x1 === 150 && m.y1 === 200, '端点 1 拖到 (150, 200)');
    t.ok(m.x2 === 400 && m.y2 === 100, '端点 2 未动');

    t.done();
});
