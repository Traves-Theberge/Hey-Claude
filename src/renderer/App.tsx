import { useState } from 'react';
import { useConversation } from './hooks/useConversation';
import { StatusBar } from './components/StatusBar';
import { VoiceOverlay } from './components/VoiceOverlay';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const conversation = useConversation();

  return (
    <div className="h-screen flex flex-col bg-claude-bg rounded-2xl overflow-hidden border border-claude-border">
      <StatusBar
        isWakeWordListening={conversation.isWakeWordListening}
        ttsProvider={conversation.config?.ttsProvider || 'kokoro'}
        onToggleWakeWord={conversation.toggleWakeWord}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <VoiceOverlay
        state={conversation.state}
        transcript={conversation.transcript}
        interimTranscript={conversation.interimTranscript}
        response={conversation.response}
        error={conversation.error}
        onCancel={conversation.cancel}
        onStartListening={conversation.startListening}
      />

      <SettingsPanel
        isOpen={settingsOpen}
        config={conversation.config}
        onClose={() => setSettingsOpen(false)}
        onSave={conversation.setConfig}
      />
    </div>
  );
}
