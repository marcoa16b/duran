"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ModalConfirmacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant?: "danger" | "warning" | "default";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

const variantStyles = {
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  warning: "bg-yellow-500 text-white hover:bg-yellow-600",
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
};

export function ModalConfirmacion({
  open,
  onOpenChange,
  title,
  description,
  variant = "default",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
}: ModalConfirmacionProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(variantStyles[variant])}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
