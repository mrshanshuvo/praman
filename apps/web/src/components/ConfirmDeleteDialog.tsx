'use client';

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemTitle?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = 'Delete Application',
  itemTitle,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDeleting = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-6 gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/25 flex items-center justify-center text-destructive shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <DialogHeader className="p-0 gap-1 text-left">
              <DialogTitle className="text-base font-semibold text-foreground">{title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {description || (
                  <>
                    Are you sure you want to permanently delete{' '}
                    <span className="font-semibold text-foreground">
                      &ldquo;{itemTitle || 'this job'}&rdquo;
                    </span>{' '}
                    and all associated pipeline evidence? This action cannot be undone.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="border-t border-border/50 pt-4 flex-row justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs cursor-pointer"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="text-xs font-semibold gap-1.5 cursor-pointer bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmLabel}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
