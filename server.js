import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { promises as fs } from 'fs';
import googleTTS from 'google-tts-api';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import OpenAI from "openai";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';

dotenv.config();

const app = express();
const port = process.env.PORT;

const users = [{
    'username': 'admin',
    'password': process.env.ADMIN_PASSWORD,
}];

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Configure Passport.js
passport.use(new LocalStrategy((username, password, done) => {
    const user = users.find(u => u.username === username);
    if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
    }
    bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Incorrect password.' });
        }
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser((username, done) => {
    const user = users.find(u => u.username === username);
    done(null, user);
});

app.use(express.static(path.join('./', 'public')));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openai = new OpenAI();

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
}));

app.post('/chat', async (req, res) => {
    console.log(req.isAuthenticated);
    if (!req.isAuthenticated()) {
        return res.status(401).send('Unauthorized');
    }

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