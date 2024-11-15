import GoogleAuth, { type GoogleKey } from 'cloudflare-workers-and-google-oauth';

type Secrets = Omit<GoogleKey, 'type' | 'client_email' | 'auth_uri' | 'token_uri' | 'auth_provider_x509_cert_url' | 'client_x509_cert_url'>;

export class VisionAIClient {
  private readonly oauth: GoogleAuth;

  constructor(secrets: Secrets) {
    const credentials = {
      ...secrets,
      "type": "service_account",
      "client_email": `auto-labes@${secrets.project_id}.iam.gserviceaccount.com`,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "universe_domain": "googleapis.com",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/auto-labes%40${secrets.project_id}.iam.gserviceaccount.com`
    }

    this.oauth = new GoogleAuth(
      credentials,
      ['https://www.googleapis.com/auth/cloud-vision']
    );
  }

  async analyzeImage(imageBytes: ArrayBuffer): Promise<VisionResponse> {
    try {
      const token = await this.oauth.getGoogleAuthToken();
      
      const response = await fetch(
        'https://vision.googleapis.com/v1/images:annotate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              image: {
                content: this.arrayBufferToBase64(imageBytes)
              },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 5 },
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'TEXT_DETECTION' },
              ],
              imageContext: {
                languageHints: ['ja', 'en']
              }
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Vision API error:', errorData);
        // throw new Error(`Vision API error: ${errorData.error?.message || response.statusText}`);
      }

      const data: { responses: VisionResponse[] } = await response.json();
      console.log(data)
      return data.responses[0];
    } catch (error) {
      console.error('Error in analyzeImage:', error);
      throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    // 大きなバイナリデータを安全に処理
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 1024; // より小さなチャンクで処理

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    return btoa(binary);
  }
}

