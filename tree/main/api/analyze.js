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

async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const buffer = fs.readFileSync(files.file[0].filepath);
      const text = await pdfParse(buffer).then(r => r.text);

      const ai = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: `Please analyze this contract:\n\n${text}` }],
      });

      res.status(200).json({ result: ai.choices[0].message.content });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

// ✅ THIS IS THE MISSING LINE:
export default handler;
