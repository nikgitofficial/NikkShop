// src/app/(storefront)/terms/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      body: "By accessing and using NikkShop, you accept and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our platform.",
    },
    {
      title: "2. User Accounts",
      body: "You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to create an account and make purchases on NikkShop.",
    },
    {
      title: "3. Seller Responsibilities",
      body: "Sellers are responsible for accurate product descriptions, timely fulfillment, and compliance with all applicable laws. NikkShop reserves the right to remove listings that violate our policies.",
    },
    {
      title: "4. Payments",
      body: "All payments are processed securely via Stripe. NikkShop does not store your credit card information. Sellers receive payouts after order confirmation, minus applicable platform fees.",
    },
    {
      title: "5. Returns & Refunds",
      body: "Buyers may request a refund within 30 days of delivery for items that are significantly not as described. Refund decisions are made on a case-by-case basis.",
    },
    {
      title: "6. Prohibited Items",
      body: "Users may not list or purchase illegal items, counterfeit goods, hazardous materials, or any items that violate applicable laws or NikkShop policies.",
    },
    {
      title: "7. Limitation of Liability",
      body: "NikkShop is a marketplace platform and is not responsible for the quality, safety, or legality of items listed by sellers. We facilitate transactions but are not a party to them.",
    },
    {
      title: "8. Contact",
      body: "For questions about these terms, contact us at nickforjobacc@gmail.com",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-700">Terms of Service</span>
      </nav>

      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-gray-400 text-sm mb-12">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map(({ title, body }) => (
          <section key={title} className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
          </section>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-10 bg-gray-900 rounded-2xl p-6 text-center">
        <p className="text-white font-semibold mb-1">Questions about our terms?</p>
        <p className="text-gray-400 text-sm mb-4">Our support team is happy to help.</p>
        <a
          href="mailto:nickforjobacc@gmail.com"
          className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          Contact Support
        </a>
      </div>

    </div>
  );
}