// 矩形地板 (type='rect') + 窗户厚度
const { loadApp, suite } = require('./setup');

loadApp((app, dom) => {
    const doc = dom.window.document;
    const t = suite('矩形地板 + 窗户厚度');

    // ========== 窗户 thickness ==========
    app.setTool('window');
    app.onMouseDown({ button:0, clientX:100, clientY:100 });
    app.onMouseMove({ clientX:400, clientY:100 });
    app.onMouseUp({ clientX:400, clientY:100 });
    const win = app.objects.find(o => o.type === 'window');
    t.ok(win, '窗户创建');
    t.eq(win.thickness, 10, '默认厚度 10 (=100mm)');

    app.render();
    const outerLines = [...doc.querySelectorAll('#layer-objects line')]
        .filter(l => l.getAttribute('stroke') === '#1a7fc9');
    t.ok(outerLines.length >= 1, '外蓝线渲染');
    t.eq(outerLines[0].getAttribute('stroke-width'), '10', 'stroke-width = thickness');

    // 改 thickness → 重渲染
    win.thickness = 20;
    app.render();
    const outerLines2 = [...doc.querySelectorAll('#layer-objects line')]
        .filter(l => l.getAttribute('stroke') === '#1a7fc9');
    t.eq(outerLines2[0].getAttribute('stroke-width'), '20', 'thickness 20 生效');

    // 旧数据兼容 (无 thickness 字段)
    app.objects.push({ id:99, type:'window', x1:0, y1:0, x2:500, y2:0 });
    app.render();
    // 不崩溃即可
    t.ok(true, '旧数据无 thickness 不崩溃');

    // 属性面板
    app.select(win);
    const panel1 = doc.getElementById('props').innerHTML;
    t.ok(panel1.includes('窗厚'), '窗户面板有"窗厚"字段');

    // ========== 矩形地板 ==========
    app.setTool('rect');
    app.onMouseDown({ button:0, clientX:200, clientY:200 });
    t.ok(app.drawing && app.drawing.type === 'rect', '开始绘制 rect');
    t.ok(app.drawing.color, '有默认颜色');
    app.onMouseMove({ clientX:800, clientY:600 });
    t.ok(app.drawing.w === 600 && app.drawing.h === 400, '预览跟随');
    // 实际拖到足够大的位置再 mouseUp 会保存; 这里切换回 select 测试"取消"
    app.setTool('select');  // 切换工具清除 drawing

    // 独立测试: 短距离应被拒绝
    app.setTool('rect');
    app.onMouseDown({ button:0, clientX:200, clientY:200 });
    app.onMouseMove({ clientX:205, clientY:205 });  // 只拖 5 单位
    app.onMouseUp({ clientX:205, clientY:205 });
    t.ok(!app.objects.some(o => o.type === 'rect'), '太小的矩形不保存');

    // 有效矩形保存
    app.setTool('rect');
    app.onMouseDown({ button:0, clientX:300, clientY:300 });
    app.onMouseMove({ clientX:700, clientY:500 });
    app.onMouseUp({ clientX:700, clientY:500 });
    const rect = app.objects.find(o => o.type === 'rect');
    t.ok(rect, '矩形保存');
    t.ok(rect.x === 300 && rect.w === 400, '坐标正确');
    t.ok(rect.color && rect.opacity === 0.6, '有颜色和透明度');

    // 置底 (unshift 到数组开头)
    const wallBefore = app.objects.filter(o => o.type === 'wall').length;
    app.objects.push({ id:888, type:'wall', x1:0, y1:0, x2:100, y2:0 });
    app.setTool('rect');
    app.onMouseDown({ button:0, clientX:1000, clientY:1000 });
    app.onMouseMove({ clientX:1200, clientY:1200 });
    app.onMouseUp({ clientX:1200, clientY:1200 });
    t.eq(app.objects[0].type, 'rect', '新 rect 在索引 0 (置底)');

    // 反向拖
    app.setTool('rect');
    app.onMouseDown({ button:0, clientX:2000, clientY:2000 });
    app.onMouseMove({ clientX:1500, clientY:1500 });
    app.onMouseUp({ clientX:1500, clientY:1500 });
    const back = app.objects[0];
    t.ok(back.x === 1500 && back.w === 500, '反向拖动被规范化');

    // 命中
    app.setTool('select');
    t.ok(app.hitTest({x:1700, y:1700}) === back, 'hitTest 找到 rect');

    // 渲染
    app.render();
    const fills = doc.querySelectorAll('#layer-objects rect[fill-opacity]');
    t.ok(fills.length >= 2, 'rects 有 fill-opacity 属性');

    // 属性面板
    app.select(back);
    const panel2 = doc.getElementById('props').innerHTML;
    t.ok(panel2.includes('填充色'), '面板有填充色');
    t.ok(panel2.includes('透明度'), '面板有透明度');

    // 改属性
    app.setProp('color', '#ff0000');
    t.eq(back.color, '#ff0000', '颜色更新');
    app.setProp('opacity', 0.3);
    t.eq(back.opacity, 0.3, '透明度更新');
    app.setProp('name', '客厅');
    t.eq(back.name, '客厅', '名称设置');

    // 渲染名称标签
    app.render();
    const labels = [...doc.querySelectorAll('#layer-objects text')];
    t.ok(labels.some(el => el.textContent === '客厅'), '名称渲染为标签');

    // 缩放手柄
    t.eq(app.hitHandle({x:back.x, y:back.y}, back), 'nw', 'rect 有 nw 手柄');

    // 删除
    const beforeDel = app.objects.length;
    app.deleteSelected();
    t.eq(app.objects.length, beforeDel - 1, 'rect 可删除');

    // JSON 往返
    app.objects.push({ id:500, type:'rect', x:0, y:0, w:100, h:100,
                        color:'#00ff00', opacity:0.4, name:'厨房', rot:0 });
    const json = JSON.stringify({version:2, floors:app.floors, currentFloor:0, nextId:app.nextId});
    app.importData(JSON.parse(json));
    const r2 = app.objects.find(o => o.type === 'rect' && o.name === '厨房');
    t.ok(r2 && r2.color === '#00ff00', 'rect JSON 往返');

    t.done();
});
