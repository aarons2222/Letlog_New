import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy - LetLog",
  description: "Privacy Policy for LetLog property management platform",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="LetLog" width={40} height={40} className="rounded-xl shadow-lg" />
            <span className="font-semibold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-[#E8998D] to-[#F4A261] bg-clip-text text-transparent">Let</span>
              <span>Log</span>
            </span>
          </Link>
          <Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
        <p className="text-slate-500 mb-12">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none">
          <h2>1. Introduction</h2>
          <p>
            LetLog ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our property management platform.
          </p>
          <p>
            We comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>

          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>We may collect the following personal information:</p>
          <ul>
            <li><strong>Identity Data:</strong> Name, username, title</li>
            <li><strong>Contact Data:</strong> Email address, telephone number, postal address</li>
            <li><strong>Account Data:</strong> Username, password, account preferences</li>
            <li><strong>Property Data:</strong> Property addresses, tenancy details, rent amounts</li>
            <li><strong>Financial Data:</strong> Payment card details, bank account information (processed securely via Stripe)</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, login data</li>
            <li><strong>Usage Data:</strong> Information about how you use our Service</li>
          </ul>

          <h3>2.2 Special Category Data</h3>
          <p>
            We do not intentionally collect special category data (such as racial or ethnic origin, health data, etc.). 
            Please do not include such information in any documents or communications you upload to the Service.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use your personal information to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service</li>
            <li>Create and manage your account</li>
            <li>Process transactions and send related information</li>
            <li>Send you service-related communications</li>
            <li>Respond to your enquiries and provide support</li>
            <li>Send marketing communications (with your consent)</li>
            <li>Improve and personalise the Service</li>
            <li>Detect and prevent fraud and security issues</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Legal Basis for Processing</h2>
          <p>We process your personal information based on:</p>
          <ul>
            <li><strong>Contract:</strong> Processing necessary to perform our contract with you</li>
            <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate business interests</li>
            <li><strong>Consent:</strong> Where you have given consent for specific processing</li>
            <li><strong>Legal Obligation:</strong> Processing necessary to comply with the law</li>
          </ul>

          <h2>5. Data Sharing</h2>
          <p>We may share your information with:</p>
          <ul>
            <li><strong>Other Users:</strong> Landlords, tenants, and contractors as necessary to provide the Service (e.g., sharing tenant contact details with approved contractors for repairs)</li>
            <li><strong>Service Providers:</strong> Third-party companies that help us operate the Service (hosting, payment processing, email delivery)</li>
            <li><strong>Professional Advisers:</strong> Lawyers, accountants, and insurers where necessary</li>
            <li><strong>Law Enforcement:</strong> Where required by law or to protect our rights</li>
          </ul>
          <p>
            We do not sell your personal information to third parties.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide the Service. 
            We may retain certain information as required by law or for legitimate business purposes, such as:
          </p>
          <ul>
            <li>Financial records: 7 years (as required by UK law)</li>
            <li>Property and tenancy records: 6 years after tenancy ends</li>
            <li>Account information: Until you request deletion</li>
          </ul>

          <h2>7. Data Security</h2>
          <p>
            We implement appropriate technical and organisational measures to protect your personal information, including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure hosting infrastructure</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Employee training on data protection</li>
          </ul>

          <h2>8. Your Rights</h2>
          <p>Under UK GDPR, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal information</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate information</li>
            <li><strong>Erasure:</strong> Request deletion of your information ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
            <li><strong>Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent)</li>
          </ul>
          <p>
            To exercise these rights, please contact us at privacy@letlog.co.uk.
          </p>

          <h2>9. International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries outside the UK. Where this happens, we ensure 
            appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions.
          </p>

          <h2>10. Children's Privacy</h2>
          <p>
            The Service is not intended for children under 18 years of age. We do not knowingly collect personal information 
            from children under 18.
          </p>

          <h2>11. Third-Party Links</h2>
          <p>
            The Service may contain links to third-party websites. We are not responsible for the privacy practices of 
            these websites and encourage you to read their privacy policies.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the 
            new policy on this page and updating the "Last updated" date.
          </p>

          <h2>13. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
          <ul>
            <li>Email: privacy@letlog.co.uk</li>
            <li>Data Protection Officer: dpo@letlog.co.uk</li>
          </ul>

          <h2>14. Complaints</h2>
          <p>
            If you are not satisfied with how we handle your personal information, you have the right to lodge a complaint 
            with the Information Commissioner's Office (ICO):
          </p>
          <ul>
            <li>Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a></li>
            <li>Telephone: 0303 123 1113</li>
          </ul>
        </div>

        {/* Policy Links */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="text-[#E8998D] hover:text-[#C17B6E] font-medium">Terms of Service</Link>
            <Link href="/cookies" className="text-[#E8998D] hover:text-[#C17B6E] font-medium">Cookie Policy</Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-8 mt-16">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} LetLog. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
