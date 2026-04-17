import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Typography } from '../atoms/Typography';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'h-[70%]',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 left-0 right-0 ${height} bg-theme-surface rounded-t-[2.5rem] z-[70] flex flex-col overflow-hidden border-t border-white/10`}
          >
            <div className="flex justify-between items-center px-8 pt-8 pb-4">
              {title && (
                <Typography variant="h3">{title}</Typography>
              )}
              <Button
                variant="secondary"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
