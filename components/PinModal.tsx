import React, { useState, useEffect } from "react";
import { Lock, Fingerprint, Delete } from "lucide-react";
import { motion } from "framer-motion";
import { getTranslation } from "../i18n";
import { Language } from "../types";

interface PinModalProps {
  onSuccess: () => void;
  onCancel?: () => void;
  lang: Language;
  biometricsEnabled?: boolean;
  onVerifyBiometrics?: () => Promise<boolean>;
}

export const PinModal: React.FC<PinModalProps> = ({
  onSuccess,
  onCancel,
  lang,
  biometricsEnabled,
  onVerifyBiometrics
}) => {
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const t = (key: any) => getTranslation(lang, key);
  const getStoredPin = () => localStorage.getItem("parity_pin") || "0000";

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        if (newPin === getStoredPin()) {
          onSuccess();
        } else {
          setTimeout(() => {
            setPinError(true);
            setPinInput("");
          }, 200);
        }
      }
    }
  };

  useEffect(() => {
    if (biometricsEnabled && onVerifyBiometrics) {
      const trigger = async () => {
        const success = await onVerifyBiometrics();
        if (success) onSuccess();
      };
      trigger();
    }
  }, []);

  useEffect(() => {
    if (pinError) {
      const timer = setTimeout(() => setPinError(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [pinError]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200 backdrop-blur-md">
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-theme-surface border border-white/10 flex items-center justify-center text-theme-brand shadow-2xl shadow-brand/20 mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-theme-primary text-center">
            {t("verifyIdentity")}
          </h2>
          <p className="text-theme-secondary text-sm text-center">
            {t("enterPin")}
          </p>
        </div>
        <div className="flex gap-4 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pinInput.length ? (pinError ? "bg-red-500 scale-110" : "bg-theme-brand scale-110") : "bg-white/10"}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6 w-full px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePinDigit(num.toString())}
              className="w-full aspect-square rounded-full bg-theme-soft hover:bg-theme-surface border border-theme-soft text-2xl font-black text-theme-primary transition-all active:scale-95 flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            key="0"
            onClick={() => handlePinDigit("0")}
            className="w-full aspect-square rounded-full bg-theme-surface/30 hover:bg-theme-surface border border-white/5 text-2xl font-semibold text-theme-primary transition-all active:scale-95 flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={() => setPinInput((prev) => prev.slice(0, -1))}
            className="w-full aspect-square rounded-full flex items-center justify-center text-theme-secondary hover:text-white"
          >
            <Delete size={24} />
          </button>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 text-theme-secondary text-sm hover:text-white"
          >
            {t("cancel")}
          </button>
        )}

        {biometricsEnabled && onVerifyBiometrics && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              const success = await onVerifyBiometrics();
              if (success) {
                onSuccess();
              }
            }}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-theme-surface/30 border border-white/5 rounded-2xl text-theme-primary font-bold transition-all shadow-sm"
          >
            <Fingerprint size={20} className="text-theme-brand" />
            <span>{t('biometrics')}</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};
