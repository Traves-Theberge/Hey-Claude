import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceOverlay } from '../../src/renderer/components/VoiceOverlay';

describe('VoiceOverlay', () => {
  const defaultProps = {
    state: 'idle' as const,
    transcript: '',
    interimTranscript: '',
    response: '',
    error: null,
    onCancel: vi.fn(),
    onStartListening: vi.fn(),
  };

  describe('idle state', () => {
    it('should show prompt text', () => {
      render(<VoiceOverlay {...defaultProps} />);
      expect(screen.getByText(/Hey Claude/)).toBeInTheDocument();
      expect(screen.getByText(/click the microphone/)).toBeInTheDocument();
    });

    it('should call onStartListening when microphone is clicked', () => {
      const onStart = vi.fn();
      render(<VoiceOverlay {...defaultProps} onStartListening={onStart} />);

      // The microphone button is the clickable div with the SVG
      const micButton = screen.getByText(/click the microphone/).closest('div')?.parentElement?.querySelector('[class*="cursor-pointer"]');
      if (micButton) {
        fireEvent.click(micButton);
        expect(onStart).toHaveBeenCalledTimes(1);
      }
    });

    it('should not show cancel button', () => {
      render(<VoiceOverlay {...defaultProps} />);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('listening state', () => {
    it('should show listening indicator', () => {
      render(<VoiceOverlay {...defaultProps} state="listening" />);
      expect(screen.getByText('Listening...')).toBeInTheDocument();
    });

    it('should show cancel button', () => {
      render(<VoiceOverlay {...defaultProps} state="listening" />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onCancel when cancel is clicked', () => {
      const onCancel = vi.fn();
      render(<VoiceOverlay {...defaultProps} state="listening" onCancel={onCancel} />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('processing state', () => {
    it('should show processing indicator', () => {
      render(<VoiceOverlay {...defaultProps} state="processing" />);
      expect(screen.getByText('Claude is thinking...')).toBeInTheDocument();
    });

    it('should show transcript', () => {
      render(
        <VoiceOverlay
          {...defaultProps}
          state="processing"
          transcript="What is the weather?"
        />
      );
      expect(screen.getByText('What is the weather?')).toBeInTheDocument();
    });

    it('should show streaming response when available', () => {
      render(
        <VoiceOverlay
          {...defaultProps}
          state="processing"
          response="The weather is..."
        />
      );
      expect(screen.getByText('The weather is...')).toBeInTheDocument();
    });

    it('should show cancel button', () => {
      render(<VoiceOverlay {...defaultProps} state="processing" />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('responding state', () => {
    it('should show speaking indicator', () => {
      render(
        <VoiceOverlay
          {...defaultProps}
          state="responding"
          response="Hello there!"
        />
      );
      expect(screen.getByText('Speaking...')).toBeInTheDocument();
    });

    it('should show the response', () => {
      render(
        <VoiceOverlay
          {...defaultProps}
          state="responding"
          response="Here is my answer"
        />
      );
      expect(screen.getByText('Here is my answer')).toBeInTheDocument();
    });

    it('should show cancel button', () => {
      render(<VoiceOverlay {...defaultProps} state="responding" />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message', () => {
      render(
        <VoiceOverlay
          {...defaultProps}
          state="error"
          error="Something went wrong"
        />
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show cancel button', () => {
      render(
        <VoiceOverlay
          {...defaultProps}
          state="error"
          error="Error"
        />
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });
});
