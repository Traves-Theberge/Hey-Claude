import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import type { AppConfig } from '../lib/ipc';

export type ConversationState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'responding'
  | 'error';

interface ConversationData {
  state: ConversationState;
  transcript: string;
  interimTranscript: string;
  response: string;
  error: string | null;
  isWakeWordListening: boolean;
}

export function useConversation() {
  const [convState, setConvState] = useState<ConversationState>('idle');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speech = useSpeechRecognition();

  // Load config on mount
  useEffect(() => {
    window.electronAPI?.getConfig().then(setConfig);
  }, []);

  // Listen for wake word detection
  useEffect(() => {
    const cleanup = window.electronAPI?.onWakeWordDetected(() => {
      startListening();
    });
    return cleanup;
  }, []);

  // Listen for wake word state changes
  useEffect(() => {
    const cleanup = window.electronAPI?.onListeningStateChanged((state) => {
      setIsWakeWordListening(state);
    });

    // Get initial state
    window.electronAPI?.getListeningState().then(setIsWakeWordListening);

    return cleanup;
  }, []);

  // Listen for Claude responses
  useEffect(() => {
    const cleanupChunk = window.electronAPI?.onClaudeResponseChunk((chunk) => {
      setResponse((prev) => prev + chunk);
    });

    const cleanupComplete = window.electronAPI?.onClaudeResponseComplete(
      (fullResponse) => {
        setResponse(fullResponse);
        setConvState('responding');
        speakResponse(fullResponse);
      }
    );

    const cleanupError = window.electronAPI?.onClaudeError((err) => {
      setError(err);
      setConvState('error');
    });

    return () => {
      cleanupChunk?.();
      cleanupComplete?.();
      cleanupError?.();
    };
  }, [config]);

  const startListening = useCallback(() => {
    setConvState('listening');
    setResponse('');
    setError(null);

    speech.start((transcript) => {
      if (transcript) {
        setConvState('processing');
        window.electronAPI?.sendPrompt(transcript);
      } else {
        setConvState('idle');
      }
    });
  }, [speech]);

  const speakResponse = useCallback(
    async (text: string) => {
      const provider = config?.ttsProvider || 'web-speech';

      if (provider === 'web-speech') {
        // Use browser's built-in speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          setConvState('idle');
        };

        utterance.onerror = () => {
          setConvState('idle');
        };

        speechSynthesis.speak(utterance);
      } else {
        // Use main process TTS (Kokoro, ElevenLabs, OpenAI)
        try {
          await window.electronAPI?.ttsSpeak(text, provider);
        } catch {
          // Fallback to web speech
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => setConvState('idle');
          speechSynthesis.speak(utterance);
        }
      }
    },
    [config]
  );

  // Listen for TTS audio data from main process
  useEffect(() => {
    const cleanupAudio = window.electronAPI?.onTtsAudioData((data) => {
      const blob = new Blob([data], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setConvState('idle');
      };

      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        setConvState('idle');
      });
    });

    const cleanupDone = window.electronAPI?.onTtsDone(() => {
      // If no audio data was sent (web-speech provider), state is handled there
    });

    const cleanupError = window.electronAPI?.onTtsError((err) => {
      console.error('[TTS Error]', err);
      setConvState('idle');
    });

    return () => {
      cleanupAudio?.();
      cleanupDone?.();
      cleanupError?.();
    };
  }, []);

  const cancel = useCallback(() => {
    speech.stop();
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.electronAPI?.ttsStop();
    setConvState('idle');
    setResponse('');
    setError(null);
  }, [speech]);

  const toggleWakeWord = useCallback(async () => {
    const result = await window.electronAPI?.toggleListening();
    setIsWakeWordListening(result ?? false);
  }, []);

  const data: ConversationData = {
    state: convState,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,
    response,
    error,
    isWakeWordListening,
  };

  return {
    ...data,
    startListening,
    cancel,
    toggleWakeWord,
    config,
    setConfig: async (newConfig: Partial<AppConfig>) => {
      const updated = await window.electronAPI?.saveConfig(newConfig);
      if (updated) setConfig(updated);
    },
  };
}
