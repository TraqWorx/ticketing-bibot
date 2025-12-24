
import axios from '@/utils/axios';
import FormData from 'form-data';

export async function transcribeAudioWithWhisper(audioBuffer: Buffer, fileName: string): Promise<string> {
  if (!process.env.OPEN_AI_API_KEY) {
    throw new Error('OPEN_AI_API_KEY non configurata nel .env');
  }

  const formData = new FormData();
  formData.append('file', audioBuffer, { filename: fileName });
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');
  formData.append('language', 'it');

  try {
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPEN_AI_API_KEY}`,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      responseType: 'text',
    });
    return typeof response.data === 'string' ? response.data : (response.data?.text || JSON.stringify(response.data));
  } catch (err: any) {
    // Gestione errori Axios/OpenAI
    if (err.response) {
      // Errore HTTP
      if (err.response.status === 429) {
        console.error('[Whisper error] Limite OpenAI Whisper raggiunto (429 Too Many Requests):', err.response.data);
      } else {
        console.error(`[Whisper error] Errore HTTP ${err.response.status}:`, err.response.data);
      }
    } else if (err.request) {
      // Nessuna risposta
      console.error('[Whisper error] Nessuna risposta da OpenAI Whisper:', err.message);
    } else {
      // Altro errore
      console.error('[Whisper error] Errore generico:', err.message);
    }
    throw err;
  }
}
