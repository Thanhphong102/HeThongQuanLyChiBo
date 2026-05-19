const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log('Using key:', key.substring(0, 10) + '...');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    const result = await model.generateContent("Hello");
    console.log("Success! Response:", result.response.text());
  } catch (error) {
    console.error("API Error:");
    console.error(error.message);
    if (error.response) {
      console.error(error.response);
    }
  }
}

test();
