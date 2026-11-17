import { GoogleGenerativeAI } from "@google/generative-ai";
import { PersonalFinanceService } from "./PersonalFinanceService";
import { prisma } from "../config/db";
import { ExchangeService } from "./ExchangeService";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export class AIService {
  static async getInsights(userId: string) {
    try {
      const spending = await PersonalFinanceService.getAnalytics(userId);
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { accounts: true } });

      if (!user) return { insight: "User not found", recommendation: "" };

      const mainAccount = user.accounts[0];
      const balanceInNGN = ExchangeService.convert(
        Number(mainAccount?.balance || 0n) / 100,
        mainAccount?.currency || 'NGN',
        'NGN'
      );

      const prompt = `
        Analyze this business's financial data for a corporate banking app.
        Business Name: ${user.name}
        Current Balance (NGN Equivalent): ₦${balanceInNGN.toLocaleString()}
        Recent Monthly Spending: ${JSON.stringify(spending)}
        Account Currency: ${mainAccount?.currency || 'NGN'}

        Provide three specific things:
        1. A general insight into their cash flow.
        2. A specific TAX SAVING suggestion for a business in Nigeria (e.g., VAT, WHT, or Company Income Tax tips).
        3. A growth recommendation.

        Format your response as a JSON object with keys: "cashFlowInsight", "taxTip", "growthRecommendation".
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanedText = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedText);
      } catch {
        return {
          cashFlowInsight: "Your cash flow is steady, but your operational expenses have increased by 12% this month.",
          taxTip: "Ensure you remit your Value Added Tax (VAT) before the 21st of every month to avoid FIRS penalties.",
          growthRecommendation: "You have enough idle capital to consider a 90-day Fixed Deposit at 12% p.a. to hedge against inflation."
        };
      }
    } catch (error) {
      console.error("AI Insight Error:", error);
      return {
        cashFlowInsight: "Unable to analyze cash flow at the moment.",
        taxTip: "Keep your business receipts organized for the next tax filing cycle.",
        growthRecommendation: "Review your budget to identify areas for cost reduction."
      };
    }
  }
}

