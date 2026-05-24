//https://odtuclass2025s.metu.edu.tr/mod/resource/view.php?id=65069

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables!");
    }

    return secret;
}

function getRefreshSecret() {
    const secret = process.env.REFRESH_SECRET;

    if (!secret) {
        throw new Error("REFRESH_SECRET is not defined in environment variables!");
    }

    return secret;
}

export async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: "1h" });
}

export function generateRefreshToken(payload) {
    return jwt.sign(payload, getRefreshSecret(), { expiresIn: "15d" });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, getJwtSecret());
    } catch {
        return null;
    }
}

export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, getRefreshSecret());
    } catch {
        return null;
    }
}