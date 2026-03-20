// src/app/(storefront)/privacy/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      body: "We collect information you provide directly, such as your name, email address, shipping address, and payment information (processed securely by Stripe, never stored by us). We also collect usage data like pages visited and products viewed.",
    },
    {
      title: "How We Use Your Information",
      body: "We use your information to process orders, send confirmation emails, improve our platform, prevent fraud, and communicate with you about your account. We never sell your personal data to third parties.",
    },
    {
      title: "Image Storage",
      body: "Product images uploaded by sellers are stored securely on Vercel Blob storage and served via our CDN. Images are associated with the seller's account and product listings.",
    },
    {
      title: "Cookies & Local Storage",
      body: "We use cookies for authentication sessions and local storage to persist your shopping cart between visits. You can clear these at any time through your browser settings.",
    },
    {
      title: "Third-Party Services",
      body: "We use Stripe for payment processing, Vercel for hosting and blob storage, MongoDB Atlas for database, and Google for OAuth authentication. Each service has its own privacy policy.",
    },
    {
      title: "Data Retention",
      body: "We retain your account data for as long as your account is active. Order history is retained for 7 years for legal and accounting purposes. You may request deletion of your account at any time.",
    },
    {
      title: "Your Rights",
      body: "You have the right to access, correct, or delete your personal data. Contact us at nickforjobacc@gmail.com to exercise these rights.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-700">Privacy Policy</span>
      </nav>

      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
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
        <p className="text-white font-semibold mb-1">Questions about your data?</p>
        <p className="text-gray-400 text-sm mb-4">We're happy to help with any privacy concerns.</p>
        <a
          href="mailto:nickforjobacc@gmail.com"
          className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          Contact Privacy Team
        </a>
      </div>

    </div>
  );
}