import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

class User {
    static async create({ username, email, password }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const apiKey = crypto.randomBytes(32).toString('hex');

        const connection = await pool.getConnection();
        try {
            await connection.query(
                'INSERT INTO users (username, email, password, api_key) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, apiKey]
            );
            return {
                success: true,
                apiKey
            };
        } catch (error) {
            throw error;
        } finally {
            connection.release();
        }
    }

    static async findByEmail(email) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0];
        } finally {
            connection.release();
        }
    }

    static async validateApiKey(apiKey) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(
                'SELECT * FROM users WHERE api_key = ?',
                [apiKey]
            );
            return rows[0];
        } finally {
            connection.release();
        }
    }
}

export default User