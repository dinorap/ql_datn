const axios = require('axios');
require('dotenv').config();

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const API_KEY = process.env.GEMINI_API_KEY;

const chatBot = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                EC: 1,
                EM: "Missing 'message' field in request body.",
            });
        }


        const requestData = {
            contents: [{
                parts: [{
                    text: message
                }]
            }],
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        };


        const response = await axios.post(
            `${API_URL}?key=${API_KEY}`,
            requestData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi";

        return res.status(200).json({
            EC: 0,
            EM: "Thành công",
            response_data: responseText
        });

    } catch (error) {
        console.error("Lỗi API Gemini:", error.response?.data || error.message);
        return res.status(500).json({
            EC: 1,
            EM: "Lỗi khi gọi API Gemini",
            error: error.response?.data || error.message
        });
    }
};

module.exports = { chatBot };