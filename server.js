// Server.js
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

// Verify API key is loaded
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
}

app.use(express.json());
app.use(express.static('public'));

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey: OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.post('/api/generate', async (req, res) => {
    try {
        if (!OPENAI_API_KEY) {
            throw new Error('API key not configured');
        }

        const { productName, category, keyFeatures, tone } = req.body;

        if (!productName || !category || !keyFeatures || !tone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const prompt = `Create a ${tone} product description for a ${category} called "${productName}". 
Key features: ${keyFeatures}

Guidelines:
- Use a ${tone} tone of voice
- Highlight the key features effectively
- Make it engaging and persuasive
- Keep it concise but comprehensive
- Include a clear value proposition
- Consider SEO optimization
- Always respond in the same language as the main functions are given in.

Please write the description in a single paragraph.`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 200
        });

        res.json({ description: completion.data.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI API Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to generate description',
            details: error.response?.data?.error?.message || error.message
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('API Key configured:', OPENAI_API_KEY ? 'Yes' : 'No');
});