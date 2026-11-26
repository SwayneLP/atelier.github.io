// État partagé, import et recalcul du document.
const $ = id => document.getElementById(id), mm = 72 / 25.4, num = id => Number($(id).value), val = id => $(id).value, on = id => $(id).checked;
let source, bytes, filename, output, previewDoc, revision = 0, timer;
function fail(e) { $('status').textContent = e.message || String(e); $('status').className = 'error'; $('export').disabled = true; }
async function load(file) { if (!file)
    return; try {
    bytes = new Uint8Array(await file.arrayBuffer());
    source = await PDFLib.PDFDocument.load(bytes);
    filename = file.name.replace(/\.pdf$/i, '');
    $('info').textContent = `${file.name} · ${source.getPageCount()} pages`;
    await update();
}
catch (e) {
    fail(e);
} }
$('file').onchange = e => load(e.target.files[0]);
$('drop').ondragover = e => e.preventDefault();
$('drop').ondrop = e => { e.preventDefault(); load(e.dataTransfer.files[0]); };
async function update() { if (!source)
    return; let rev = ++revision; $('export').disabled = true; $('status').className = ''; $('status').textContent = 'Calcul en cours…'; try {
    let result = await build();
    if (rev !== revision)
        return;
    output = result;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    let pdf = await pdfjsLib.getDocument({ data: result.data.slice() }).promise;
    if (rev !== revision)
        return;
    const previous = previewDoc;
    previewDoc = pdf;
    if (previous)
        previous.destroy();
    $('summary').textContent = `${result.p.sides.length} faces · ${(result.W / mm).toFixed(1)} × ${(result.H / mm).toFixed(1)} mm`;
    $('status').textContent = `Échelle ${(result.s * 100).toFixed(1)} % · ${result.p.blank} pages blanches ajoutées`;
    $('details').textContent = result.p.groups.length ? 'Cahiers : ' + result.p.groups.map((x, i) => `${i + 1} : ${x} p.`).join('  /  ') : '';
    $('export').disabled = false;
    render();
}
catch (e) {
    if (rev === revision)
        fail(e);
} }
$('export').onclick = () => { if (!output)
    return; let url = URL.createObjectURL(new Blob([output.data], { type: 'application/pdf' })), a = document.createElement('a'); a.href = url; a.download = filename + '-imposition.pdf'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); };
function fields() { $('signature').hidden = val('mode') !== 'sig'; $('grid').hidden = !['n', 'repeat', 'cut'].includes(val('mode')); syncPaper(); }
fields();
document.querySelectorAll('aside input:not([type=file]), aside select').forEach(element => element.addEventListener('input', () => { fields(); revision++; $('export').disabled = true; clearTimeout(timer); timer = setTimeout(update, 250); }));
