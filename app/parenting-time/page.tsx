'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase-browser';
import CalendarSyncService from '@/src/services/calendarSyncService';

interface ParentingEntry {
  id: string;
  visit_date: string;
  start_time: string | null;
  end_time: string | null;
  child_name: string | null;
  location: string | null;
  notes: string | null;
  is_overnight: boolean;
  other_parent_present: boolean;
  entry_type: string;
  color: string;
  icon: string;
  type_description: string;
}

interface ParentingStats {
  total_entries: number;
  past_visits: number;
  upcoming_visits: number;
  successful_visits: number;
  missed_visits: number;
  makeup_visits: number;
  overnight_visits: number;
}

interface EntryType {
  name: string;
  color: string;
  icon: string;
  description: string;
}

export default function ParentingTimePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<ParentingEntry[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [stats, setStats] = useState<ParentingStats | null>(null);
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAddModal, setShowAddModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDate, setSelectedDate] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedEntry, setSelectedEntry] = useState<ParentingEntry | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [syncStatus, setSyncStatus] = useState<string>('');
  const calendarService = CalendarSyncService.getInstance();

  // Form state for adding entries
  const [newEntry, setNewEntry] = useState({
    entry_type: 'scheduled_visit',
    visit_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_multiple_days: false,
    is_multiple_children: false,
    start_time: '',
    end_time: '',
    child_name: '',
    location: '',
    notes: '',
    is_overnight: false,
    other_parent_present: false,
    pickup_person: '',
    dropoff_person: ''
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

      await Promise.all([
        loadEntryTypes(),
        loadEntries(session.user.id),
        loadStats(session.user.id)
      ]);

      setLoading(false);
    };

    initializePage();
  }, [router]);

  // Calculate past and upcoming visits from current entries
  const updateVisitCounts = useCallback(() => {
    if (!stats || entries.length === 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const pastVisits = entries.filter(entry => entry.visit_date < today).length;
    const upcomingVisits = entries.filter(entry => entry.visit_date >= today).length;

    setStats(prevStats => ({
      ...prevStats!,
      past_visits: pastVisits,
      upcoming_visits: upcomingVisits
    }));
  }, [stats, entries, setStats]);

  // Update visit counts when entries change
  useEffect(() => {
    if (entries.length > 0 && stats) {
      updateVisitCounts();
    }
  }, [entries, stats, updateVisitCounts]);

  const loadEntryTypes = async () => {
    const { data, error } = await supabase
      .from('parenting_entry_types')
      .select('name, color, icon, description')
      .order('id');

    if (error) {
      console.error('❌ Failed to load entry types:', error);
      return;
    }

    setEntryTypes(data || []);
  };

  const loadEntries = async (userId: string) => {
    const { data, error } = await supabase
      .from('parenting_calendar_view')
      .select('*')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });

    if (error) {
      console.error('❌ Failed to load entries:', error);
      setError('Failed to load parenting time entries.');
      return;
    }

    setEntries(data || []);
  };

  const loadStats = async (userId: string) => {
    const { data, error } = await supabase
      .from('parenting_stats_view')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('❌ Failed to load stats:', error);
      return;
    }

    setStats(data || {
      total_entries: 0,
      past_visits: 0,
      upcoming_visits: 0,
      successful_visits: 0,
      missed_visits: 0,
      makeup_visits: 0,
      overnight_visits: 0
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddEntry = async () => {
    if (!newEntry.visit_date || !newEntry.entry_type) {
      setError('Please fill in required fields');
      return;
    }

    // Validation for multi-day entries
    if (newEntry.is_multiple_days) {
      if (!newEntry.end_date) {
        setError('End date is required for multi-day visits');
        return;
      }
      if (new Date(newEntry.end_date) <= new Date(newEntry.visit_date)) {
        setError('End date must be after start date');
        return;
      }
    }

    // Prepare the entry data
    const entryData = {
      user_id: userId,
      entry_type: newEntry.entry_type,
      visit_date: newEntry.visit_date,
      start_time: newEntry.start_time || null,
      end_time: newEntry.end_time || null,
      child_name: newEntry.child_name || null,
      location: newEntry.location || null,
      notes: newEntry.is_multiple_days && newEntry.end_date 
        ? `${newEntry.notes ? newEntry.notes + '\n\n' : ''}Multi-day visit: ${formatDate(newEntry.visit_date)} to ${formatDate(newEntry.end_date)} (${calculateDuration(newEntry.visit_date, newEntry.end_date)})`
        : newEntry.notes || null,
      is_overnight: newEntry.is_overnight,
      other_parent_present: newEntry.other_parent_present,
      pickup_person: newEntry.pickup_person || null,
      dropoff_person: newEntry.dropoff_person || null
    };

    const { error } = await supabase
      .from('parenting_time_entries')
      .insert(entryData);

    if (error) {
      console.error('❌ Failed to add entry:', error);
      setError('Failed to add entry');
      return;
    }

    // Reset form and reload data
    resetForm();
    setShowAddModal(false);
    await Promise.all([
      loadEntries(userId),
      loadStats(userId)
    ]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) return 'Invalid date range';
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays - 1;
    
    if (diffDays === 1) {
      return '1 day (same day visit)';
    } else {
      return `${diffDays} days, ${nights} night${nights === 1 ? '' : 's'}`;
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date, currentMonth: Date) => {
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  };

  // const getEntriesForDate = (date: Date) => {
  //   const dateKey = formatDateKey(date);
  //   return entries.filter(entry => entry.visit_date === dateKey);
  // };

  // Parse multi-day visit information from notes
  const parseMultiDayVisit = (entry: ParentingEntry) => {
    if (!entry.notes) return null;
    
    const multiDayMatch = entry.notes.match(/Multi-day visit: (.+?) to (.+?) \((.+?)\)/);
    if (!multiDayMatch) return null;
    
    const startDateStr = multiDayMatch[1];
    const endDateStr = multiDayMatch[2];
    
    // Parse the date strings - they're in format like "Wed, Jul 9, 2025"
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
    
    return {
      startDate,
      endDate,
      duration: multiDayMatch[3]
    };
  };

  // Check if a date is within a multi-day visit range
  const isDateInMultiDayVisit = (date: Date, entry: ParentingEntry) => {
    const multiDayInfo = parseMultiDayVisit(entry);
    if (!multiDayInfo) return false;
    
    const dateTime = date.getTime();
    const startTime = multiDayInfo.startDate.getTime();
    const endTime = multiDayInfo.endDate.getTime();
    
    return dateTime >= startTime && dateTime <= endTime;
  };

  // Get all entries that span to this date (including multi-day visits)
  const getAllEntriesForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    const directEntries = entries.filter(entry => entry.visit_date === dateKey);
    
    // Also check for multi-day visits that span to this date
    const spanningEntries = entries.filter(entry => {
      if (entry.visit_date === dateKey) return false; // Already included
      return isDateInMultiDayVisit(date, entry);
    });
    
    return [...directEntries, ...spanningEntries];
  };

  // Determine the position of a date within a multi-day visit
  const getMultiDayPosition = (date: Date, entry: ParentingEntry) => {
    const multiDayInfo = parseMultiDayVisit(entry);
    if (!multiDayInfo) return null;
    
    const daysDiff = Math.floor((date.getTime() - multiDayInfo.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((multiDayInfo.endDate.getTime() - multiDayInfo.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      position: daysDiff,
      total: totalDays,
      isFirst: daysDiff === 0,
      isLast: daysDiff === totalDays - 1,
      isSingle: totalDays === 1
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentDate)) return;
    
    const dateEntries = getAllEntriesForDate(date);
    if (dateEntries.length > 0) {
      // Show entry details if entries exist
      setSelectedEntry(dateEntries[0]); // Show first entry, can be enhanced to show all
      setShowEntryDetails(true);
    } else {
      // Add new entry for this date
      setSelectedDate(formatDateKey(date));
      setNewEntry({
        ...newEntry,
        visit_date: formatDateKey(date)
      });
      setShowAddModal(true);
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), -firstDay + i + 1);
      days.push({
        date: prevMonthDate,
        isCurrentMonth: false,
        isToday: isToday(prevMonthDate),
        entries: getAllEntriesForDate(prevMonthDate)
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isToday(date),
        entries: getAllEntriesForDate(date)
      });
    }

    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - days.length; // 6 rows × 7 days = 42 cells
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({
        date: nextMonthDate,
        isCurrentMonth: false,
        isToday: isToday(nextMonthDate),
        entries: getAllEntriesForDate(nextMonthDate)
      });
    }

    return days;
  };

  const resetForm = () => {
    setNewEntry({
      entry_type: 'scheduled_visit',
      visit_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_multiple_days: false,
      is_multiple_children: false,
      start_time: '',
      end_time: '',
      child_name: '',
      location: '',
      notes: '',
      is_overnight: false,
      other_parent_present: false,
      pickup_person: '',
      dropoff_person: ''
    });
    setSelectedDate('');
    setError('');
  };

  // Calendar OAuth handlers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGoogleConnect = async () => {
    try {
      if (!userId) {
        setSyncStatus('Please log in to connect calendar');
        return;
      }
      
      const authUrl = await calendarService.connectGoogleCalendar(userId);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google Calendar connection error:', error);
      setSyncStatus('Failed to connect Google Calendar. Please check your environment variables.');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMicrosoftConnect = async () => {
    try {
      if (!userId) {
        setSyncStatus('Please log in to connect calendar');
        return;
      }
      
      const authUrl = await calendarService.connectMicrosoftCalendar(userId);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Microsoft Calendar connection error:', error);
      setSyncStatus('Failed to connect Microsoft Calendar. Please check your environment variables.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading parenting time log...</p>
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
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              {firstName ? `${firstName}&apos;s Parenting Time Log` : 'Parenting Time Log'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track custody visits, missed time, and important notes
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
            >
              {viewMode === 'calendar' ? '📋 List View' : '📅 Calendar View'}
            </button>
            <button
              onClick={() => setShowCalendarSync(true)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              📅 Calendar Sync (Coming Soon)
            </button>
            {isSubscribed ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                ➕ Add Entry
              </button>
            ) : (
              <button
                onClick={() => router.push('/payment')}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition"
              >
                🔓 Upgrade to Track Time
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
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl mb-2">🔒 Premium Feature Preview</h3>
                <p className="text-green-100 mb-4">
                  You&apos;re viewing the Parenting Time Tracker interface. Upgrade to Premium to:
                </p>
                <ul className="text-green-100 text-sm space-y-1">
                  <li>• Log unlimited parenting time entries</li>
                  <li>• Track visits, missed time, and makeup sessions</li>
                  <li>• Generate court-ready parenting time reports</li>
                  <li>• Calendar integration and sync</li>
                  <li>• Detailed statistics and analytics</li>
                </ul>
              </div>
              <div className="text-center ml-6">
                <div className="text-4xl mb-2">📅</div>
                <button
                  onClick={() => router.push('/payment')}
                  className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition"
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-indigo-600">{stats.past_visits}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Past Visits</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-amber-600">{stats.upcoming_visits}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current/Upcoming Visits</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">{stats.successful_visits}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Successful Visits</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600">{stats.missed_visits}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Missed Visits</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600">{stats.makeup_visits}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Makeup Visits</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600">{stats.overnight_visits}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overnight Stays</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {viewMode === 'list' ? (
            /* List View */
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No entries yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-6">
                    Start tracking your parenting time by adding your first entry.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                  >
                    Add Your First Entry
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span style={{ color: entry.color }} className="text-xl">{entry.icon}</span>
                          <span className="font-semibold">{formatDate(entry.visit_date)}</span>
                          {entry.start_time && entry.end_time && (
                            <span className="text-sm text-gray-500">
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </span>
                          )}
                        </div>
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: entry.color }}
                        >
                          {entry.type_description}
                        </span>
                      </div>
                      {entry.child_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <strong>Child:</strong> {entry.child_name}
                        </p>
                      )}
                      {entry.location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <strong>Location:</strong> {entry.location}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          {entry.notes}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {entry.is_overnight && <span>🌙 Overnight</span>}
                        {entry.other_parent_present && <span>👥 Other parent present</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Calendar View */
            <div className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Calendar View</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    ←
                  </button>
                  <h3 className="text-xl font-semibold min-w-[200px] text-center">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-semibold mb-2">Legend:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  {entryTypes.map((type) => (
                    <div key={type.name} className="flex items-center space-x-2">
                      <span style={{ color: type.color }} className="text-lg">{type.icon}</span>
                      <span>{type.description}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Click empty dates to add entries, click existing entries to view details
                </p>
              </div>

              {/* Calendar Grid */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Days of the week header */}
                <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                  {generateCalendarDays().map((dayData, index) => {
                    const dayNumber = dayData.date.getDate();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const hasEntries = dayData.entries.length > 0;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleDateClick(dayData.date)}
                        className={`
                          group min-h-[100px] p-2 border-r border-b border-gray-200 dark:border-gray-600 cursor-pointer transition
                          ${dayData.isCurrentMonth 
                            ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'
                          }
                          ${dayData.isToday 
                            ? 'ring-2 ring-blue-500 ring-inset' 
                            : ''
                          }
                        `}
                      >
                        {/* Day Number */}
                        <div className="flex justify-between items-start mb-1">
                          <span className={`
                            text-sm font-semibold
                            ${dayData.isToday 
                              ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                              : ''
                            }
                          `}>
                            {dayNumber}
                          </span>
                        </div>

                        {/* Entries */}
                        <div className="space-y-1">
                          {dayData.entries.slice(0, 3).map((entry) => {
                            const multiDayInfo = parseMultiDayVisit(entry);
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const position = getMultiDayPosition(dayData.date, entry);
                            const isMultiDay = multiDayInfo !== null;
                            
                            return (
                              <div
                                key={entry.id}
                                className={`text-xs p-1 truncate relative ${
                                  isMultiDay ? 'rounded-none' : 'rounded'
                                }`}
                                style={{ 
                                  backgroundColor: entry.color + '20',
                                  color: entry.color,
                                  borderLeft: isMultiDay ? `3px solid ${entry.color}` : 'none'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEntry(entry);
                                  setShowEntryDetails(true);
                                }}
                              >
                                <span className="font-semibold">{entry.icon} {entry.type_description}</span>
                                {entry.start_time && (
                                  <div className="text-xs opacity-75">{formatTime(entry.start_time)}</div>
                                )}
                              </div>
                            );
                          })}
                          {dayData.entries.length > 3 && (
                            <div className="text-xs text-gray-500 p-1">
                              +{dayData.entries.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}