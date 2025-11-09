import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
                <h2 className="text-2xl font-bold neon-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <X className="w-5 h-5 text-gray-900 dark:text-white" />
                </button>
              </div>
              <div className="p-6">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
