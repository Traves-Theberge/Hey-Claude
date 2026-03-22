import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPanel } from '../../src/renderer/components/SettingsPanel';
import type { AppConfig } from '../../src/renderer/lib/ipc';

const defaultConfig: AppConfig = {
  picovoiceAccessKey: '',
  ttsProvider: 'kokoro',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
  openAiApiKey: '',
  openAiVoice: 'alloy',
  kokoroVoice: 'af_bella',
  sensitivity: 0.5,
};

describe('SettingsPanel', () => {
  const defaultProps = {
    isOpen: true,
    config: defaultConfig,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  it('should not render when closed', () => {
    render(<SettingsPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('should render settings title when open', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should show wake word section', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText('Wake Word (Picovoice)')).toBeInTheDocument();
    expect(screen.getByText('Access Key')).toBeInTheDocument();
  });

  it('should show TTS section', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText('Text-to-Speech')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
  });

  it('should show kokoro voice field by default', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText('Voice')).toBeInTheDocument();
  });

  it('should show save and cancel buttons', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<SettingsPanel {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onSave and onClose when save is clicked', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<SettingsPanel {...defaultProps} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show sensitivity slider', () => {
    render(<SettingsPanel {...defaultProps} />);
    expect(screen.getByText(/Sensitivity/)).toBeInTheDocument();
  });

  it('should show ElevenLabs fields when provider is elevenlabs', () => {
    const config = { ...defaultConfig, ttsProvider: 'elevenlabs' as const };
    render(<SettingsPanel {...defaultProps} config={config} />);
    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByText('Voice ID')).toBeInTheDocument();
  });

  it('should show OpenAI fields when provider is openai', () => {
    const config = { ...defaultConfig, ttsProvider: 'openai' as const };
    render(<SettingsPanel {...defaultProps} config={config} />);
    expect(screen.getByText('API Key')).toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SettingsPanel {...defaultProps} onClose={onClose} />);

    // The backdrop is the outer motion.div with the fixed class
    const backdrop = screen.getByText('Settings').closest('[class*="fixed"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
