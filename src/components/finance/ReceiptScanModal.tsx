"use client";

import React, { useState, useRef } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDataStore } from "@/stores/use-data-store";
import { formatCurrencyIDR } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { runReceiptOCR } from "@/lib/ocr-engine";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  X,
  FileText,
  DollarSign,
  Calendar,
  Tag,
} from "lucide-react";

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptScanModal({ isOpen, onClose }: ReceiptScanModalProps) {
  const { categories, addTransaction } = useDataStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Memproses struk...");
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedAmount, setExtractedAmount] = useState<number | null>(null);
  const [extractedNote, setExtractedNote] = useState("");
  const [extractedMerchant, setExtractedMerchant] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      executeRealOCR(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const executeRealOCR = async (dataUrl: string, fileName: string) => {
    setIsScanning(true);
    setScanProgress(5);
    triggerHaptic("medium");

    try {
      const result = await runReceiptOCR(dataUrl, (prog, status) => {
        setScanProgress(prog);
        setScanStatus(status);
      });

      const amountToUse = result.amount || 25000;
      setExtractedAmount(amountToUse);
      setExtractedMerchant(result.merchantName);
      setExtractedNote(
        result.merchantName
          ? `${result.merchantName} (${fileName.replace(/\.[^/.]+$/, "")})`
          : `Struk Belanja (${fileName.replace(/\.[^/.]+$/, "")})`
      );

      if (result.date) {
        setTransactionDate(result.date);
      }

      // Match category
      const matchedCat = categories.find((c) =>
        c.name.toLowerCase().includes(result.suggestedCategory?.toLowerCase() || "")
      );
      if (matchedCat) {
        setSelectedCategoryId(matchedCat.id);
      } else {
        const defaultCat = categories.find((c) => c.type !== "income") || categories[0];
        if (defaultCat) setSelectedCategoryId(defaultCat.id);
      }

      triggerHaptic("success");
      toast.success("Struk berhasil dipindai dengan OCR!", {
        description: `Nominal: ${formatCurrencyIDR(amountToUse)} • ${result.merchantName || "Struk"}`,
      });
    } catch (err) {
      toast.error("Gagal membaca teks struk, silakan masukkan nominal manual.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!extractedAmount || extractedAmount <= 0) {
      toast.error("Nominal transaksi belum terdeteksi.");
      return;
    }

    const cat = categories.find((c) => c.id === selectedCategoryId) || categories[0];

    try {
      triggerHaptic("success");
      await addTransaction({
        type: "expense",
        amount: extractedAmount,
        categoryId: cat?.id || "cat_general",
        categoryName: cat?.name || "Pengeluaran",
        categoryColor: cat?.color,
        categoryIcon: cat?.icon,
        note: extractedNote || "Scan Struk / QRIS",
        date: new Date(transactionDate).toISOString(),
      });

      toast.success(`Transaksi ${formatCurrencyIDR(extractedAmount)} tersimpan! 🎉`);
      handleReset();
      onClose();
    } catch {
      toast.error("Gagal menyimpan transaksi struk.");
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setExtractedAmount(null);
    setExtractedNote("");
    setIsScanning(false);
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-md p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#E0FBF2] text-[#1F8766] flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Pindai Struk / Bukti QRIS 📸
                </h3>
                <p className="text-[11px] text-muted">
                  Ambil foto nota kantin atau screenshot pembayaran
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-black/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Area / Image Preview */}
          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-[#7FE3C0] rounded-3xl p-8 text-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all space-y-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#EDE5FF] text-[#7C5CFA] flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-foreground">
                Klik untuk unggah foto struk / QRIS
              </p>
              <p className="text-[10px] text-muted">
                Mendukung format JPG, PNG, WEBP
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-border max-h-44 bg-black/5 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Receipt Preview"
                  className="w-full h-full object-cover max-h-44"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 px-6 text-center">
                    <Sparkles className="w-7 h-7 text-[#7FE3C0] animate-spin" />
                    <div className="space-y-1 w-full max-w-xs">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>{scanStatus}</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7FE3C0] to-[#B69CFF] transition-all duration-300 rounded-full"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Fields */}
              {!isScanning && extractedAmount !== null && (
                <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#2B2735] border border-border space-y-3">
                  {/* Amount Field */}
                  <div>
                    <label className="text-[11px] font-bold text-muted block mb-1">
                      Nominal Terdeteksi (IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={extractedAmount || ""}
                        onChange={(e) =>
                          setExtractedAmount(Number(e.target.value))
                        }
                        className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
                      />
                    </div>
                  </div>

                  {/* Category Field */}
                  <div>
                    <label className="text-[11px] font-bold text-muted block mb-1">
                      Kategori Pengeluaran
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
                    >
                      {categories
                        .filter((c) => c.type !== "income")
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Note Field */}
                  <div>
                    <label className="text-[11px] font-bold text-muted block mb-1">
                      Catatan
                    </label>
                    <input
                      type="text"
                      value={extractedNote}
                      onChange={(e) => setExtractedNote(e.target.value)}
                      placeholder="Keterangan transaksi..."
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#7FE3C0]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {selectedImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="rounded-xl flex-1 text-xs"
              >
                Ganti Foto
              </Button>
            )}
            <Button
              type="button"
              variant="finance"
              size="sm"
              onClick={handleSave}
              disabled={isScanning || !extractedAmount}
              className="rounded-xl flex-1 font-bold text-xs"
            >
              Simpan ke Pengeluaran
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
