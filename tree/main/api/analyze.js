import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      console.error("File parsing error:", err);
      return res.status(400).json({ error: 'No file uploaded or form parse error' });
    }

    try {
      const buffer = fs.readFileSync(files.file[0].filepath);
      const parsed = await pdfParse(buffer);
      const text = parsed.text || 'Empty PDF content';

      const ai = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: `Please analyze this contract:\n\n${text}` }]
      });

      return res.status(200).json({ result: ai.choices[0].message.content });

    } catch (e) {
      console.error("AI or parsing error:", e);
      return res.status(500).json({ error: 'Server error: ' + e.message });
    }
  });
}
