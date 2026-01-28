import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms of Service - LetLog",
  description: "Terms of Service for LetLog property management platform",
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
        <p className="text-slate-500 mb-12">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Welcome to LetLog ("we", "our", "us"). These Terms of Service ("Terms") govern your use of our property management platform 
            and services (the "Service") operated by LetLog.
          </p>
          <p>
            By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, 
            you may not access the Service.
          </p>

          <h2>2. Definitions</h2>
          <ul>
            <li><strong>"Landlord"</strong> means a user who owns or manages rental properties</li>
            <li><strong>"Tenant"</strong> means a user who rents a property managed through our Service</li>
            <li><strong>"Contractor"</strong> means a user who provides maintenance or repair services</li>
            <li><strong>"Property"</strong> means any residential or commercial property managed through the Service</li>
          </ul>

          <h2>3. Account Registration</h2>
          <p>
            To use certain features of the Service, you must register for an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Keep your password secure and confidential</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorised use of your account</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Upload false, misleading, or fraudulent information</li>
            <li>Impersonate any person or entity</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Attempt to gain unauthorised access to any part of the Service</li>
            <li>Use the Service to send spam or unsolicited communications</li>
            <li>Harvest or collect user information without consent</li>
          </ul>

          <h2>5. Landlord Responsibilities</h2>
          <p>As a Landlord using our Service, you agree to:</p>
          <ul>
            <li>Ensure all property information is accurate and up-to-date</li>
            <li>Comply with all applicable landlord and tenant laws in England and Wales</li>
            <li>Maintain valid gas safety certificates, EPCs, and EICRs as required by law</li>
            <li>Respond to tenant maintenance requests in a reasonable timeframe</li>
            <li>Protect tenant deposit in a government-approved scheme</li>
            <li>Not use the Service to discriminate against tenants</li>
          </ul>

          <h2>6. Tenant Responsibilities</h2>
          <p>As a Tenant using our Service, you agree to:</p>
          <ul>
            <li>Provide accurate information when reporting issues</li>
            <li>Allow reasonable access for repairs and inspections</li>
            <li>Use the property responsibly and report damage promptly</li>
            <li>Not misuse the Service to make false or vexatious reports</li>
          </ul>

          <h2>7. Contractor Responsibilities</h2>
          <p>As a Contractor using our Service, you agree to:</p>
          <ul>
            <li>Hold appropriate qualifications and insurance for your trade</li>
            <li>Provide accurate quotes and complete work to a professional standard</li>
            <li>Comply with all applicable health and safety regulations</li>
            <li>Not contact property owners or tenants outside of the platform for unsolicited marketing</li>
          </ul>

          <h2>8. Fees and Payment</h2>
          <p>
            Some features of the Service require a paid subscription. Subscription fees are billed in advance on a monthly basis 
            and are non-refundable except as required by law.
          </p>
          <p>
            We reserve the right to change our fees upon 30 days' notice. Continued use of the Service after a fee change 
            constitutes acceptance of the new fees.
          </p>

          <h2>9. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by LetLog and are protected by 
            international copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You retain ownership of any content you upload to the Service, but grant us a licence to use, store, and display 
            that content as necessary to provide the Service.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            LetLog is a software platform that facilitates property management. We are not a party to any agreements between 
            landlords, tenants, or contractors, and we do not guarantee the actions or conduct of any user.
          </p>
          <p>
            To the maximum extent permitted by law, LetLog shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages arising from your use of the Service.
          </p>

          <h2>11. Disclaimers</h2>
          <p>
            The Service is provided "as is" without warranties of any kind, either express or implied. We do not warrant that 
            the Service will be uninterrupted, secure, or error-free.
          </p>
          <p>
            We do not provide legal, tax, or financial advice. You should consult appropriate professionals for such matters.
          </p>

          <h2>12. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates 
            these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
          <p>
            You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will 
            immediately cease.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard 
            to its conflict of law provisions.
          </p>

          <h2>14. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting 
            the new Terms on this page and updating the "Last updated" date.
          </p>

          <h2>15. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <ul>
            <li>Email: legal@letlog.co.uk</li>
          </ul>
        </div>

        {/* Policy Links */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="text-[#E8998D] hover:text-[#C17B6E] font-medium">Privacy Policy</Link>
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
