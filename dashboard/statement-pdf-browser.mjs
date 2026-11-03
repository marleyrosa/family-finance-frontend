import statementPdf from "./statement-pdf.js";

const MAX_PDF_PAGES = 20;
const MAX_OCR_PAGES = 5;
const { groupTextItems } = statementPdf;

export async function extractPdfTextLines(arrayBuffer, onProgress = () => {}, password = "") {
  const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // slice(0): o pdf.js transfere o buffer ao worker; a copia permite tentar de novo com outra senha.
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer.slice(0)),
    password: password || undefined,
  });
  let pdfDocument;
  try {
    pdfDocument = await loadingTask.promise;
  } catch (error) {
    await loadingTask.destroy();
    throw error;
  }
  try {
    if (pdfDocument.numPages > MAX_PDF_PAGES) {
      throw new Error(`O PDF tem ${pdfDocument.numPages} paginas; o limite atual e ${MAX_PDF_PAGES}.`);
    }

    const lines = [];
    const scannedPages = [];
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageLines = groupTextItems(content.items);
      if (pageLines.join(" ").trim().length < 40) {
        scannedPages.push({ page, pageNumber });
        lines.push(null);
      } else {
        lines.push(pageLines);
      }
    }

    if (!scannedPages.length) {
      return { lines: lines.flat(), usedOcr: false };
    }
    if (scannedPages.length > MAX_OCR_PAGES) {
      throw new Error(
        `Encontramos ${scannedPages.length} paginas digitalizadas; o OCR local aceita ate ${MAX_OCR_PAGES} paginas por arquivo.`
      );
    }

    onProgress(`Inicializando OCR local em portugues (${scannedPages.length} pagina(s))...`);
    const { createWorker } = await import("tesseract.js");
    const ocrWorker = await createWorker("por", 1, {
      workerPath: "/tesseract/worker.min.js",
      corePath: "/tesseract",
      langPath: "/tesseract/lang",
      gzip: true,
      workerBlobURL: false,
      logger: ({ status }) => {
        if (status) {
          onProgress(`OCR local em portugues: ${status}...`);
        }
      },
    });
    try {
      for (let index = 0; index < scannedPages.length; index += 1) {
        const { page, pageNumber } = scannedPages[index];
        onProgress(`OCR local: renderizando pagina ${index + 1} de ${scannedPages.length}...`);
        const initialViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.75, 2400 / Math.max(initialViewport.width, initialViewport.height));
        const viewport = page.getViewport({ scale });
        const canvas = globalThis.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        try {
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) {
            throw new Error("Nao foi possivel preparar uma pagina para OCR neste navegador.");
          }
          const renderTask = page.render({ canvasContext: context, viewport, intent: "print" });
          renderTask.onContinue = (continueRendering) => continueRendering();
          await renderTask.promise;
          onProgress(`OCR local: reconhecendo pagina ${index + 1} de ${scannedPages.length}...`);
          const imageData = canvas.toDataURL("image/jpeg", 0.92);
          const { data } = await ocrWorker.recognize(imageData);
          lines[pageNumber - 1] = String(data.text || "").split(/\r?\n/);
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    } finally {
      await ocrWorker.terminate();
    }
    return { lines: lines.flat(), usedOcr: true };
  } finally {
    await loadingTask.destroy();
  }
}
