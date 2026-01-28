import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Cookie Policy - LetLog",
  description: "Cookie Policy for LetLog property management platform",
};

export default function CookiesPage() {
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
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Cookie Policy</h1>
        <p className="text-slate-500 mb-12">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none">
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device when you visit a website. They are widely used to 
            make websites work more efficiently and to provide information to website owners.
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>LetLog uses cookies for the following purposes:</p>

          <h3>2.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such as 
            security, account access, and remembering your preferences. You cannot opt out of these cookies.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Cookie Name</th>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>sb-access-token</td>
                  <td>Authentication and session management</td>
                  <td>Session</td>
                </tr>
                <tr>
                  <td>sb-refresh-token</td>
                  <td>Maintains login session</td>
                  <td>7 days</td>
                </tr>
                <tr>
                  <td>cookie-consent</td>
                  <td>Stores your cookie preferences</td>
                  <td>1 year</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2.2 Functional Cookies</h3>
          <p>
            These cookies enable enhanced functionality and personalisation, such as remembering your preferences and 
            settings.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Cookie Name</th>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>theme</td>
                  <td>Remembers your display preferences</td>
                  <td>1 year</td>
                </tr>
                <tr>
                  <td>sidebar-state</td>
                  <td>Remembers sidebar collapsed/expanded state</td>
                  <td>30 days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2.3 Analytics Cookies</h3>
          <p>
            These cookies help us understand how visitors interact with our website by collecting and reporting 
            information anonymously. This helps us improve our Service.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Cookie Name</th>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>_ga</td>
                  <td>Google Analytics - distinguishes users</td>
                  <td>2 years</td>
                </tr>
                <tr>
                  <td>_gid</td>
                  <td>Google Analytics - distinguishes users</td>
                  <td>24 hours</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>3. Third-Party Cookies</h2>
          <p>
            Some cookies are placed by third-party services that appear on our pages. We use the following third-party 
            services that may set cookies:
          </p>
          <ul>
            <li><strong>Stripe:</strong> For secure payment processing</li>
            <li><strong>Google Analytics:</strong> For website analytics (if enabled)</li>
            <li><strong>Supabase:</strong> For authentication and database services</li>
          </ul>

          <h2>4. Managing Cookies</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul>
            <li>View what cookies are stored on your device</li>
            <li>Delete all or specific cookies</li>
            <li>Block cookies from being set</li>
            <li>Set your browser to notify you when cookies are being set</li>
          </ul>

          <h3>Browser-Specific Instructions</h3>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>

          <p>
            Please note that blocking or deleting cookies may impact your experience on our website and limit 
            the functionality available to you.
          </p>

          <h2>5. Cookie Consent</h2>
          <p>
            When you first visit our website, you will be shown a cookie banner asking for your consent to use 
            non-essential cookies. You can change your preferences at any time by clicking the "Cookie Settings" 
            link in the footer of our website.
          </p>

          <h2>6. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an 
            updated "Last updated" date.
          </p>

          <h2>7. Contact Us</h2>
          <p>If you have questions about our use of cookies, please contact us:</p>
          <ul>
            <li>Email: privacy@letlog.co.uk</li>
          </ul>
        </div>

        {/* Policy Links */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="text-[#E8998D] hover:text-[#C17B6E] font-medium">Terms of Service</Link>
            <Link href="/privacy" className="text-[#E8998D] hover:text-[#C17B6E] font-medium">Privacy Policy</Link>
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
