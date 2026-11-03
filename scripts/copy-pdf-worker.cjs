const fs = require("node:fs");
const path = require("node:path");

const pdfJsBuildDirectory = path.dirname(require.resolve("pdfjs-dist/build/pdf.mjs"));
const sourcePath = path.join(pdfJsBuildDirectory, "pdf.worker.min.mjs");
const publicDirectory = path.join(__dirname, "..", "public");
const targetPath = path.join(publicDirectory, "pdf.worker.min.mjs");
const tesseractDirectory = path.resolve(path.dirname(require.resolve("tesseract.js")), "..");
const tesseractCoreDirectory = path.dirname(require.resolve("tesseract.js-core"));
const tesseractPublicDirectory = path.join(publicDirectory, "tesseract");
const tesseractWorkerPath = path.join(tesseractDirectory, "dist", "worker.min.js");
const tesseractCoreFiles = fs
  .readdirSync(tesseractCoreDirectory)
  .filter((name) => /^tesseract-core-(?:lstm|simd-lstm|relaxedsimd-lstm)\.wasm(?:\.js)?$/.test(name));
const selectedCoreFiles = new Set(tesseractCoreFiles);
const ocrLanguageDirectory = path.join(__dirname, "..", "assets", "ocr");

fs.mkdirSync(publicDirectory, { recursive: true });
fs.copyFileSync(sourcePath, targetPath);
fs.mkdirSync(tesseractPublicDirectory, { recursive: true });
fs.copyFileSync(tesseractWorkerPath, path.join(tesseractPublicDirectory, "worker.min.js"));

for (const existingFile of fs.readdirSync(tesseractPublicDirectory)) {
  if (
    /^tesseract-core(?:-.*)?\.wasm(?:\.js)?$/.test(existingFile) &&
    !selectedCoreFiles.has(existingFile)
  ) {
    fs.unlinkSync(path.join(tesseractPublicDirectory, existingFile));
  }
}

for (const fileName of tesseractCoreFiles) {
  fs.copyFileSync(
    path.join(tesseractCoreDirectory, fileName),
    path.join(tesseractPublicDirectory, fileName)
  );
}

if (tesseractCoreFiles.length < 6) {
  throw new Error("Os arquivos locais do runtime OCR do Tesseract estao incompletos.");
}

fs.mkdirSync(path.join(tesseractPublicDirectory, "lang"), { recursive: true });
const languageModelPath = path.join(ocrLanguageDirectory, "por.traineddata.gz");
if (!fs.existsSync(languageModelPath)) {
  throw new Error("O modelo portugues do OCR nao foi encontrado.");
}
fs.copyFileSync(languageModelPath, path.join(tesseractPublicDirectory, "lang", "por.traineddata.gz"));
