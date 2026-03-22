import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppConfig } from '../lib/ipc';

interface SettingsPanelProps {
  isOpen: boolean;
  config: AppConfig | null;
  onClose: () => void;
  onSave: (config: Partial<AppConfig>) => void;
}

export function SettingsPanel({ isOpen, config, onClose, onSave }: SettingsPanelProps) {
  const [formState, setFormState] = useState<Partial<AppConfig>>(config || {});

  const handleChange = (key: keyof AppConfig, value: string | number) => {
    setFormState((s) => ({ ...s, [key]: value }));
  };

  const handleSave = () => {
    onSave(formState);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-claude-surface border border-claude-border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-claude-text mb-4">Settings</h2>

            {/* Picovoice */}
            <Section title="Wake Word (Picovoice)">
              <Input
                label="Access Key"
                type="password"
                value={formState.picovoiceAccessKey || ''}
                onChange={(v) => handleChange('picovoiceAccessKey', v)}
                placeholder="Your Picovoice access key"
              />
              <RangeInput
                label={`Sensitivity: ${formState.sensitivity ?? 0.5}`}
                min={0}
                max={1}
                step={0.1}
                value={formState.sensitivity ?? 0.5}
                onChange={(v) => handleChange('sensitivity', v)}
              />
            </Section>

            {/* TTS Provider */}
            <Section title="Text-to-Speech">
              <Select
                label="Provider"
                value={formState.ttsProvider || 'kokoro'}
                options={[
                  { value: 'kokoro', label: 'Kokoro (Local, Default)' },
                  { value: 'web-speech', label: 'Web Speech API (Built-in)' },
                  { value: 'elevenlabs', label: 'ElevenLabs' },
                  { value: 'openai', label: 'OpenAI TTS' },
                ]}
                onChange={(v) => handleChange('ttsProvider', v)}
              />

              {formState.ttsProvider === 'kokoro' && (
                <Input
                  label="Voice"
                  value={formState.kokoroVoice || 'af_bella'}
                  onChange={(v) => handleChange('kokoroVoice', v)}
                  placeholder="e.g. af_bella, af_sarah"
                />
              )}

              {formState.ttsProvider === 'elevenlabs' && (
                <>
                  <Input
                    label="API Key"
                    type="password"
                    value={formState.elevenLabsApiKey || ''}
                    onChange={(v) => handleChange('elevenLabsApiKey', v)}
                    placeholder="Your ElevenLabs API key"
                  />
                  <Input
                    label="Voice ID"
                    value={formState.elevenLabsVoiceId || ''}
                    onChange={(v) => handleChange('elevenLabsVoiceId', v)}
                    placeholder="Voice ID"
                  />
                </>
              )}

              {formState.ttsProvider === 'openai' && (
                <>
                  <Input
                    label="API Key"
                    type="password"
                    value={formState.openAiApiKey || ''}
                    onChange={(v) => handleChange('openAiApiKey', v)}
                    placeholder="Your OpenAI API key"
                  />
                  <Select
                    label="Voice"
                    value={formState.openAiVoice || 'alloy'}
                    options={[
                      { value: 'alloy', label: 'Alloy' },
                      { value: 'echo', label: 'Echo' },
                      { value: 'fable', label: 'Fable' },
                      { value: 'onyx', label: 'Onyx' },
                      { value: 'nova', label: 'Nova' },
                      { value: 'shimmer', label: 'Shimmer' },
                    ]}
                    onChange={(v) => handleChange('openAiVoice', v)}
                  />
                </>
              )}
            </Section>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg text-claude-text-muted bg-claude-surface-light hover:bg-claude-border transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-lg text-white bg-claude-primary hover:bg-claude-secondary transition-colors text-sm font-medium"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Sub-components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-claude-primary mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-claude-text-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm focus:outline-none focus:border-claude-primary transition-colors"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-claude-text-muted mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-claude-bg border border-claude-border rounded-lg text-claude-text text-sm focus:outline-none focus:border-claude-primary transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeInput({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-claude-text-muted mb-1">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-claude-primary"
      />
    </div>
  );
}
