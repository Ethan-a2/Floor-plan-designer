// 键盘方向键移动对象 + Ctrl+C 复制 + 防抖历史
const { loadApp, suite } = require('./setup');

loadApp((app, dom) => {
    const t = suite('键盘交互');

    const key = (opts) => {
        const e = new dom.window.KeyboardEvent('keydown', { bubbles:true, cancelable:true, ...opts });
        app.onKey(e);
    };

    // ========== 1. 方向键移动家具 ==========
    app.objects.push({ id:1, type:'furniture', fid:'bed_d', name:'床', x:100, y:100, w:180, h:200, rot:0 });
    app.select(app.objects[0]);

    key({ key:'ArrowRight' });
    t.eq(app.objects[0].x, 110, '→ +10 (1 grid)');
    key({ key:'ArrowDown' });
    t.eq(app.objects[0].y, 110, '↓ +10');
    key({ key:'ArrowLeft' });
    t.eq(app.objects[0].x, 100, '← -10');
    key({ key:'ArrowUp' });
    t.eq(app.objects[0].y, 100, '↑ -10');
    key({ key:'ArrowRight', shiftKey:true });
    t.eq(app.objects[0].x, 200, 'Shift+→ +100 (10x)');

    // ========== 2. 墙 (x1/y1/x2/y2) 整体平移 ==========
    app.objects.push({ id:2, type:'wall', x1:0, y1:0, x2:100, y2:0, thickness:24 });
    app.select(app.objects[1]);
    key({ key:'ArrowDown' });
    const w = app.objects[1];
    t.ok(w.y1===10 && w.y2===10 && w.x1===0 && w.x2===100, '墙整体平移');

    // ========== 3. 无选中时无动作 ==========
    app.select(null);
    const snap = JSON.stringify(app.objects);
    key({ key:'ArrowRight' });
    t.eq(JSON.stringify(app.objects), snap, '无选中时方向键无效');

    // ========== 4. Ctrl+C 复制 ==========
    app.nextId = 100;  // 避免 id 冲突
    app.select(app.objects[0]);
    const before = app.objects.length;
    key({ key:'c', ctrlKey:true });
    t.eq(app.objects.length, before + 1, 'Ctrl+C 新增对象');
    const copy = app.objects[app.objects.length-1];
    t.eq(copy.type, 'furniture', '复制保留类型');
    t.ok(copy.id !== app.objects[0].id, '复制有新 id');
    t.ok(copy.x !== app.objects[0].x, '复制有偏移');

    // 大写 C 也生效
    app.select(copy);
    const b2 = app.objects.length;
    key({ key:'C', ctrlKey:true });
    t.eq(app.objects.length, b2 + 1, 'Ctrl+Shift+C / 大写 C 也行');

    // Ctrl+D 继续有效
    app.select(app.objects[app.objects.length-1]);
    const b3 = app.objects.length;
    key({ key:'d', ctrlKey:true });
    t.eq(app.objects.length, b3 + 1, 'Ctrl+D 依然可用');

    // ========== 5. INPUT 内不劫持 ==========
    const input = dom.window.document.createElement('input');
    dom.window.document.body.appendChild(input);
    app.select(app.objects[0]);
    const snapX = app.objects[0].x;
    const e2 = new dom.window.KeyboardEvent('keydown', { key:'ArrowRight', bubbles:true });
    Object.defineProperty(e2, 'target', { value: input });
    app.onKey(e2);
    t.eq(app.objects[0].x, snapX, 'INPUT 中方向键不触发移动');

    // ========== 6. 防抖历史合并 ==========
    app.select(app.objects[0]);
    app._nudgeTimer = null;
    key({ key:'ArrowRight' });
    t.ok(app._nudgeTimer != null, '首次方向键设置 debounce');
    const t1 = app._nudgeTimer;
    key({ key:'ArrowRight' });
    t.ok(app._nudgeTimer !== t1, '连续按键更新 timer');

    // ========== 7. image 对象也支持 ==========
    const img = { id:999, type:'image', src:'x', x:500, y:500, w:100, h:100, opacity:1, visible:true, rot:0 };
    app.objects.push(img);
    app.select(img);
    key({ key:'ArrowUp', shiftKey:true });
    t.eq(img.y, 400, '图像也支持 Shift+↑');

    t.done();
});
