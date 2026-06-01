// Initialize Firebase Admin with Service Account from ENV
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log("[Notification] Firebase Admin initialized with production credentials.");
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'vivabanking',
      });
      console.warn("[Notification] Using default Firebase credentials.");
    }
  } catch (err) {
    console.warn("[Notification] Firebase initialization failed. Push notifications disabled.");
  }
}
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
        await admin.messaging().send(message);
      }

      // 3. Email Notification if it's high priority
      if (data?.priority === 'high' && user?.email) {
        await this.sendEmail(user.email, title, body);
      }

    } catch (error) {
      console.error('Error sending notification:', error);
    }
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

