import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  React.useEffect(() => {
    document.title = "Terms & Conditions – Instant Dental Bill";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft size={16} /> Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <FileText size={20} />
            <span className="text-sm tracking-tight">Terms & Conditions</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <article className="prose prose-blue max-w-none">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-8">Terms & Conditions</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 15, 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using Instant Dental Bill, users agree to be bound by these Terms & Conditions. Access to the platform is contingent upon acceptance of these terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              Instant Dental Bill is a SaaS application designed to assist dental clinics with professional billing, patient record management, and revenue tracking. The platform is provided as a support tool for clinic administration.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Responsibility</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Users are responsible for maintaining the confidentiality of account credentials and for all activities occurring under the account. Key responsibilities include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Providing accurate and complete information during registration.</li>
              <li>Ensuring the accuracy of all billing and patient data entered.</li>
              <li>Maintaining secure access to the account to prevent unauthorized use.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The platform must be used only for lawful purposes. Prohibited activities include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Engaging in fraudulent or illegal billing practices.</li>
              <li>Attempting to interfere with the technical operation of the platform.</li>
              <li>Reverse engineering or attempting to extract the source code of the application.</li>
              <li>Uploading or transmitting malicious code or viruses.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Service Availability and Modifications</h2>
            <p className="text-gray-600 leading-relaxed">
              While Instant Dental Bill strives for high availability, there is no guarantee of uninterrupted uptime. The platform may undergo maintenance or updates that result in temporary unavailability. Instant Dental Bill reserves the right to modify features, service levels, or pricing with reasonable notice to users.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              Instant Dental Bill is provided on an "as is" basis. The platform is not liable for any indirect, incidental, or consequential damages arising from the use or inability to use the service. Users are encouraged to maintain independent backups of critical clinic records.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Account Suspension and Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              Access to the platform may be suspended or terminated for violations of these terms, fraudulent activity, or non-payment of service fees. Users may also choose to terminate their account at any time through the provided settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms & Conditions are governed by the laws of the jurisdiction in which the platform is operated, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions regarding these Terms & Conditions, support options are available within the application.
            </p>
          </section>
        </article>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">© 2026 Instant Dental Bill. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
