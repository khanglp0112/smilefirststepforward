import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json());

// Serve static files from root
app.use(express.static(__dirname));

// Lazy initialization for Gemini client
let aiClient = null;
function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    if (!aiClient) {
        aiClient = new GoogleGenAI({
            apiKey,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }
    return aiClient;
}

const SYSTEM_INSTRUCTION = `Bạn là "Bé Mầm Orion" (Orion Smileie) - Trợ lý AI thông minh & Mascot đại diện cho Hệ Thống Nha Khoa Orion và Chiến dịch Học Đường "Smile: First Step Forward".

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc chuyên sâu về Nha khoa, Chỉnh nha (Orthodontics), Niềng răng mắc cài (kim loại, pha lê, sứ), Niềng răng trong suốt (Invisalign), Chăm sóc sức khỏe răng miệng, Tẩy trắng răng, Trám răng, Nhổ răng khôn, Vệ sinh răng miệng đúng cách.
2. Cung cấp thông tin chính xác về Nha Khoa Orion (Địa chỉ phòng khám, quy trình thăm khám 3D Smile Scan chuẩn y khoa, phác đồ cá nhân hóa, chính sách niềng răng trả góp 0% cho học sinh - sinh viên).
3. Hỗ trợ thông tin Chiến dịch "Smile: First Step Forward" - Khảo sát nhận thẻ đặc quyền Smile Ambassador Passport dành cho HSSV.
4. Trả lời thân thiện, tư vấn chân thành, tích cực, truyền cảm hứng tự tin.
5. Luôn trả lời bằng ngôn ngữ mà người dùng hỏi (Tiếng Việt hoặc Tiếng Anh). Dùng định dạng rõ ràng, ngắn gọn, dễ đọc với các biểu tượng cảm xúc phù hợp (🦷, ✨, 🍊, 💙).
6. Khuyên người dùng nên thăm khám trực tiếp với bác sĩ chuyên khoa Nha Khoa Orion để có chẩn đoán chính xác nhất bằng phim X-quang 3D.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, lang } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required.' });
        }

        const ai = getGeminiClient();

        // Format conversation history for Gemini chat
        const formattedContents = messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: formattedContents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION + (lang === 'en' ? '\nUser interface language: English. Respond in English.' : '\nNgôn ngữ giao diện: Tiếng Việt.'),
                temperature: 0.7,
            }
        });

        const replyText = response.text || 'Xin lỗi, Bé Mầm chưa nghe rõ. Bạn có thể gửi lại câu hỏi không?';
        return res.json({ reply: replyText });
    } catch (error) {
        console.error('Error in /api/chat:', error);
        return res.status(500).json({
            error: error.message || 'An error occurred while communicating with Gemini API.'
        });
    }
});

// Specifically serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

