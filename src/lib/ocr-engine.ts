import { createWorker } from "tesseract.js";

export interface OCRReceiptResult {
  rawText: string;
  amount: number | null;
  date: string | null;
  merchantName: string | null;
  suggestedCategory: string | null;
}

/**
 * Preprocess image on HTML5 Canvas: Grayscale, Contrast Enhancement, and Resize
 */
export async function preprocessReceiptImage(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      // Max width 1200px for speed and precision
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original
      ctx.drawImage(img, 0, 0, width, height);

      // Get image pixels for grayscale and contrast thresholding
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      // Contrast factor
      const contrast = 30; // -255 to 255
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < d.length; i += 4) {
        // Grayscale conversion
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // Contrast
        const cVal = factor * (gray - 128) + 128;
        const finalVal = Math.min(255, Math.max(0, cVal));

        d[i] = finalVal;
        d[i + 1] = finalVal;
        d[i + 2] = finalVal;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };

    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Run Tesseract OCR in a client-side Web Worker
 */
export async function runReceiptOCR(
  imageSrc: string,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRReceiptResult> {
  let processedSrc = imageSrc;
  try {
    if (onProgress) onProgress(10, "Mengoptimalkan kontras foto struk...");
    processedSrc = await preprocessReceiptImage(imageSrc);
  } catch {
    processedSrc = imageSrc;
  }

  try {
    if (onProgress) onProgress(25, "Memuat engine pengenal teks...");
    const worker = await createWorker("ind+eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          const prog = 30 + Math.round(m.progress * 65);
          onProgress(prog, `Membaca karakter nota (${Math.round(m.progress * 100)}%)...`);
        }
      },
    });

    const { data } = await worker.recognize(processedSrc);
    await worker.terminate();

    if (onProgress) onProgress(100, "Mengekstrak data transaksi...");
    return parseReceiptText(data.text);
  } catch (err) {
    console.warn("OCR Worker fallback to heuristic:", err);
    return parseReceiptText("");
  }
}

/**
 * Intelligent Indonesian Receipt & QRIS text parser
 */
export function parseReceiptText(text: string): OCRReceiptResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let detectedAmount: number | null = null;
  let detectedDate: string | null = null;
  let detectedMerchant: string | null = null;
  let suggestedCategory = "Makan & Minum";

  // 1. Merchant Name: Typically in the top 3 non-empty lines
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const line = lines[i];
    if (
      !line.toLowerCase().includes("struk") &&
      !line.toLowerCase().includes("tanggal") &&
      !line.toLowerCase().includes("nota") &&
      line.length >= 3 &&
      !/^\d+$/.test(line)
    ) {
      detectedMerchant = line;
      break;
    }
  }

  // 2. Amount detection (Look for TOTAL, GRAND TOTAL, BAYAR, NETT, RP, QRIS)
  const amountRegex = /(?:total|grand\s*total|bayar|tagihan|jumlah|net|rp\.?)\s*[:=]?\s*(?:rp\.?)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+)/gi;
  const amountsFound: number[] = [];

  for (const line of lines) {
    let match;
    while ((match = amountRegex.exec(line)) !== null) {
      const cleanNum = match[1].replace(/\./g, "").replace(/,/g, "");
      const num = parseInt(cleanNum, 10);
      if (num >= 1000 && num <= 20000000) {
        amountsFound.push(num);
      }
    }
  }

  // If no labeled total found, look for highest realistic number with currency pattern
  if (amountsFound.length === 0) {
    const genericNumberRegex = /(?:rp\.?\s*)?([0-9]{1,3}(?:\.[0-9]{3})+)/gi;
    for (const line of lines) {
      let match;
      while ((match = genericNumberRegex.exec(line)) !== null) {
        const cleanNum = match[1].replace(/\./g, "");
        const num = parseInt(cleanNum, 10);
        if (num >= 2000 && num <= 10000000) {
          amountsFound.push(num);
        }
      }
    }
  }

  if (amountsFound.length > 0) {
    // Total is usually the maximum or the last grand total
    detectedAmount = Math.max(...amountsFound);
  }

  // 3. Date detection (e.g., 28/02/2025 or 28-02-2025 or 28 Feb 2025)
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
  for (const line of lines) {
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      const d = parseInt(dateMatch[1]);
      const m = parseInt(dateMatch[2]);
      let y = parseInt(dateMatch[3]);
      if (y < 100) y += 2000;

      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        detectedDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        break;
      }
    }
  }

  // 4. Category Classification Heuristic
  const lowerText = text.toLowerCase();
  if (lowerText.includes("indomaret") || lowerText.includes("alfamart") || lowerText.includes("supermarket") || lowerText.includes("minimarket")) {
    suggestedCategory = "Belanja Kebutuhan";
  } else if (lowerText.includes("kopi") || lowerText.includes("cafe") || lowerText.includes("coffee") || lowerText.includes("starbucks") || lowerText.includes("janji jiwa")) {
    suggestedCategory = "Kopi & Jajan";
  } else if (lowerText.includes("spbu") || lowerText.includes("pertamina") || lowerText.includes("shell") || lowerText.includes("gojek") || lowerText.includes("grab")) {
    suggestedCategory = "Transportasi";
  } else if (lowerText.includes("laundry") || lowerText.includes("cuci") || lowerText.includes("londri") || lowerText.includes("dry clean")) {
    suggestedCategory = "Laundry & Cuci Baju";
  } else if (lowerText.includes("apotek") || lowerText.includes("kimia farma") || lowerText.includes("farmasi") || lowerText.includes("klinik")) {
    suggestedCategory = "Kesehatan & Obat";
  } else if (lowerText.includes("fotokopi") || lowerText.includes("print") || lowerText.includes("buku") || lowerText.includes("stationery")) {
    suggestedCategory = "Kebutuhan Kuliah";
  }

  return {
    rawText: text,
    amount: detectedAmount,
    date: detectedDate || new Date().toISOString().slice(0, 10),
    merchantName: detectedMerchant,
    suggestedCategory,
  };
}
