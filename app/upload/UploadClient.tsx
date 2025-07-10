'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase-browser';

interface ErrorWithMessage {
  message: string;
}

function UpgradeModal({ onSubscribe, loading }: { onSubscribe: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 rounded-xl shadow p-8 max-w-md w-full text-center border border-indigo-700">
        <h1 className="text-2xl font-bold mb-4 text-indigo-400">Upgrade to Unlimited Access</h1>
        <p className="mb-6 text-gray-200">
          You've used your 3 free questions. Unlock full access to MyCustodyCoach for just{' '}
          <strong>$20/month</strong>.
        </p>
        <button
          onClick={onSubscribe}
          disabled={loading}
          className={`w-full py-2 px-6 rounded-lg font-semibold transition text-white ${
            loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Starting checkout...' : 'Subscribe Now'}
        </button>
      </div>
    </div>
  );
}

export default function UploadClient() {
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [courtState, setCourtState] = useState('');
  const [childAge, setChildAge] = useState('');
  const [goalPriority, setGoalPriority] = useState('');
  const [parentRole, setParentRole] = useState('');
  const [prompt, setPrompt] = useState('');
  const [recipient, setRecipient] = useState('court');
  const [tone, setTone] = useState('formal');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Recipient-based tone options
  const toneOptions = {
    court: [
      { value: 'formal', label: 'Formal', desc: 'Professional and respectful for court documents' },
      { value: 'respectful', label: 'Respectful', desc: 'Courteous and deferential to the court' },
      { value: 'direct', label: 'Direct', desc: 'Clear and to-the-point for legal clarity' },
      { value: 'neutral', label: 'Neutral', desc: 'Objective and factual presentation' },
      { value: 'assertive', label: 'Assertive', desc: 'Confident while remaining appropriate' },
    ],
    lawyer: [
      { value: 'professional', label: 'Professional', desc: 'Business-like communication' },
      { value: 'collaborative', label: 'Collaborative', desc: 'Working together approach' },
      { value: 'direct', label: 'Direct', desc: 'Clear and efficient communication' },
      { value: 'formal', label: 'Formal', desc: 'Traditional legal communication style' },
      { value: 'urgent', label: 'Urgent', desc: 'Time-sensitive matters' },
    ],
    parent: [
      { value: 'calm', label: 'Calm', desc: 'De-escalating and peaceful' },
      { value: 'cooperative', label: 'Cooperative', desc: 'Willing to work together' },
      { value: 'firm', label: 'Firm', desc: 'Setting clear boundaries' },
      { value: 'empathetic', label: 'Empathetic', desc: 'Understanding and compassionate' },
      { value: 'neutral', label: 'Neutral', desc: 'Factual and unemotional' },
      { value: 'conciliatory', label: 'Conciliatory', desc: 'Seeking to resolve conflict' },
      { value: 'protective', label: 'Protective', desc: 'Prioritizing child\'s wellbeing' },
    ],
    universal: [
      { value: 'professional', label: 'Professional', desc: 'Business-like and appropriate for any recipient' },
      { value: 'neutral', label: 'Neutral', desc: 'Objective and factual for general use' },
      { value: 'clear', label: 'Clear', desc: 'Easy to understand and direct' },
      { value: 'respectful', label: 'Respectful', desc: 'Courteous and considerate' },
      { value: 'balanced', label: 'Balanced', desc: 'Measured and thoughtful approach' },
      { value: 'informative', label: 'Informative', desc: 'Educational and explanatory' },
    ]
  };

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        console.error('❌ No Supabase session:', sessionError);
        setError('You are not logged in.');
        return;
      }

      const id = session.user.id;
      setUserId(id);
      setEmail(session.user.email || '');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('first_name, court_state, child_age, goal_priority, parent_role, questions_used, subscription_status')
        .eq('id', id)
        .single();

      if (profileError) {
        console.error('❌ Failed to load profile:', profileError.message);
        return;
      }

      if (profile) {
        setFirstName(profile.first_name || '');
        setCourtState(profile.court_state || '');
        setChildAge(profile.child_age || '');
        setGoalPriority(profile.goal_priority || '');
        setParentRole(profile.parent_role || '');
        setQuestionsUsed(profile.questions_used || 0);
        setIsSubscribed(profile.subscription_status || false);
      }
    };

    fetchSessionAndProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow file upload for subscribed users
    if (!isSubscribed) {
      setError('File upload is a premium feature. Please upgrade to upload files for AI analysis.');
      return;
    }

    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(''); // Clear any previous errors
    }
  };

  const handleDeleteFile = () => {
    setFile(null);
    setFileName('');
    // Clear the file input
    const fileInput = document.getElementById('contextFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubscribe = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });
      if (!res.ok) {
        setUpgradeLoading(false);
        alert('Something went wrong. Please try again.');
        return;
      }
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setUpgradeLoading(false);
        alert('No checkout URL returned.');
      }
    } catch (err) {
      setUpgradeLoading(false);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setResponse('');
    setLoading(true);

    try {
      if (!userId) throw new Error('❌ You must be logged in to submit a question.');
      if (!prompt.trim()) throw new Error('❌ Please enter a question.');

      // Check if user has reached free limit and redirect to payment page
      if (!isSubscribed && questionsUsed >= 3) {
        console.log('🔄 Redirecting to payment page - free limit reached');
        router.push('/payment');
        return;
      }

      // Handle file upload for subscribed users
      let fileUrl = '';
      if (file && isSubscribed) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('userId', userId);

          const uploadRes = await fetch('/api/upload-to-supabase', {
            method: 'POST',
            body: uploadFormData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            fileUrl = uploadData.fileUrl;
          } else {
            console.warn('File upload failed, proceeding with text-only question');
          }
        } catch (uploadError) {
          console.warn('File upload error, proceeding with text-only question:', uploadError);
        }
      }

      const formData = new FormData();
      formData.append('question', prompt.trim());
      formData.append('tone', tone);
      formData.append('recipient', recipient);
      formData.append('fileUrl', fileUrl);
      formData.append('userId', userId);

      const res = await fetch('/api/generate-response', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data?.error && data.error.toLowerCase().includes('free question limit')) {
        console.log('🔄 Redirecting to payment page - API limit reached');
        router.push('/payment');
        return;
      }
      if (!res.ok || !data.result || typeof data.result !== 'string' || data.result.trim().length < 10) {
        throw new Error(data.error || 'No meaningful response received. Try rephrasing your question.');
      }

      const finalResult = data.result.trim();
      setResponse(finalResult);

      // Update local state
      if (!isSubscribed) {
        setQuestionsUsed(prev => prev + 1);
      }

      // ✅ Save log to Supabase sessions
      const { error: insertError } = await supabase.from('sessions').insert({
        user_id: userId,
        prompt: prompt.trim(),
        tone,
        file_url: null,
        result: finalResult,
      });

      if (insertError) {
        console.error('⚠️ Failed to log session:', insertError.message);
      } else {
        console.log('📊 Response logged to Supabase.');
      }
    } catch (err: unknown) {
      let message = 'Unexpected error occurred.';
      if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as ErrorWithMessage).message === 'string') {
        message = (err as ErrorWithMessage).message;
      } else if (typeof err === 'string') {
        message = err;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const currentTones = toneOptions[recipient as keyof typeof toneOptions] || toneOptions.court;
  const remainingQuestions = isSubscribed ? '∞' : Math.max(0, 3 - questionsUsed);

  // Organized example prompts by category with collapsible sections
  const exampleCategories = {
    'parenting_data': {
      title: '📊 Parenting Time & Data Integration',
      subtitle: isSubscribed ? '✨ Using Your Personal Data' : '🔒 Premium Feature - Upgrade Required',
      prompts: isSubscribed ? [
        `📊 How much parenting time did I have this month? Summarize my visit statistics.`,
        `📅 Create a court-ready summary of my successful visits vs missed visits this year.`,
        `🌙 What's my overnight visit pattern? How does it support my ${goalPriority} goal?`,
      ] : [
        `🔒 Upload your calendar data to get personalized parenting time analysis`,
        `🔒 Get court-ready summaries of your actual visit history with file uploads`,
        `🔒 Analyze your parenting patterns with data integration (Premium)`,
      ]
    },
    'custody_support': {
      title: '⚖️ Traditional Custody Support',
      subtitle: 'Court preparation and legal guidance',
      prompts: [
        `⚖️ Help me prepare for a hearing in ${courtState} as a ${parentRole} of a ${childAge}-year-old.`,
        `🛡️ How can I respond to gatekeeping behavior and still pursue ${goalPriority}?`,
        `💬 Write a ${tone} reply to an accusatory message about my parenting time.`,
      ]
    },
    'family_scenarios': {
      title: '👶👧 Multiple Children & Family',
      subtitle: 'Complex family situations and scheduling',
      prompts: [
        `👶👧 I have multiple children - how do I address different custody schedules in court?`,
        `🏠 The other parent wants to relocate with our children. What are my options?`,
        `🎒 How do I document when the other parent returns the children in poor condition?`,
      ]
    },
    'evidence_docs': {
      title: '📋 Evidence & Documentation',
      subtitle: 'Organizing and presenting your case',
      prompts: [
        `📋 I've organized evidence in my Evidence Organizer - how do I present it to my lawyer?`,
        `📱 The other parent sends harassing texts. How should I document this for court?`,
        `⚠️ How do I write an incident report for my evidence collection?`,
      ]
    },
    'court_communications': {
      title: '📑 Court Communications',
      subtitle: 'Professional legal correspondence',
      prompts: [
        `📑 Draft a motion requesting makeup time for missed visits in ${courtState}.`,
        `🤝 Write a professional email to the guardian ad litem about my concerns.`,
        `📧 Help me respond to my lawyer's request for documentation updates.`,
      ]
    },
    'crisis_emergency': {
      title: '🚨 Crisis & Emergency',
      subtitle: 'Urgent situations and violations',
      prompts: [
        `🚨 The other parent didn't return the children as scheduled. What steps do I take?`,
        `🏥 My child was injured during the other parent's time. How do I document this?`,
        `📞 How do I report a custody violation to the court in ${courtState}?`,
      ]
    }
  };

  // State for tracking which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const handleDownloadResponse = () => {
    if (!response) return;
    
    const content = `MyCustodyCoach Response
===============================

Date: ${new Date().toLocaleDateString()}
Recipient: ${recipient.charAt(0).toUpperCase() + recipient.slice(1)}
Tone: ${tone.charAt(0).toUpperCase() + tone.slice(1)}
Question: ${prompt}

Response:
---------
${response}

Generated by MyCustodyCoach
https://mycustodycoach.com
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MCC-Response-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-6 py-10 font-sans">
        {/* Centered Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">MyCustodyCoach</h1>
        </div>

        {/* Navigation and User Info */}
        {firstName && (
          <nav className="space-y-4">
            {/* Navigation Buttons */}
            <div className="flex justify-center items-center space-x-3">
              <button
                onClick={() => router.push('/evidence')}
                className="px-3 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold text-sm transition"
                title="Organize your evidence"
              >
                📂 Evidence
              </button>
              <button
                onClick={() => router.push('/parenting-time')}
                className="px-3 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold text-sm transition"
                title="Track parenting time and visits"
              >
                📅 Parenting Time
              </button>
              <button
                onClick={() => router.push('/support')}
                className="px-3 py-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-sm transition"
                title="Get support"
              >
                💬 Support
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition"
                title="Account settings"
              >
                ⚙️ Settings
              </button>
            </div>
            
            {/* User Info */}
            <div className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
              <span>{firstName} ({courtState})</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-xs"
              >
                Sign Out
              </button>
            </div>
          </nav>
        )}

        {/* Usage Tracking Banner */}
        {!isSubscribed && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Free Trial</h3>
                <p className="text-indigo-100">
                  {remainingQuestions === 0 
                    ? 'Trial complete! Upgrade for unlimited access.' 
                    : `${remainingQuestions} free questions remaining`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{questionsUsed}/3</div>
                <button
                  onClick={() => router.push('/payment')}
                  className="mt-1 px-4 py-1 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {isSubscribed && (
          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-xl">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="font-semibold">Premium Member</span>
              <span className="ml-2">• Unlimited questions</span>
            </div>
          </div>
        )}

        {/* Main Content Grid: Form + Examples Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {/* Main Form - Takes up 2/3 on large screens */}
          <section className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 space-y-6 ring-1 ring-gray-200 dark:ring-gray-700">
            <div>
              <label htmlFor="prompt" className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
                Custody Question
              </label>
              <textarea
                id="prompt"
                rows={5}
                placeholder="Paste your custody question here..."
                className="w-full p-4 text-lg leading-relaxed bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* Recipient Selection */}
            <div>
              <label htmlFor="recipient" className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
                Who is this message for?
              </label>
              <select
                id="recipient"
                className="w-full p-3 text-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  // Reset tone when recipient changes
                  const newTones = toneOptions[e.target.value as keyof typeof toneOptions];
                  setTone(newTones[0].value);
                }}
              >
                <option value="court">📋 Court/Judge</option>
                <option value="lawyer">⚖️ Lawyer/Attorney</option>
                <option value="parent">👨‍👩‍👧‍👦 Other Parent</option>
                <option value="universal">🌐 Universal/General</option>
              </select>
            </div>

            {/* Tone Selection */}
            <div>
              <label htmlFor="tone" className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
                Tone & Style
              </label>
              <select
                id="tone"
                className="w-full p-3 text-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {currentTones.map((toneOption) => (
                  <option key={toneOption.value} value={toneOption.value}>
                    {toneOption.label} - {toneOption.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="contextFile" className="block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">
                Upload File (PDF, DOCX, TXT, or Image)
              </label>
              <div className="relative">
                <input
                  id="contextFile"
                  type="file"
                  accept=".pdf,.docx,.txt,image/*"
                  onChange={handleFileChange}
                  disabled={!isSubscribed}
                  className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gray-200 file:text-gray-500 ${
                    isSubscribed 
                      ? 'text-gray-700 dark:text-gray-300 cursor-pointer hover:file:bg-gray-300' 
                      : 'text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                />
              </div>
              {fileName && (
                <div className="mt-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="mr-2">📁</span>
                    <span>{fileName}</span>
                  </div>
                  <button
                    onClick={handleDeleteFile}
                    className="text-red-500 hover:text-red-700 font-bold text-lg px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              )}
              {!isSubscribed && (
                <div className="mt-2 text-xs text-red-500 dark:text-red-400">
                  File upload is a premium feature. Please upgrade to upload files for AI analysis.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!isSubscribed && questionsUsed >= 3) || !prompt.trim()}
              className={`w-full py-3 px-6 text-lg font-semibold rounded-xl transition-all duration-200 ${
                loading ? 'bg-indigo-300 cursor-not-allowed' : 
                (!isSubscribed && questionsUsed >= 3) ? 'bg-gray-400 cursor-not-allowed' :
                !prompt.trim() ? 'bg-gray-400 cursor-not-allowed' :
                'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {loading ? 'Generating...' : 
               (!isSubscribed && questionsUsed >= 3) ? 'Upgrade to Continue' :
               !prompt.trim() ? 'Enter a Question' :
               'Generate Response'}
            </button>

            {error && (
              <p className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-md px-4 py-2 text-sm mt-2">
                {error}
              </p>
            )}
          </section>

          {/* Compact Example Prompts - Takes up 1/3 on large screens - Full Height */}
          <section className="lg:col-span-1 bg-indigo-50 dark:bg-gray-800 rounded-xl shadow-inner flex flex-col">
            <div className="p-4 flex-shrink-0">
              <h3 className="font-semibold text-sm text-indigo-700 dark:text-indigo-300 mb-2 flex items-center">
                🚀 Quick Examples
                {isSubscribed && (
                  <div className="relative ml-1 group">
                    <div className="text-green-600 dark:text-green-400 cursor-help">
                      🛡️
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
                      <div className="font-semibold text-green-400 mb-1">🔒 Privacy First</div>
                      <div className="text-xs leading-relaxed">
                        Your personal data is encrypted, user-isolated, and never shared with third parties.
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {isSubscribed 
                  ? "✨ Click any example to start"
                  : "💡 Upgrade for data integration"
                }
              </p>
            </div>
              
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {Object.entries(exampleCategories).map(([key, category]) => (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(key)}
                    className="w-full text-left text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-between p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition border border-indigo-200 dark:border-indigo-800"
                  >
                    <div>
                      <div className="text-xs">{category.title}</div>
                    </div>
                    <span className="text-sm">{expandedCategories[key] ? '▲' : '▼'}</span>
                  </button>
                  {expandedCategories[key] && (
                    <div className="mt-1 pl-2 space-y-1">
                      {category.prompts.map((p, i) => (
                        <div 
                          key={i} 
                          className="text-xs text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition leading-tight" 
                          onClick={() => setPrompt(p)}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {response && (
          <section className="bg-green-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                MyCustodyCoach Response
              </h2>
              <button
                onClick={handleDownloadResponse}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition"
                title="Download response as text file"
              >
                📄 Download
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Recipient:</strong> {recipient.charAt(0).toUpperCase() + recipient.slice(1)}</p>
              <p><strong>Tone:</strong> {tone.charAt(0).toUpperCase() + tone.slice(1)}</p>
              <p><strong>Question:</strong> {prompt.slice(0, 100)}...</p>
            </div>
            <hr className="border-t border-gray-300 dark:border-gray-600" />
            <div className="whitespace-pre-wrap text-base leading-relaxed">{response}</div>
          </section>
        )}
        {showUpgrade && <UpgradeModal onSubscribe={handleSubscribe} loading={upgradeLoading} />}
      </div>
    </main>
  );
}