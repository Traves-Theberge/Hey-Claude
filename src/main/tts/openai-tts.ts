import https from 'https';

export class OpenAITTS {
  private apiKey: string;
  private voice: string;

  constructor(apiKey: string, voice: string = 'alloy') {
    this.apiKey = apiKey;
    this.voice = voice;
  }

  async speak(text: string): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: this.voice,
        response_format: 'mp3',
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/audio/speech',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        if (res.statusCode !== 200) {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            reject(new Error(`OpenAI TTS API error ${res.statusCode}: ${body}`));
          });
          return;
        }

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}
