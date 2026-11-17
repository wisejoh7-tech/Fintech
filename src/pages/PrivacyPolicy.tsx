import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-slate-100">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-black">Privacy Policy</h2>
      </div>

      <div className="prose prose-slate max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="font-bold text-foreground italic">Last Updated: June 2026</p>

        <section className="space-y-3">
          <h3 className="text-lg font-black text-foreground">1. Introduction</h3>
          <p>Welcome to Viva Mobile. We are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and safeguard your data when you use our banking services.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-black text-foreground">2. Data We Collect</h3>
          <p>We collect personal information that you provide to us such as name, address, contact information, passwords, and security data. We also collect financial data including bank account numbers, transaction history, and KYC documents (BVN/NIN).</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-black text-foreground">3. How We Use Your Data</h3>
          <p>We use your data to provide and maintain our service, verify your identity for banking regulations, process your transactions, and notify you about changes to our service or security alerts.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-black text-foreground">4. Data Security</h3>
          <p>We implement professional-grade security measures including end-to-end encryption, biometric authentication, and multi-factor authentication to protect your sensitive financial data.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-black text-foreground">5. Contact Us</h3>
          <p>If you have questions or comments about this policy, you may contact us at: support@vivamobile.ng</p>
        </section>
      </div>
    </div>
  );
}
