"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Modal = DialogPrimitive.Root;
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

export function ModalContent({
  className,
  children,
  title,
  description,
  showCloseButton,
  ...props
}: DialogPrimitive.DialogContentProps & {
  title?: string;
  description?: string;
  showCloseButton?: boolean;
}) {
  const shouldShowClose = showCloseButton ?? Boolean(title);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-surface p-5 sm:p-6 shadow-float duration-200 rounded-3xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        {...props}
      >
        {title ? (
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-lg font-bold text-foreground">
              {title}
            </DialogPrimitive.Title>
            {shouldShowClose && (
              <DialogPrimitive.Close className="rounded-full p-1.5 text-muted hover:bg-black/5 hover:text-foreground transition-colors ml-auto">
                <X className="h-5 w-5" />
                <span className="sr-only">Tutup</span>
              </DialogPrimitive.Close>
            )}
          </div>
        ) : (
          <>
            <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
            {shouldShowClose && (
              <div className="flex items-center justify-end">
                <DialogPrimitive.Close className="rounded-full p-1.5 text-muted hover:bg-black/5 hover:text-foreground transition-colors ml-auto">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Tutup</span>
                </DialogPrimitive.Close>
              </div>
            )}
          </>
        )}
        {description && (
          <DialogPrimitive.Description className="text-sm text-muted -mt-2">
            {description}
          </DialogPrimitive.Description>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
