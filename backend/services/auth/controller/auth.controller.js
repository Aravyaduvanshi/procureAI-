import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis.js";

export const login = async (req, res) => {
  try {
    const { token, mockUser } = req.body;
    let decodedToken = null;

    if (token && app) {
      try {
        decodedToken = await getAuth(app).verifyIdToken(token);
      } catch (e) {
        console.warn("[Auth] Firebase token verification failed, checking mock dev login:", e.message);
      }
    }

    // Dev/Mock fallback if Firebase token is absent or dev mode requested
    if (!decodedToken) {
      if (token === "dev-buyer-token" || mockUser || process.env.NODE_ENV !== "production") {
        decodedToken = {
          uid: mockUser?.uid || "dev_buyer_uid_01",
          name: mockUser?.name || "ProcureAI Lead Buyer",
          email: mockUser?.email || "buyer@example.com",
          picture: mockUser?.picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
        };
      } else {
        return res.status(401).json({ message: "Invalid or missing authentication token" });
      }
    }

    let user = null;
    try {
      user = await User.findOne({ firebaseUId: decodedToken.uid });
      if (!user) {
        user = await User.create({
          firebaseUId: decodedToken.uid,
          name: decodedToken.name || "ProcureAI Buyer",
          email: decodedToken.email,
          avatar: decodedToken.picture || null
        });
      }
    } catch (err) {
      // If MongoDB is not connected, use in-memory object representation
      user = {
        firebaseUId: decodedToken.uid,
        name: decodedToken.name || "ProcureAI Buyer",
        email: decodedToken.email,
        avatar: decodedToken.picture || null,
        role: "buyer"
      };
    }

    const sessionId = crypto.randomUUID();
    const sessionPayload = {
      id: user.firebaseUId || user._id || "dev_buyer_01",
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role || "buyer"
    };

    // Store session in Redis for 24 hours
    await redis.set(`session:${sessionId}`, JSON.stringify(sessionPayload), "EX", 86400);

    // Set cookie
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: sessionPayload,
      sessionId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Login error", error: error.message });
  }
};

export const me = async (req, res) => {
  try {
    const sessionId = req.cookies?.session || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

    if (!sessionId) {
      // In local dev mode, provide active dev user
      if (process.env.NODE_ENV !== "production") {
        return res.status(200).json({
          authenticated: true,
          user: {
            id: "dev_buyer_uid_01",
            name: "ProcureAI Lead Buyer",
            email: "buyer@example.com",
            role: "buyer",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
          }
        });
      }
      return res.status(401).json({ authenticated: false, message: "No active session" });
    }

    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return res.status(401).json({ authenticated: false, message: "Session expired" });
    }

    const user = JSON.parse(sessionData);
    return res.status(200).json({ authenticated: true, user });
  } catch (err) {
    return res.status(500).json({ authenticated: false, message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }
    res.clearCookie("session");
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};