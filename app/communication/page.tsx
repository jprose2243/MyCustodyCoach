'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase-browser';

interface CommunicationEntry {
  id: string;
  user_id: string;
  entry_date: string;
  entry_time: string;
  communication_type: string;
  direction: 'incoming' | 'outgoing';
  participants: string[];
  subject: string;
  content: string;
  priority: 'routine' | 'important' | 'emergency';
  response_needed: boolean;
  response_by_date?: string;
  tags: string[];
  linked_parenting_entry?: string;
  linked_evidence?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

interface CommunicationStats {
  total_communications: number;
  pending_responses: number;
  average_response_time: number;
  this_month_count: number;
  communication_types: { [key: string]: number };
}

const COMMUNICATION_TYPES = [
  { value: 'text', label: '📱 Text Message', color: 'bg-blue-100 text-blue-800' },
  { value: 'email', label: '📧 Email', color: 'bg-green-100 text-green-800' },
  { value: 'phone', label: '📞 Phone Call', color: 'bg-purple-100 text-purple-800' },
  { value: 'in_person', label: '👥 In Person', color: 'bg-orange-100 text-orange-800' },
  { value: 'lawyer', label: '⚖️ Lawyer Communication', color: 'bg-gray-100 text-gray-800' },
  { value: 'school', label: '🏫 School Communication', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'medical', label: '🏥 Medical Communication', color: 'bg-red-100 text-red-800' },
  { value: 'court', label: '🏛️ Court Communication', color: 'bg-indigo-100 text-indigo-800' }
];

const PRIORITY_LEVELS = [
  { value: 'routine', label: 'Routine', color: 'bg-gray-100 text-gray-800' },
  { value: 'important', label: 'Important', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' }
];

export default function CommunicationLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<CommunicationEntry[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CommunicationEntry | null>(null);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Form state for adding entries
  const [newEntry, setNewEntry] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    entry_time: new Date().toTimeString().slice(0, 5),
    communication_type: 'text',
    direction: 'incoming' as 'incoming' | 'outgoing',
    participants: [''],
    subject: '',
    content: '',
    priority: 'routine' as 'routine' | 'important' | 'emergency',
    response_needed: false,
    response_by_date: '',
    tags: [''],
    attachments: []
  });

  useEffect(() => {
    const initializePage = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.error('❌ No Supabase session:', sessionError);
        router.push('/login');
        return;
      }

      setUserId(session.user.id);

      // Get user profile for personalization and subscription status
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, subscription_status')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || '');
        setIsSubscribed(profile.subscription_status || false);
      }

      // For now, we'll use mock data until we set up the database
      setEntries([]);
      setStats({
        total_communications: 0,
        pending_responses: 0,
        average_response_time: 0,
        this_month_count: 0,
        communication_types: {}
      });

