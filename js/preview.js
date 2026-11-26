// Aperçu continu : seules les faces proches de la zone visible sont rasterisées.
let observer;
function render() {
    if (!previewDoc)
        return;
    if (observer)
        observer.disconnect();
    const doc = previewDoc, result = output, root = $('preview');
    root.replaceChildren();
    const step = ['book', 'sig', 'turn', 'tumble'].includes(val('mode')) || on('duplex') ? 2 : 1;
    observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting)
                continue;
            const canvas = entry.target;
            observer.unobserve(canvas);
            drawFace(doc, canvas).catch(error => { if (canvas.isConnected)
                canvas.parentElement.querySelector('p').textContent += ' — aperçu indisponible'; });
        }
    }, { root: null, rootMargin: '600px' });
    for (let j = 0; j < doc.numPages; j += step) {
        const group = document.createElement('section');
        group.className = 'sheet-group';
        const heading = document.createElement('h3');
        heading.textContent = `Planche ${Math.floor(j / step) + 1} / ${Math.ceil(doc.numPages / step)}`;
        const faces = document.createElement('div');
        faces.className = 'faces';
        group.append(heading, faces);
        root.append(group);
        for (let i = j; i < Math.min(j + step, doc.numPages); i++) {
            const wrap = document.createElement('div'), canvas = document.createElement('canvas'), label = document.createElement('p');
            wrap.className = 'sheet';
            canvas.dataset.page = i + 1;
            canvas.width = Math.round(1100 * result.W / Math.max(result.W, result.H));
            canvas.height = Math.round(1100 * result.H / Math.max(result.W, result.H));
            const side = result.p.sides[i];
            label.textContent = (side.back ? 'Verso' : 'Recto') + ' · ' + side.p.map(x => x === null ? 'Blanc' : x + 1).join(' / ');
            wrap.append(label, canvas);
            faces.append(wrap);
            observer.observe(canvas);
        }
    }
}
async function drawFace(doc, canvas) {
    const page = await doc.getPage(Number(canvas.dataset.page));
    if (!canvas.isConnected)
        return;
    const original = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 1100 / Math.max(original.width, original.height) });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
}
