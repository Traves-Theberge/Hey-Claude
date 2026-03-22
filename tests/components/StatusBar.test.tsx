import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBar } from '../../src/renderer/components/StatusBar';

describe('StatusBar', () => {
  const defaultProps = {
    isWakeWordListening: false,
    ttsProvider: 'kokoro',
    onToggleWakeWord: vi.fn(),
    onOpenSettings: vi.fn(),
  };

  it('should render the app name', () => {
    render(<StatusBar {...defaultProps} />);
    expect(screen.getByText('Hey Claude')).toBeInTheDocument();
  });

  it('should show "Paused" when not listening', () => {
    render(<StatusBar {...defaultProps} isWakeWordListening={false} />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('should show "Listening" when wake word is active', () => {
    render(<StatusBar {...defaultProps} isWakeWordListening={true} />);
    expect(screen.getByText('Listening')).toBeInTheDocument();
  });

  it('should display the TTS provider', () => {
    render(<StatusBar {...defaultProps} ttsProvider="elevenlabs" />);
    expect(screen.getByText('TTS: elevenlabs')).toBeInTheDocument();
  });

  it('should call onToggleWakeWord when status badge is clicked', () => {
    const onToggle = vi.fn();
    render(<StatusBar {...defaultProps} onToggleWakeWord={onToggle} />);

    fireEvent.click(screen.getByText('Paused'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenSettings when settings button is clicked', () => {
    const onOpen = vi.fn();
    render(<StatusBar {...defaultProps} onOpenSettings={onOpen} />);

    // Settings button is the last button (gear icon)
    const buttons = screen.getAllByRole('button');
    const settingsButton = buttons[buttons.length - 1];
    fireEvent.click(settingsButton);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