      setLoading(false);
    };

    initializePage();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCommunicationType = (type: string) => {
    return COMMUNICATION_TYPES.find(t => t.value === type) || COMMUNICATION_TYPES[0];
  };

  const getPriorityLevel = (priority: string) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[0];
  };

  const resetForm = () => {
    setNewEntry({
      entry_date: new Date().toISOString().split('T')[0],
      entry_time: new Date().toTimeString().slice(0, 5),
      communication_type: 'text',
      direction: 'incoming',
      participants: [''],
      subject: '',
      content: '',
      priority: 'routine',
      response_needed: false,
      response_by_date: '',
      tags: [''],
      attachments: []
    });
  };

  const addParticipant = () => {
    setNewEntry(prev => ({
      ...prev,
      participants: [...prev.participants, '']
    }));
  };

  const updateParticipant = (index: number, value: string) => {
    setNewEntry(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => i === index ? value : p)
    }));
  };

  const removeParticipant = (index: number) => {
    setNewEntry(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    setNewEntry(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
  };

  const updateTag = (index: number, value: string) => {
    setNewEntry(prev => ({
      ...prev,
      tags: prev.tags.map((t, i) => i === index ? value : t)
    }));
  };

  const removeTag = (index: number) => {
    setNewEntry(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-semibold mb-2">Loading Communication Log...</h2>
          <p className="text-gray-500">Setting up your communication tracking system</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {firstName ? `${firstName}'s Communication Log` : 'Communication Log'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track all communications, messages, and interactions for custody documentation
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {isSubscribed ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                ➕ Add Communication
              </button>
            ) : (
              <button
                onClick={() => router.push('/payment')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition"
              >
                🔓 Upgrade to Track Communications
              </button>
            )}
            <button
              onClick={() => router.push('/upload')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
            >
              ← Back to Coach
            </button>
          </div>
        </div>

        {/* Trial User Upgrade Prompt */}
        {!isSubscribed && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl mb-2">💬 Communication Tracking Premium Feature</h3>
                <p className="text-blue-100 mb-4">
                  You're viewing the Communication Log interface. Upgrade to Premium to:
                </p>
                <ul className="text-blue-100 text-sm space-y-1">
                  <li>• Log unlimited communications and messages</li>
                  <li>• Track response times and communication patterns</li>
                  <li>• Generate court-ready communication reports</li>
                  <li>• Link communications to parenting time and evidence</li>
                  <li>• AI-powered communication analysis and suggestions</li>
                  <li>• Auto-save AI-generated messages to your log</li>
                </ul>
              </div>
              <div className="text-center ml-6">
                <div className="text-4xl mb-2">💬</div>
                <button
                  onClick={() => router.push('/payment')}
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600">{stats.total_communications}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Communications</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-amber-600">{stats.pending_responses}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending Responses</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">{stats.average_response_time}h</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600">{stats.this_month_count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search communications..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                {COMMUNICATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Direction
              </label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
              >
                <option value="all">All</option>
                <option value="incoming">📥 Incoming</option>
                <option value="outgoing">📤 Outgoing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Communication Timeline</h2>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No communications logged yet
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Start building your communication record by logging your first interaction.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                  disabled={!isSubscribed}
                >
                  {isSubscribed ? 'Add Your First Communication' : 'Upgrade to Start Logging'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Communication entries will be displayed here */}
                <p className="text-gray-500 text-center py-8">
                  Communication entries will appear here once you start logging them.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add Communication Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Add Communication Entry
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Form */}
                <div className="space-y-6">
                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        value={newEntry.entry_date}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, entry_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        value={newEntry.entry_time}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, entry_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Communication Type and Direction */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Communication Type *
                      </label>
                      <select
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        value={newEntry.communication_type}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, communication_type: e.target.value }))}
                      >
                        {COMMUNICATION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Direction *
                      </label>
                      <select
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        value={newEntry.direction}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, direction: e.target.value as 'incoming' | 'outgoing' }))}
                      >
                        <option value="incoming">📥 Incoming (Received)</option>
                        <option value="outgoing">📤 Outgoing (Sent)</option>
                      </select>
                    </div>
                  </div>

                  {/* Participants */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Participants *
                    </label>
                    {newEntry.participants.map((participant, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Name or relationship (e.g., Other Parent, Lawyer, School)"
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                          value={participant}
                          onChange={(e) => updateParticipant(index, e.target.value)}
                        />
                        {newEntry.participants.length > 1 && (
                          <button
                            onClick={() => removeParticipant(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addParticipant}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Participant
                    </button>
                  </div>

                  {/* Subject and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject/Topic *
                      </label>
                      <input
                        type="text"
                        placeholder="Brief description of the communication topic"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        value={newEntry.subject}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority *
                      </label>
                      <select
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                        value={newEntry.priority}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, priority: e.target.value as 'routine' | 'important' | 'emergency' }))}
                      >
                        {PRIORITY_LEVELS.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message Content *
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Copy and paste the full message content here..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                      value={newEntry.content}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                    />
                  </div>

                  {/* Response Tracking */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="response_needed"
                        className="mr-2 rounded focus:ring-blue-500"
                        checked={newEntry.response_needed}
                        onChange={(e) => setNewEntry(prev => ({ ...prev, response_needed: e.target.checked }))}
                      />
                      <label htmlFor="response_needed" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Response needed
                      </label>
                    </div>
                    {newEntry.response_needed && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Response needed by
                        </label>
                        <input
                          type="date"
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                          value={newEntry.response_by_date}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, response_by_date: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (for organization)
                    </label>
                    {newEntry.tags.map((tag, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="e.g., pickup-time, medical, school, emergency"
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                          value={tag}
                          onChange={(e) => updateTag(index, e.target.value)}
                        />
                        {newEntry.tags.length > 1 && (
                          <button
                            onClick={() => removeTag(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addTag}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add Tag
                    </button>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Add handleAddEntry function
                        console.log('Adding communication entry:', newEntry);
                        setShowAddModal(false);
                        resetForm();
                      }}
                      disabled={!newEntry.entry_date || !newEntry.subject || !newEntry.content || !newEntry.participants[0]}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        !newEntry.entry_date || !newEntry.subject || !newEntry.content || !newEntry.participants[0]
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Save Communication
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 