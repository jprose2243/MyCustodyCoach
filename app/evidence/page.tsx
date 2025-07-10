'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase-browser';

interface EvidenceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  incident_date: string;
  time_of_day: string;
  content_text: string;
  tags: string[];
  people_involved: string[];
  location: string;
  importance_level: number;
  is_court_admissible: boolean;
  case_number: string;
  opposing_party: string;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_icon: string;
  category_color: string;
}

export default function EvidencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [categories, setCategories] = useState<EvidenceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'importance' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [importanceFilter, setImportanceFilter] = useState<number>(0); // 0 = all

  const [firstName, setFirstName] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.error('❌ No Supabase session:', sessionError);
        router.push('/login');
        return;
      }

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
        loadCategories(),
        loadEvidenceItems(session.user.id)
      ]);

      setLoading(false);
    };

    initializePage();
  }, [router]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('evidence_categories')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('❌ Failed to load categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const loadEvidenceItems = async (userId: string) => {
    const { data, error } = await supabase
      .from('evidence_with_category')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('incident_date', { ascending: false });

    if (error) {
      console.error('❌ Failed to load evidence items:', error);
      return;
    }

    setEvidenceItems(data || []);
  };

  const filteredAndSortedItems = evidenceItems
    .filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category_name !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.content_text?.toLowerCase().includes(query) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
          item.people_involved?.some(person => person.toLowerCase().includes(query))
        );
      }

      // Importance filter
      if (importanceFilter > 0 && item.importance_level < importanceFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.incident_date || a.created_at).getTime() - 
                      new Date(b.incident_date || b.created_at).getTime();
          break;
        case 'importance':
          comparison = a.importance_level - b.importance_level;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getImportanceLabel = (level: number) => {
    const labels = {
      1: { text: 'Low', color: 'bg-gray-100 text-gray-700' },
      2: { text: 'Minor', color: 'bg-blue-100 text-blue-700' },
      3: { text: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
      4: { text: 'High', color: 'bg-orange-100 text-orange-700' },
      5: { text: 'Critical', color: 'bg-red-100 text-red-700' }
    };
    return labels[level as keyof typeof labels];
  };

  const formatDate = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString();
    
    if (timeString) {
      return `${dateFormatted} at ${timeString}`;
    }
    return dateFormatted;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-50 dark:bg-gray-900 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              Evidence Organizer
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {firstName ? `Hi ${firstName}! ` : ''}Organize and manage your custody case evidence
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
            >
              ← Back to Coach
            </button>
            {isSubscribed ? (
              <button
                onClick={() => router.push('/evidence/add')}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              >
                + Add Evidence
              </button>
            ) : (
              <button
                onClick={() => router.push('/payment')}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition"
              >
                🔓 Upgrade to Add Evidence
              </button>
            )}
          </div>
        </div>

        {/* Trial User Upgrade Prompt */}
        {!isSubscribed && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl mb-2">🔒 Premium Feature Preview</h3>
                <p className="text-indigo-100 mb-4">
                  You&apos;re viewing the Evidence Organizer interface. Upgrade to Premium to:
                </p>
                <ul className="text-indigo-100 text-sm space-y-1">
                  <li>• Add and organize unlimited evidence items</li>
                  <li>• Categorize and tag your evidence</li>
                  <li>• Mark items as court-admissible</li>
                  <li>• Export evidence reports for your lawyer</li>
                  <li>• Search and filter your evidence database</li>
                </ul>
              </div>
              <div className="text-center ml-6">
                <div className="text-4xl mb-2">📂</div>
                <button
                  onClick={() => router.push('/payment')}
                  className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-indigo-600">{evidenceItems.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {evidenceItems.filter(item => item.is_court_admissible).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Court Admissible</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {evidenceItems.filter(item => item.importance_level >= 4).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">High Priority</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                placeholder="Search evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Importance Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Min. Importance</label>
              <select
                value={importanceFilter}
                onChange={(e) => setImportanceFilter(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
              >
                <option value="0">All Levels</option>
                <option value="3">Moderate+</option>
                <option value="4">High+</option>
                <option value="5">Critical Only</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'importance' | 'title')}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                >
                  <option value="date">Date</option>
                  <option value="importance">Importance</option>
                  <option value="title">Title</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedItems.length} of {evidenceItems.length} items
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                ⊞
              </button>
            </div>
          </div>
        </div>

        {/* Evidence Items */}
        {filteredAndSortedItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold mb-2">No Evidence Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {evidenceItems.length === 0 
                ? "You haven&apos;t added any evidence yet. Start building your case by adding your first piece of evidence."
                : "No evidence matches your current filters. Try adjusting your search or filter criteria."
              }
            </p>
            <button
              onClick={() => router.push('/evidence/add')}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
            >
              Add Your First Evidence
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredAndSortedItems.map((item) => {
              const importanceInfo = getImportanceLabel(item.importance_level);
              
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/evidence/${item.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{item.category_icon}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.category_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${importanceInfo.color}`}>
                        {importanceInfo.text}
                      </span>
                      {item.is_court_admissible && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          ⚖️ Court Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  {item.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="space-y-2 text-sm">
                    {item.incident_date && (
                      <div className="flex items-center text-gray-500">
                        <span className="mr-2">📅</span>
                        {formatDate(item.incident_date, item.time_of_day)}
                      </div>
                    )}
                    
                    {item.people_involved && item.people_involved.length > 0 && (
                      <div className="flex items-center text-gray-500">
                        <span className="mr-2">👥</span>
                        {item.people_involved.slice(0, 2).join(', ')}
                        {item.people_involved.length > 2 && ` +${item.people_involved.length - 2} more`}
                      </div>
                    )}

                    {item.location && (
                      <div className="flex items-center text-gray-500">
                        <span className="mr-2">📍</span>
                        {item.location}
                      </div>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                            +{item.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
} 