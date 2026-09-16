/**
 * Smart Mutation Parser for Indonesian Banks and E-Wallets
 * Parses notification texts and SMS into structured transaction data.
 */

export interface ParsedMutation {
  provider: string;
  type: "income" | "expense";
  amount: number;
  merchantOrNote: string;
  rawSnippet: string;
  confidence: number; // 0 to 1
  date?: string; // ISO date string
}

/**
 * Clean and parse nominal strings like "Rp 25.000,00", "Rp18.500", "50,000", "15000"
 */
export function parseNominalIDR(text: string): number {
  if (!text) return 0;

  // 1. Explicit Rp / IDR / sebesar prefix (highest priority)
  const explicitMatch = text.match(/(?:rp\.?|idr|sebesar|sejumlah)\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+)/i);
  let raw = "";

  if (explicitMatch && explicitMatch[1]) {
    raw = explicitMatch[1];
  } else {
    // 2. Thousand separated pattern like 1.500.000 or 25,000
    const thousandMatch = text.match(/\b([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?)\b/);
    if (thousandMatch && thousandMatch[1]) {
      raw = thousandMatch[1];
    } else {
      // 3. 4+ digit standalone number (e.g. 150000)
      const plainMatch = text.match(/\b([0-9]{4,})\b/);
      if (plainMatch && plainMatch[1]) {
        raw = plainMatch[1];
      } else {
        const anyMatch = text.match(/\b([0-9]+)\b/);
        if (anyMatch && anyMatch[1]) {
          raw = anyMatch[1];
        }
      }
    }
  }

  if (!raw) return 0;

  // If ends with ,00 or .00 decimal
  if (/[.,][0-9]{2}$/.test(raw)) {
    raw = raw.slice(0, -3);
  }

  // Remove all thousand separators
  const clean = raw.replace(/[.,]/g, "");
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

export function parseBankMutation(rawText: string): ParsedMutation | null {
  if (!rawText || rawText.trim().length < 5) return null;

  const text = rawText.trim();

  // 1. BCA Mobile / SMS BCA
  // Contoh: "m-Transfer: BERHASIL 15/09 14:20:10 ke 1234567890 AN BUDI Rp. 25.000,00 Ref 123"
  // Contoh: "QR Pembayaran Berhasil Rp 18.000,00 di KOPI KENANGAN Ref 999"
  // Contoh: "Transfer Masuk Rp 500.000,00 dari MAMAH"
  if (/bca|m-transfer|klikbca/i.test(text) || (/berhasil/i.test(text) && /ke\s+[0-9]/i.test(text))) {
    const isIncome = /masuk|dari\s+|cr\b/i.test(text) && !/ke\s+/i.test(text);
    const amount = parseNominalIDR(text);

    let merchant = "Transaksi BCA";
    const toMatch = text.match(/(?:ke|an|di)\s+([A-Z0-9\s.]+?)(?=\s+(?:rp|ref|tgl|\d{2}\/|\n|$))/i);
    if (toMatch && toMatch[1]) {
      merchant = toMatch[1].trim();
    } else if (/qr\s+pembayaran/i.test(text)) {
      merchant = "QRIS BCA";
    }

    if (amount > 0) {
      return {
        provider: "bca",
        type: isIncome ? "income" : "expense",
        amount,
        merchantOrNote: merchant,
        rawSnippet: text.slice(0, 100),
        confidence: 0.95,
      };
    }
  }

  // 2. GoPay
  // Contoh: "Pembayaran berhasil! Kamu telah bayar Rp15.000 di Kopi Kenangan pakai GoPay."
  // Contoh: "Kamu menerima transfer Rp50.000 dari Budi."
  if (/gopay|gojek/i.test(text)) {
    const isIncome = /menerima|masuk|top up/i.test(text);
    const amount = parseNominalIDR(text);
    let merchant = "GoPay";

    const diMatch = text.match(/di\s+([A-Z0-9\s.]+?)(?=\s+pakai|\s+pada|\s+dengan|\n|$)/i);
    const dariMatch = text.match(/dari\s+([A-Z0-9\s.]+?)(?=\.|\n|$)/i);

    if (diMatch && diMatch[1]) {
      merchant = diMatch[1].trim();
    } else if (dariMatch && dariMatch[1]) {
      merchant = `Transfer dari ${dariMatch[1].trim()}`;
    }

    if (amount > 0) {
      return {
        provider: "gopay",
        type: isIncome ? "income" : "expense",
        amount,
        merchantOrNote: merchant,
        rawSnippet: text.slice(0, 100),
        confidence: 0.95,
      };
    }
  }

  // 3. SeaBank / ShopeePay
  // Contoh: "SeaBank: Transfer keluar sebesar Rp100.000 ke BNI 123456789 berhasil."
  // Contoh: "Transfer masuk sebesar Rp200.000 dari ..."
  // Contoh: "Pembayaran QRIS sebesar Rp25.000 di INDOMARET berhasil."
  if (/seabank|shopeepay|shopee/i.test(text)) {
    const isIncome = /masuk|diterima/i.test(text);
    const amount = parseNominalIDR(text);
    let merchant = "SeaBank";

    const toMatch = text.match(/(?:ke|di)\s+([A-Z0-9\s.]+?)(?=\s+berhasil|\s+pada|\n|$)/i);
    if (toMatch && toMatch[1]) {
      merchant = toMatch[1].trim();
    }

    if (amount > 0) {
      return {
        provider: "seabank",
        type: isIncome ? "income" : "expense",
        amount,
        merchantOrNote: merchant,
        rawSnippet: text.slice(0, 100),
        confidence: 0.95,
      };
    }
  }

  // 4. OVO
  // Contoh: "Berhasil! Pembayaran OVO sebesar Rp 22.000 di Janji Jiwa telah selesai."
  if (/ovo/i.test(text)) {
    const isIncome = /top up|menerima|masuk/i.test(text);
    const amount = parseNominalIDR(text);
    let merchant = "OVO";
    const diMatch = text.match(/di\s+([A-Z0-9\s.]+?)(?=\s+telah|\s+berhasil|\n|$)/i);
    if (diMatch && diMatch[1]) {
      merchant = diMatch[1].trim();
    }

    if (amount > 0) {
      return {
        provider: "ovo",
        type: isIncome ? "income" : "expense",
        amount,
        merchantOrNote: merchant,
        rawSnippet: text.slice(0, 100),
        confidence: 0.92,
      };
    }
  }

  // 5. Dana
  // Contoh: "Kirim Uang Rp50.000 ke DANA 08123456789 Berhasil!"
  // Contoh: "Pembayaran QRIS DANA Rp 15.000 di WARTEG KHARISMA Berhasil"
  if (/dana/i.test(text)) {
    const isIncome = /terima|masuk|top up/i.test(text);
    const amount = parseNominalIDR(text);
    let merchant = "DANA";
    const toMatch = text.match(/(?:ke|di)\s+([A-Z0-9\s.]+?)(?=\s+berhasil|\n|$)/i);
    if (toMatch && toMatch[1]) {
      merchant = toMatch[1].trim();
    }

    if (amount > 0) {
      return {
        provider: "dana",
        type: isIncome ? "income" : "expense",
        amount,
        merchantOrNote: merchant,
        rawSnippet: text.slice(0, 100),
        confidence: 0.9,
      };
    }
  }

  // 6. Generic Fallback: Ada kata nominal & indikasi transaksi
  const amount = parseNominalIDR(text);
  if (amount > 0) {
    const isIncome = /masuk|terima|credit|cr\b|pemasukan|gaji|kiriman/i.test(text);
    let note = "Transaksi Mutasi";
    const noteMatch = text.match(/(?:ke|di|dari|untuk)\s+([A-Za-z0-9\s.]{2,30})/i);
    if (noteMatch && noteMatch[1]) {
      note = noteMatch[1].trim();
    }

    return {
      provider: "other",
      type: isIncome ? "income" : "expense",
      amount,
      merchantOrNote: note,
      rawSnippet: text.slice(0, 100),
      confidence: 0.75,
    };
  }

  return null;
}
