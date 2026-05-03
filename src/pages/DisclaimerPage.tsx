import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DisclaimerPage() {
  React.useEffect(() => {
    document.title = "Disclaimer – Instant Dental Bill";
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
            <AlertCircle size={20} />
            <span className="text-sm tracking-tight">Disclaimer</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <article className="prose prose-blue max-w-none">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-8">Disclaimer</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 15, 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. General Information</h2>
            <p className="text-gray-600 leading-relaxed">
              Instant Dental Bill is designed to be a helpful companion for dental clinics in managing their daily billing and reporting needs. The information provided through the platform is for general administrative support and is intended to simplify clinic workflows.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Professional Support Tool</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The application serves as a digital assistant for organizing billing data. It is important to note that the platform does not provide medical, dental, legal, or accounting advice.
            </p>
            <p className="text-gray-600 leading-relaxed">
              While the platform aims to provide accurate calculations and professional templates, it is always recommended that clinic owners and professionals review all generated documents to ensure they meet specific local requirements and professional standards. The platform is a support tool and does not replace the expert judgment of qualified professionals.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Accuracy</h2>
            <p className="text-gray-600 leading-relaxed">
              The quality of the bills and reports generated depends on the information entered by the user. Users are encouraged to verify patient details, treatment costs, and tax calculations before finalizing any document. Instant Dental Bill is committed to providing a stable environment, but users should maintain their own primary records for critical clinical and financial data.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. External Resources</h2>
            <p className="text-gray-600 leading-relaxed">
              Occasionally, the platform may provide links to external resources or third-party services for the user's convenience. These resources are independent of Instant Dental Bill, and their content or availability is managed by their respective providers.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Platform Experience</h2>
            <p className="text-gray-600 leading-relaxed">
              Efforts are continuously made to ensure the platform is fast, reliable, and secure. However, the service is provided on an "as is" basis to allow for ongoing improvements and updates. The goal is to provide a premium experience that clinics can rely on for their administrative needs.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For any feedback or assistance regarding the platform's features, support options are available within the application.
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
