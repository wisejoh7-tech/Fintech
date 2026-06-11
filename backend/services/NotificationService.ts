import { prisma } from "../config/db";
import { SocketService } from "./SocketService";
import nodemailer from "nodemailer";
import admin from "firebase-admin";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class NotificationService {
  static async sendPush(userId: string, title: string, body: string, data?: any) {
    try {
      // 1. Real-time Socket.io Notification
      SocketService.emitToUser(userId, 'notification', { title, body, data });

      // 2. Push Notification via FCM
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.fcmToken) {
        const message = {
          notification: { title, body },
          data: data || {},
          token: user.fcmToken,
        };
        try {
            await admin.messaging().send(message);
        } catch (fcmErr) {
            console.warn("[Notification] FCM send failed:", fcmErr);
        }
      }

      // 3. Email Notification if it's high priority
      if (data?.priority === 'high' && user?.email) {
        await this.sendEmail(user.email, title, body);
      }

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async sendWelcomeEmail(email: string, name: string) {
    const subject = "Welcome to VIVA Banking!";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #007bff;">Hi ${name}, welcome to VIVA!</h2>
        <p>We're excited to have you on board. Your corporate banking journey starts here.</p>
        <p>With VIVA, you can:</p>
        <ul>
          <li>Manage your accounts and transactions in real-time.</li>
          <li>Save with Vaults and earn interest.</li>
          <li>Handle bulk payments and payroll with ease.</li>
          <li>Generate professional invoices.</li>
        </ul>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Stay secure,<br/>The VIVA Team</p>
      </div>
    `;
    await this.sendEmail(email, subject, name, html);
  }

  static async sendSecurityAlert(userId: string, title: string, detail: string) {
    // Send both Push and High-Priority Email
    await this.sendPush(userId, title, detail, { priority: 'high', type: 'SECURITY' });
  }

  static async sendEmail(email: string, subject: string, text: string, html?: string) {
    if (!process.env.EMAIL_USER) {
      console.log(`[Email Simulation] To: ${email} | Subject: ${subject}`);
      return;
    }

    try {
      await transporter.sendMail({
        from: `"VIVA Banking" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      });
      console.log(`Email sent to ${email}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }
}
