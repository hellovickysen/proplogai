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
 * @param {object} [options] - Processing options
 * @param {number} [options.maxDimension] - Max pixel dimension for longest edge (default 2048)
 * @returns {{ file: File|null, preview: string|null, error: string|null }}
 */
export async function processImageFile(file, options = {}) {
  const maxDim = options.maxDimension || MAX_DIMENSION;
  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');

  // Block SVG uploads — SVGs can contain embedded scripts (XSS risk)
  if (file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg')) {
    return { file: null, preview: null, error: 'SVG files are not supported. Please upload JPG, PNG, or WebP.' };
  }

  if (!isPdf && !isImage) {
    return { file: null, preview: null, error: 'Please upload an image (JPG, PNG) or a single-page PDF.' };
  }

  // If already WebP and within dimension limit, just return as-is with a preview
  if (file.type === 'image/webp' && maxDim >= MAX_DIMENSION) {
    return { file, preview: URL.createObjectURL(file), error: null };
  }

  try {
    let canvas;

    if (isPdf) {
      canvas = await pdfToCanvas(file, maxDim);
    } else {
      canvas = await imageToCanvas(file, maxDim);
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

function imageToCanvas(file, maxDim = MAX_DIMENSION) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
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

async function pdfToCanvas(file, maxDim = MAX_DIMENSION) {
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
  if (canvas.width > maxDim || canvas.height > maxDim) {
    const ratio = Math.min(maxDim / canvas.width, maxDim / canvas.height);
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

  _pdfJsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = window.pdfjsLib;
      if (!lib) {
        reject(new Error('PDF.js failed to load.'));
        return;
      }
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(lib);
    };
    script.onerror = () => {
      _pdfJsPromise = null;
      reject(new Error('Failed to load PDF.js. Please try again.'));
    };
    document.head.appendChild(script);
  });

  return _pdfJsPromise;
}
