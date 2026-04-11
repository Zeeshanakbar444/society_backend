import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
    if (!admin.apps.length) {
        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
            console.error('FIREBASE_PROJECT_ID or FIREBASE_PRIVATE_KEY is missing');
        } else {
            let privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            // Recovery: If the key is corrupted with a prefix, try to find the actual PEM block
            if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                privateKey = privateKey.slice(privateKey.indexOf('-----BEGIN PRIVATE KEY-----'));
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
        }
    }
} catch (error) {
    console.error('Firebase Admin initialization error:', error);
}

export const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
