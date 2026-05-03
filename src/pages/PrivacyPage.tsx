import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  React.useEffect(() => {
    document.title = "Privacy Policy – Instant Dental Bill";
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
            <ShieldCheck size={20} />
            <span className="text-sm tracking-tight">Privacy Policy</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <article className="prose prose-blue max-w-none">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-8">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 15, 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information Overview</h2>
            <p className="text-gray-600 leading-relaxed">
              Instant Dental Bill prioritizes the security and privacy of information processed through the platform. This policy describes how data is handled to provide a reliable billing and reporting experience for dental clinics.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Collection</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The application collects specific information necessary for the operation of the service:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Clinic Data:</strong> Name, address, contact details, and professional identifiers provided during setup.</li>
              <li><strong>Patient Data:</strong> Names and treatment details entered by users to generate bills and reports.</li>
              <li><strong>Login Data:</strong> Email addresses and authentication details required to secure account access.</li>
              <li><strong>System Data:</strong> Technical information related to browser type and usage patterns to ensure platform stability.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Purpose of Data Usage</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Information is processed for the following primary objectives:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Billing Operations:</strong> Generating professional invoices and receipts for patients.</li>
              <li><strong>Reporting:</strong> Providing clinics with insights into revenue and treatment trends.</li>
              <li><strong>System Improvement:</strong> Identifying technical issues and optimizing the user interface.</li>
              <li><strong>Security:</strong> Preventing unauthorized access and ensuring data isolation between different clinics.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Instant Dental Bill utilizes industry-leading cloud infrastructure, specifically Google Firebase, for data storage and management. This ensures high availability and robust security protocols.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Data is encrypted during transit and at rest. Access controls are strictly enforced to ensure that a clinic's data remains accessible only to authorized users of that specific account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing and Third Parties</h2>
            <p className="text-gray-600 leading-relaxed">
              Instant Dental Bill does not sell or trade personal or clinic information to third parties. Data is shared only with essential service providers (such as cloud hosting partners) strictly for the purpose of maintaining the platform's functionality.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Responsibility</h2>
            <p className="text-gray-600 leading-relaxed">
              Users are responsible for the accuracy and legality of the patient data entered into the platform. It is the user's duty to ensure compliance with local healthcare privacy regulations regarding the collection and storage of patient information.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Retention and Rights</h2>
            <p className="text-gray-600 leading-relaxed">
              Data is retained as long as the account remains active. Users have the right to update, correct, or request the deletion of their information at any time. Discontinuing the use of the platform and requesting account closure will initiate the data removal process in accordance with standard system procedures.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Policy Updates</h2>
            <p className="text-gray-600 leading-relaxed">
              This Privacy Policy may be updated periodically to reflect changes in the platform or legal requirements. The "Last Updated" date at the top of the page indicates the most recent revision.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For inquiries regarding data privacy or platform security, support options are available within the application.
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
