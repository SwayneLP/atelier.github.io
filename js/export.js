// Construction du PDF vectoriel et des repères.
async function build() { const { PDFDocument, rgb, degrees } = PDFLib, doc = await PDFDocument.create(), n = source.getPageCount(), p = plan(n), pages = source.getPages(), margin = num('margin') * mm, gap = num('gap') * mm, manual = num('bleed') * mm; let boxes = pages.map(pg => { let t = pg.getTrimBox(), m = pg.getMediaBox(), b = pg.getBleedBox(); if (manual > 0 && t.width === m.width && t.height === m.height)
    t = { x: m.x + manual, y: m.y + manual, width: m.width - 2 * manual, height: m.height - 2 * manual }; if (t.width <= 0 || t.height <= 0)
    throw Error('Fond perdu invalide.'); return { t, b, m }; }); let pw = Math.max(...boxes.map(b => b.t.width)), ph = Math.max(...boxes.map(b => b.t.height)); let W = p.c * pw + (p.c - 1) * gap + 2 * margin, H = p.r * ph + (p.r - 1) * gap + 2 * margin; if (val('paper') !== 'auto') {
    let a = val('paper') === 'custom' ? [num('w'), num('h')] : val('paper').split(',').map(Number);
    if (val('paper') !== 'custom')
        a.sort((a, b) => val('orient') === 'land' ? b - a : a - b);
    [W, H] = a.map(x => x * mm);
} if (val("paper") === "auto")
    showDimensions(W / mm, H / mm); let cw = (W - 2 * margin - (p.c - 1) * gap) / p.c, ch = (H - 2 * margin - (p.r - 1) * gap) / p.r; if (cw <= 0 || ch <= 0)
    throw Error('Marges trop grandes.'); let s = val('scale') === 'real' ? 1 : Math.min(cw / pw, ch / ph); if (pw * s > cw + .01 || ph * s > ch + .01)
    throw Error('Les pages à 100 % ne tiennent pas sur cette feuille. Choisissez un format supérieur ou Ajuster.'); cw = pw * s; ch = ph * s; let ox = (W - p.c * cw - (p.c - 1) * gap) / 2, oy = (H - p.r * ch - (p.r - 1) * gap) / 2; let cache = new Map(), black = rgb(0, 0, 0); for (let j = 0; j < p.sides.length; j++) {
    let side = p.sides[j], sheet = doc.addPage([W, H]), flip = side.back && on('flip');
    const line = (x, y, X, Y) => { if (flip) {
        x = W - x;
        X = W - X;
        y = H - y;
        Y = H - Y;
    } sheet.drawLine({ start: { x, y }, end: { x: X, y: Y }, thickness: .35, color: black }); };
    for (let i = 0; i < side.p.length; i++) {
        let id = side.p[i], col = i % p.c, row = Math.floor(i / p.c), x = ox + col * (cw + gap), y = H - oy - (row + 1) * ch - row * gap;
        if (id !== null) {
            let { t, b, m } = boxes[id], w = t.width * s, h = t.height * s;
            x += (cw - w) / 2;
            y += (ch - h) / 2;
            let creep = num('creep') * mm * side.d;
            if (['book', 'sig'].includes(val('mode')))
                x += col === 0 ? creep : -creep;
            let limit = (edge, outer) => outer ? Math.max(0, margin / s) : gap / (2 * s);
            let l = Math.min(Math.max(0, t.x - b.x), limit(0, col === 0)), rr = Math.min(Math.max(0, b.x + b.width - t.x - t.width), limit(0, col === p.c - 1)), bt = Math.min(Math.max(0, t.y - b.y), limit(0, row === p.r - 1)), tp = Math.min(Math.max(0, b.y + b.height - t.y - t.height), limit(0, row === 0));
            let bb = { left: Math.max(m.x, t.x - l), bottom: Math.max(m.y, t.y - bt), right: Math.min(m.x + m.width, t.x + t.width + rr), top: Math.min(m.y + m.height, t.y + t.height + tp) };
            let key = id + JSON.stringify(bb);
            if (!cache.has(key))
                cache.set(key, await doc.embedPage(pages[id], bb));
            let ep = cache.get(key), dx = x - (t.x - bb.left) * s, dy = y - (t.y - bb.bottom) * s, ew = ep.width * s, eh = ep.height * s;
            sheet.drawPage(ep, { x: flip ? W - dx : dx, y: flip ? H - dy : dy, width: ew, height: eh, rotate: degrees(flip ? 180 : 0) });
            if (on('crop')) {
                for (let [xx, dir] of [[x, -1], [x + w, 1]])
                    for (let [yy, dy] of [[y, -1], [y + h, 1]]) {
                        line(xx + dir * 3, yy, xx + dir * 11, yy);
                        line(xx, yy + dy * 3, xx, yy + dy * 11);
                    }
            }
        }
    }
    if (on('fold')) {
        line(W / 2, 0, W / 2, Math.min(12, oy));
        line(W / 2, H - Math.min(12, oy), W / 2, H);
    }
    if (on('reg'))
        for (let x of [W / 2])
            for (let y of [5, H - 5]) {
                line(x - 4, y, x + 4, y);
                line(x, y - 4, x, y + 4);
            }
    if (on('collate') && p.groups.length) {
        let y = oy + ((side.g % 12) + 1) * ch / 14;
        sheet.drawRectangle({ x: W / 2 - 2, y, width: 4, height: 8, color: black });
    }
    if (on('slug'))
        sheet.drawText(`Atelier | ${j + 1}/${p.sides.length} | ${side.back ? 'Verso' : 'Recto'} | Cahier ${side.g + 1}`, { x: 8, y: 5, size: 7, color: black });
} return { data: await doc.save(), p, W, H, s }; }
