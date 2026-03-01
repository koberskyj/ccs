import React, { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "../ui/dialog";
import { t } from "i18next";

interface ConfirmModalProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function ConfirmModal({ children, isOpen, title, description, onOpenChange, onConfirm, onCancel, confirmText = t('core.confirm'), cancelText = t('core.cancel'), destructive = false }: ConfirmModalProps) {
  const [isOpenInternal, setIsOpenInternal ] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsOpenInternal(false);
  };

  const handleCancel = () => {
    if(onCancel) {
      onCancel();
    }
    setIsOpenInternal(false);
  };

  return (
    <Dialog open={isOpen !== undefined ? isOpen : isOpenInternal} onOpenChange={onOpenChange || setIsOpenInternal}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="pt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}