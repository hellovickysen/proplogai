/**
 * Client-side image processing utility.
 * Converts JPG/PNG/single-page PDF to WebP before upload.
 * Used by trophy uploads and journal screenshot uploads.
 */

const WEBP_QUALITY = 0.85;
const MAX_DIMENSION = 2048;

/**
 * Process an image file to WebP format.
 * @param {File} file - The file to process (JPG, PNG, or single-page PDF)
 * @returns {{ file: File|null, preview: string|null, error: string|null }}
 */
export async function processImageFile(file) {
  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');

  if (!isPdf && !isImage) {
    return { file: null, preview: null, error: 'Please upload an image (JPG, PNG) or a single-page PDF.' };
  }

  // If already WebP, just return as-is with a preview
  if (file.type === 'image/webp') {
    return { file, preview: URL.createObjectURL(file), error: null };
  }

  try {
    let canvas;

    if (isPdf) {
      canvas = await pdfToCanvas(file);
    } else {
      canvas = await imageToCanvas(file);
    }

    const blob = await canvasToWebp(canvas);
    const newName = file.name.replace(/\.[^.]+$/, '.webp');
    const webpFile = new File([blob], newName, { type: 'image/webp' });
    const preview = URL.createObjectURL(blob);

    return { file: webpFile, preview, error: null };
  } catch (err) {
    return { file: null, preview: null, error: err.message || 'Failed to process image.' };
  }
}

/**
 * Process multiple files to WebP. Returns array of results.
 * Stops on first error.
 */
export async function processImageFiles(files) {
  const results = [];
  for (const file of files) {
    const result = await processImageFile(file);
    if (result.error) return { files: [], error: result.error };
    results.push(result);
  }
  return { files: results, error: null };
}

/* ─── Internal helpers ─────────────────────────────────────── */

function imageToCanvas(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image.'));
    };
    img.src = URL.createObjectURL(file);
  });
}

async function pdfToCanvas(file) {
  const pdfjsLib = await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  if (pdf.numPages > 1) {
    throw new Error('Multi-page PDFs are not supported. Please upload a single-page PDF or convert it to an image first.');
  }

  const page = await pdf.getPage(1);
  const scale = 2;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  await page.render({ canvasContext: ctx, viewport }).promise;

  // Scale down if too large
  if (canvas.width > MAX_DIMENSION || canvas.height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / canvas.width, MAX_DIMENSION / canvas.height);
    const scaled = document.createElement('canvas');
    scaled.width = Math.round(canvas.width * ratio);
    scaled.height = Math.round(canvas.height * ratio);
    scaled.getContext('2d').drawImage(canvas, 0, 0, scaled.width, scaled.height);
    return scaled;
  }

  return canvas;
}

function canvasToWebp(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('WebP conversion failed.')),
      'image/webp',
      WEBP_QUALITY
    );
  });
}

/* ─── pdf.js CDN loader ──────────────────────────────────────── */

let _pdfJsPromise = null;

function loadPdfJs() {
  if (_pdfJsPromise) return _pdfJsPromise;

  if (typeof window !== 'undefined' && window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  _pdfJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    // crossOrigin enables CORS checks for this CDN resource.
    // TODO: Add an integrity="sha384-..." SRI hash once the pdf.js version is pinned
    // and the hash can be computed from the pinned file.
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => {
      _pdfJsPromise = null; // Allow retry on next call
      reject(new Error('Failed to load PDF processor. Please try uploading an image instead.'));
    };
    document.head.appendChild(script);
  });

  return _pdfJsPromise;
}
