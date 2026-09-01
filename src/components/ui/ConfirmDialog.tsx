"use client";

import React from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
  isSubmitting = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-sm sm:max-w-md p-6">
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          {/* Warning Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-[#FFE8EA] dark:bg-[#3D2528] text-[#FF7A85] flex items-center justify-center shadow-soft">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2.5 w-full pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-[#FF7A85] hover:bg-[#E56873] text-white font-bold"
            >
              {isSubmitting ? "Menghapus..." : confirmText}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
