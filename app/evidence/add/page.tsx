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
}

export default function AddEvidencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<EvidenceCategory[]>([]);
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    description: '',
    incidentDate: '',
    timeOfDay: '',
    contentText: '',
    tags: [] as string[],
    peopleInvolved: [] as string[],
    location: '',
    importanceLevel: 3,
    isCourtAdmissible: false,
    caseNumber: '',
    opposingParty: ''
  });

  // UI state
  const [tagInput, setTagInput] = useState('');
  const [personInput, setPersonInput] = useState('');

  useEffect(() => {
    const initializePage = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.error('❌ No Supabase session:', sessionError);
        router.push('/login');
        return;
      }

      setUserId(session.user.id);

      // Get user profile for personalization
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, opposing_party')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name || '');
        // Pre-populate opposing party if available
        if (profile.opposing_party) {
          setFormData(prev => ({ ...prev, opposingParty: profile.opposing_party }));
        }
      }

      await loadCategories();
    };

    initializePage();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('evidence_categories')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('❌ Failed to load categories:', error);
      setError('Failed to load categories');
      return;
    }

    setCategories(data || []);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user makes changes
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter((_, i) => i !== index) 
    }));
  };

  const addPerson = () => {
    const person = personInput.trim();
    if (person && !formData.peopleInvolved.includes(person)) {
      setFormData(prev => ({ ...prev, peopleInvolved: [...prev.peopleInvolved, person] }));
      setPersonInput('');
    }
  };

  const removePerson = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      peopleInvolved: prev.peopleInvolved.filter((_, i) => i !== index) 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.categoryId) {
        throw new Error('Please select a category');
      }
      if (!formData.title.trim()) {
        throw new Error('Please enter a title');
      }

      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          categoryId: formData.categoryId,
          title: formData.title,
          description: formData.description,
          incidentDate: formData.incidentDate || null,
          timeOfDay: formData.timeOfDay || null,
          contentText: formData.contentText,
          tags: formData.tags,
          peopleInvolved: formData.peopleInvolved,
          location: formData.location,
          importanceLevel: formData.importanceLevel,
          isCourtAdmissible: formData.isCourtAdmissible,
          caseNumber: formData.caseNumber,
          opposingParty: formData.opposingParty
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create evidence item');
      }

      console.log('✅ Evidence item created:', result.data.id);
      setSuccess('Evidence item created successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/evidence');
      }, 1500);

    } catch (err: any) {
      console.error('❌ Failed to create evidence:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImportanceLabel = (level: number) => {
    const labels = {
      1: 'Low - Minor issue',
      2: 'Minor - Worth noting',
      3: 'Moderate - Important',
      4: 'High - Very important',
      5: 'Critical - Urgent/serious'
    };
    return labels[level as keyof typeof labels];
  };

  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  return (
    <main className="min-h-screen bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              Add Evidence
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {firstName ? `Hi ${firstName}! ` : ''}Document a new piece of evidence for your custody case
            </p>
          </div>
          
          <button
            onClick={() => router.push('/evidence')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
          >
            ← Back to Evidence
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          {/* Success/Error Messages */}
          {success && (
            <div className="p-4 mb-6 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              ✅ {success}
            </div>
          )}
          
          {error && (
            <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              ❌ {error}
            </div>
          )}

          <div className="p-8 space-y-8">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Evidence Category *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleInputChange('categoryId', category.id)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      formData.categoryId === category.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="font-semibold text-sm">{category.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {category.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Brief title for this evidence"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Importance Level
                </label>
                <select
                  value={formData.importanceLevel}
                  onChange={(e) => handleInputChange('importanceLevel', Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                >
                  {[1, 2, 3, 4, 5].map(level => (
                    <option key={level} value={level}>
                      {getImportanceLabel(level)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide a detailed description of this evidence..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Incident Date
                </label>
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Time of Day
                </label>
                <input
                  type="time"
                  value={formData.timeOfDay}
                  onChange={(e) => handleInputChange('timeOfDay', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Content Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Content/Transcript
              </label>
              <textarea
                value={formData.contentText}
                onChange={(e) => handleInputChange('contentText', e.target.value)}
                placeholder="Copy text messages, email content, or transcribe voice messages here..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 font-mono text-sm"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 text-indigo-500 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* People Involved */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                People Involved
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.peopleInvolved.map((person, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm"
                  >
                    👤 {person}
                    <button
                      type="button"
                      onClick={() => removePerson(index)}
                      className="ml-2 text-green-500 hover:text-green-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={personInput}
                  onChange={(e) => setPersonInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())}
                  placeholder="Add a person's name..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
                <button
                  type="button"
                  onClick={addPerson}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Location and Case Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Where did this incident occur?"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Case Number
                </label>
                <input
                  type="text"
                  value={formData.caseNumber}
                  onChange={(e) => handleInputChange('caseNumber', e.target.value)}
                  placeholder="Court case number (if applicable)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Opposing Party */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Other Parent/Opposing Party
              </label>
              <input
                type="text"
                value={formData.opposingParty}
                onChange={(e) => handleInputChange('opposingParty', e.target.value)}
                placeholder="Name of the other parent or opposing party"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
              />
            </div>

            {/* Court Admissible Checkbox */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="courtAdmissible"
                checked={formData.isCourtAdmissible}
                onChange={(e) => handleInputChange('isCourtAdmissible', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="courtAdmissible" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                This evidence is likely admissible in court
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500">
                * Required fields
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/evidence')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Evidence...' : 'Add Evidence'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
} 