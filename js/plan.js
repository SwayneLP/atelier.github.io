// Calcul de l’ordre des pages et des cahiers.
function plan(n) {
    let mode = val('mode'), c = Math.trunc(num('cols')), r = Math.trunc(num('rows')), sides = [], groups = [], blank = 0;
    const push = (a, b = null, g = 0, d = 0) => { sides.push({ p: a, g, d, back: false }); if (b)
        sides.push({ p: b, g, d, back: true }); };
    if (mode === 'book' || mode === 'sig') {
        c = 2;
        r = 1;
        let size = mode === 'book' ? Math.ceil(n / 4) * 4 : num('sig');
        if (!Number.isInteger(size) || size < 4 || size % 4)
            throw Error('Le nombre de pages par cahier doit être un multiple de 4.');
        let custom = mode === 'sig' && val('custom').trim() ? val('custom').split(/[,; ]+/).map(Number) : [];
        if (custom.some(x => !Number.isInteger(x) || x < 4 || x % 4))
            throw Error('Répartition : uniquement des multiples de 4.');
        let start = 0, g = 0;
        while (start < n) {
            let requested = custom[g] || size, k = Math.min(requested, n - start), total = val('last') === 'full' && mode === 'sig' ? requested : Math.ceil(k / 4) * 4;
            blank += total - k;
            groups.push(total);
            const p = x => x < k ? start + x : null;
            for (let j = 0; j < total / 4; j++) {
                let a = [p(total - 1 - 2 * j), p(2 * j)], b = [p(2 * j + 1), p(total - 2 - 2 * j)];
                if (val('binding') === 'right') {
                    a.reverse();
                    b.reverse();
                }
                push(a, b, g, j / Math.max(1, total / 4 - 1));
            }
            start += k;
            g++;
        }
    }
    else if (mode === 'turn' || mode === 'tumble') {
        c = mode === 'turn' ? 2 : 1;
        r = mode === 'turn' ? 1 : 2;
        for (let i = 0; i < n; i += 2) {
            let a = [i, i + 1 < n ? i + 1 : null];
            push(a, a.slice().reverse());
        }
    }
    else {
        if (c < 1 || r < 1 || c * r > 400)
            throw Error('Grille invalide.');
        let k = c * r, duplex = on('duplex'), pair = (a, b) => push(a, b);
        const arrange = a => Array.from({ length: k }, (_, i) => { let x = i % c, y = Math.floor(i / c); return a[val('order') === 'col' ? x * r + y : val('order') === 'rtl' ? y * c + c - 1 - x : i] ?? null; });
        const mirror = a => a.map((_, i) => a[Math.floor(i / c) * c + c - 1 - i % c]);
        if (mode === 'repeat') {
            for (let i = 0; i < n; i += duplex ? 2 : 1)
                pair(Array(k).fill(i), duplex ? Array(k).fill(i + 1 < n ? i + 1 : null) : null);
        }
        else if (mode === 'cut') {
            let count = Math.ceil(n / (k * (duplex ? 2 : 1)));
            for (let j = 0; j < count; j++) {
                let a = arrange(Array.from({ length: k }, (_, i) => { let p = (i * count + j) * (duplex ? 2 : 1); return p < n ? p : null; }));
                pair(a, duplex ? mirror(a.map(p => p !== null && p + 1 < n ? p + 1 : null)) : null);
            }
        }
        else {
            for (let i = 0; i < n; i += k * (duplex ? 2 : 1)) {
                let a = arrange(Array.from({ length: k }, (_, j) => i + j < n ? i + j : null));
                let b = arrange(Array.from({ length: k }, (_, j) => i + k + j < n ? i + k + j : null));
                pair(a, duplex ? mirror(b) : null);
            }
        }
    }
    return { c, r, sides, groups, blank };
}
