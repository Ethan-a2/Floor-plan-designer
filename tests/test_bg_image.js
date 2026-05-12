// 底图(image/svg) + 数据迁移 + 属性面板 + 图层操作
// 原始开发时对应"P1 底图" & "type=image/svg" 重构
const { loadApp, suite } = require('./setup');

loadApp((app, dom) => {
    const doc = dom.window.document;
    const t = suite('底图 / 通用图像对象');

    // ============ 1. 数据迁移 ============
    app.importData({
        floors: [{
            name: '1F',
            objects: [{ id:1, type:'wall', x1:0, y1:0, x2:500, y2:0 }],
            bgImage: { src:'data:image/png;base64,x', x:0, y:0, w:100, h:100,
                       opacity:0.5, visible:true, rot:0 }
        }]
    });
    t.ok(app.floors[0].bgImage === undefined, 'bgImage 字段被迁移移除');
    t.eq(app.floors[0].objects.length, 2, 'objects = image + wall');
    t.eq(app.floors[0].objects[0].type, 'image', 'image 置底');
    t.eq(app.floors[0].objects[0].opacity, 0.5, 'opacity 保留');

    // ============ 2. image hitTest ============
    const imgObj = app.floors[0].objects[0];
    t.ok(app.hitTest({x:50, y:50}) === imgObj, 'hitTest 能找到图像');
    const wall = app.floors[0].objects[1];
    t.ok(app.hitTest({x:100, y:0}) === wall, '图像之上的墙仍可点击');

    // ============ 3. 隐藏 ============
    imgObj.visible = false;
    t.ok(app.hitTest({x:50, y:50}) === null, '隐藏图像不被命中');
    app.render();
    t.eq(doc.querySelectorAll('image').length, 0, '隐藏图像不渲染');
    imgObj.visible = true;
    app.render();
    t.eq(doc.querySelectorAll('image').length, 1, '显示后重新渲染');

    // ============ 4. 属性面板 ============
    app.select(imgObj);
    const panel = doc.getElementById('props').innerHTML;
    t.ok(panel.includes('可见'), '面板有可见复选框');
    t.ok(panel.includes('图层顺序'), '面板有图层顺序区');
    t.ok(panel.includes('置底') && panel.includes('置顶'), '图层按钮完整');

    // ============ 5. 图层操作 ============
    app.objects.push({ id:3, type:'wall', x1:100, y1:0, x2:200, y2:0 });
    app.select(imgObj);
    app.raiseOne();
    t.eq(app.objects.indexOf(imgObj), 1, 'raiseOne 上移');
    app.sendToBack();
    t.eq(app.objects.indexOf(imgObj), 0, 'sendToBack 置底');
    app.bringToFront();
    t.eq(app.objects.indexOf(imgObj), 2, 'bringToFront 置顶');

    // ============ 6. 删除 ============
    app.deleteSelected();
    t.eq(app.objects.indexOf(imgObj), -1, 'delete 移除');

    // ============ 7. JSON 往返 (image + svg) ============
    app.importData({
        floors: [{ name:'1F', objects: [
            { id:1, type:'image', src:'x', x:0, y:0, w:100, h:100, opacity:0.7, visible:true, rot:0 },
            { id:2, type:'svg', src:'<svg/>', x:50, y:50, w:80, h:80, opacity:1, visible:true, rot:0 }
        ]}]
    });
    t.eq(app.objects.length, 2, '往返后 2 个对象');
    t.eq(app.objects[0].type, 'image', 'image 类型保留');
    t.eq(app.objects[1].type, 'svg', 'svg 类型保留');

    // ============ 8. svg 也渲染为 <image> ============
    app.render();
    t.eq(doc.querySelectorAll('image').length, 2, 'image + svg 都用 <image> 渲染');

    // ============ 9. 命中上层 ============
    const topHit = app.hitTest({x:60, y:60});
    t.ok(topHit === app.objects[1], 'hitTest 返回最上层 (svg)');

    t.done();
});
