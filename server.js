import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { promises as fs } from 'fs';
import googleTTS from 'google-tts-api';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = 8080;

const openai = new OpenAI();

app.use(express.static(path.join('./', 'public')));

app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    const language = req.body.language;

    console.log(`Bearer ${process.env.OPENAI_API_KEY}`);
    console.log(userMessage);

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k",
            messages: [{ role: "user", content: userMessage }],
        });

        console.log(completion.choices[0].message.content);
        console.log(language);
        const chatGPTResponse = completion.choices[0].message.content;

        const urls = googleTTS.getAllAudioUrls(chatGPTResponse, {
            lang: language,
            slow: false,
            host: 'https://translate.google.com',
        });
        console.log(urls);

        const audioBuffers = await Promise.all(urls.map(async (url) => {
            console.log(url);
            const audioResponse = await fetch(url.url);
            return audioResponse.arrayBuffer();
        }));
        const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
        const concatenatedBuffer = new Uint8Array(totalLength);
        let offset = 0;
        audioBuffers.forEach(buffer => {
            concatenatedBuffer.set(new Uint8Array(buffer), offset);
            offset += buffer.byteLength;
        });

        await fs.writeFile('public/response.mp3', Buffer.from(concatenatedBuffer));
        res.send({'url': '/response.mp3', 'response': chatGPTResponse});
    } catch (error) {
        console.error('Error communicating with ChatGPT:', error);
        res.status(500).send('Error communicating with ChatGPT');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
