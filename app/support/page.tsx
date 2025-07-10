'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SupportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch {
      alert('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Support Center</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            ← Back to Coach
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Get Help</h2>
            
            {submitted ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <p className="font-semibold">Message sent successfully!</p>
                <p className="text-sm">We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                  >
                    <option value="">Select a topic</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Billing Question">Billing Question</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="General Question">General Question</option>
                    <option value="Account Help">Account Help</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                    placeholder="Please describe your issue or question in detail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Help Resources */}
          <div className="space-y-6">
            {/* FAQ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    How does MyCustodyCoach work?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our AI analyzes your custody situation and provides personalized, professional responses 
                    tailored to your specific recipient (court, lawyer, or other parent) and desired tone.
                  </p>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Is my information secure?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, we use enterprise-grade security and encryption. Your personal information and 
                    case details are never shared with third parties.
                  </p>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Can I cancel my subscription anytime?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, you can cancel your subscription at any time from your Settings page. 
                    You&apos;ll retain access until the end of your current billing period.
                  </p>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    What file types can I upload?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Currently, file upload is temporarily disabled while we configure our storage system. 
                    The AI works great with text-only questions! File support will be added soon.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    How accurate are the AI responses?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our AI is trained on legal best practices and custody communication strategies. 
                    However, responses are for guidance only and should not replace professional legal advice.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Contact Information</h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-indigo-600">📧</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Email Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@mycustodycoach.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-indigo-600">⏰</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Response Time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-indigo-600">🌐</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Help Center</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Available 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Notice */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 text-red-800 dark:text-red-400">Emergency Situations</h2>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                If you or your child are in immediate danger, please contact local emergency services immediately.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Emergency:</strong> 911</p>
                <p><strong>National Domestic Violence Hotline:</strong> 1-800-799-7233</p>
                <p><strong>Childhelp National Child Abuse Hotline:</strong> 1-800-422-4453</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 