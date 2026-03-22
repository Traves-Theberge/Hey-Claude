import https from 'https';

export class ElevenLabsTTS {
  private apiKey: string;
  private voiceId: string;

  constructor(apiKey: string, voiceId: string = 'pNInz6obpgDQGcFmaJgB') {
    this.apiKey = apiKey;
    this.voiceId = voiceId;
  }

  async speak(text: string): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      });

      const options = {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${this.voiceId}`,
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        if (res.statusCode !== 200) {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            reject(new Error(`ElevenLabs API error ${res.statusCode}: ${body}`));
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
