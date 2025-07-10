import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/src/services/openaiService';
import { supabase } from '@/src/lib/server-only/supabase-admin';
import { logError } from '@/src/utils/errorHandler';

export const config = {
  api: { bodyParser: false },
};

// Helper function to detect parenting time related queries
function isParentingTimeQuery(question: string): boolean {
  const parentingTimeKeywords = [
    'parenting time', 'parenting schedule', 'custody time', 'visitation time',
    'visits', 'overnight', 'overnight visits', 'missed visits', 'makeup visits',
    'time with child', 'time with children', 'custody schedule',
    'week', 'month', 'year', 'this week', 'this month', 'last month',
    'how much time', 'how many visits', 'how many days', 'how many hours',
    'statistics', 'stats', 'summary', 'total time', 'missed time'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return parentingTimeKeywords.some(keyword => lowerQuestion.includes(keyword));
}

// Helper function to fetch user's parenting time data
async function fetchParentingTimeData(userId: string) {
  try {
    // Fetch statistics
    const { data: stats, error: statsError } = await supabase
      .from('parenting_stats_view')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get current date for separating past/upcoming
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch recent entries (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentEntries, error: entriesError } = await supabase
      .from('parenting_calendar_view')
      .select('*')
      .eq('user_id', userId)
      .gte('visit_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('visit_date', { ascending: false });

    // Fetch all entries for broader context
    const { data: allEntries, error: allEntriesError } = await supabase
      .from('parenting_calendar_view')
      .select('visit_date, entry_type, child_name, is_overnight')
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });

    // Fetch past visits (before today)
    const { data: pastEntries, error: pastError } = await supabase
      .from('parenting_calendar_view')
      .select('visit_date, entry_type, child_name, is_overnight')
      .eq('user_id', userId)
      .lt('visit_date', today)
      .order('visit_date', { ascending: false });

    // Fetch upcoming visits (today and future)
    const { data: upcomingEntries, error: upcomingError } = await supabase
      .from('parenting_calendar_view')
      .select('visit_date, entry_type, child_name, is_overnight')
      .eq('user_id', userId)
      .gte('visit_date', today)
      .order('visit_date', { ascending: true });

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching parenting stats:', statsError);
    }
    
    if (entriesError) {
      console.error('Error fetching recent entries:', entriesError);
    }

    if (allEntriesError) {
      console.error('Error fetching all entries:', allEntriesError);
    }

    if (pastError) {
      console.error('Error fetching past entries:', pastError);
    }

    if (upcomingError) {
      console.error('Error fetching upcoming entries:', upcomingError);
    }

    return {
      stats: stats || {
        total_entries: 0,
        successful_visits: 0,
        missed_visits: 0,
        makeup_visits: 0,
        overnight_visits: 0
      },
      recentEntries: recentEntries || [],
      allEntries: allEntries || [],
      pastEntries: pastEntries || [],
      upcomingEntries: upcomingEntries || []
    };
  } catch (error) {
    console.error('Error in fetchParentingTimeData:', error);
    return { 
      stats: null, 
      recentEntries: [], 
      allEntries: [],
      pastEntries: [],
      upcomingEntries: []
    };
  }
}

// Helper function to format parenting time data for AI context
interface ParentingTimeEntry {
  visit_date: string;
  entry_type: string;
  type_description?: string;
  child_name?: string;
  is_overnight: boolean;
}

interface ParentingTimeStats {
  total_entries: number;
  successful_visits: number;
  missed_visits: number;
  makeup_visits: number;
  overnight_visits: number;
}

interface ParentingTimeData {
  stats: ParentingTimeStats | null;
  recentEntries: ParentingTimeEntry[];
  allEntries: ParentingTimeEntry[];
  pastEntries: ParentingTimeEntry[];
  upcomingEntries: ParentingTimeEntry[];
}

function formatParentingTimeContext(data: ParentingTimeData): string {
  const { stats, recentEntries, allEntries, pastEntries, upcomingEntries } = data;
  
  if (!stats || stats.total_entries === 0) {
    return '\n\nParenting Time Context: This user has not logged any parenting time entries yet. If they ask about parenting time, suggest they start tracking their visits in the Parenting Time Log.';
  }

  let context = '\n\nParenting Time Context (User\'s Personal Data):';
  
  // Overall statistics with past/upcoming breakdown
  context += `\nOverall Statistics:
- Past visits: ${pastEntries.length}
- Upcoming visits: ${upcomingEntries.length}
- Successful visits: ${stats.successful_visits}
- Missed visits: ${stats.missed_visits}
- Makeup visits: ${stats.makeup_visits}
- Overnight visits: ${stats.overnight_visits}`;

  // Upcoming visits preview
  if (upcomingEntries.length > 0) {
    context += `\n\nUpcoming Visits (Next ${Math.min(upcomingEntries.length, 5)}):`;
    upcomingEntries.slice(0, 5).forEach((entry: ParentingTimeEntry) => {
      const date = new Date(entry.visit_date).toLocaleDateString();
      const type = entry.type_description || entry.entry_type;
      const child = entry.child_name ? ` with ${entry.child_name}` : '';
      const overnight = entry.is_overnight ? ' (overnight)' : '';
      context += `\n- ${date}: ${type}${child}${overnight}`;
    });
  }

  // Recent activity (last 30 days)
  if (recentEntries.length > 0) {
    context += `\n\nRecent Activity (Last 30 Days): ${recentEntries.length} entries`;
    
    // Group recent entries by type
    const recentByType = recentEntries.reduce((acc: Record<string, number>, entry: ParentingTimeEntry) => {
      const type = entry.type_description || entry.entry_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(recentByType).forEach(([type, count]) => {
      context += `\n- ${type}: ${count}`;
    });

    // Recent specific visits
    context += '\n\nRecent Past Visits:';
    recentEntries.slice(0, 10).forEach((entry: ParentingTimeEntry) => {
      const date = new Date(entry.visit_date).toLocaleDateString();
      const type = entry.type_description || entry.entry_type;
      const child = entry.child_name ? ` with ${entry.child_name}` : '';
      const overnight = entry.is_overnight ? ' (overnight)' : '';
      context += `\n- ${date}: ${type}${child}${overnight}`;
    });
  }

  // Calculate time periods if user asks about specific timeframes
  const now = new Date();
  const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  const thisWeekEntries = allEntries.filter((entry: ParentingTimeEntry) => 
    new Date(entry.visit_date) >= thisWeekStart);
  const thisMonthEntries = allEntries.filter((entry: ParentingTimeEntry) => 
    new Date(entry.visit_date) >= thisMonthStart);
  const thisYearEntries = allEntries.filter((entry: ParentingTimeEntry) => 
    new Date(entry.visit_date) >= thisYearStart);

  context += `\n\nTime Period Summaries:
- This week: ${thisWeekEntries.length} entries
- This month: ${thisMonthEntries.length} entries  
- This year: ${thisYearEntries.length} entries`;

  context += '\n\nNote: When answering questions about parenting time, use this actual logged data to provide specific, personalized responses. Be accurate with dates, counts, and patterns from their real entries. Pay special attention to upcoming visits for planning purposes.';

  return context;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt: question,
      recipient,
      tone,
      fileKey,
      extractedText,
      userId,
      // firstName, courtState, goalPriority - reserved for future use
    } = body;

    if (!question || !tone || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user profile for context
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, court_state, child_age, goal_priority, parent_role, questions_used, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // Check if user has exceeded free limit
    const isSubscribed = profile.subscription_status || false;
    const questionsUsed = profile.questions_used || 0;

    if (!isSubscribed && questionsUsed >= 3) {
      return NextResponse.json({ error: 'Free question limit reached' }, { status: 403 });
    }

    // Build context-aware prompt based on recipient
    let contextPrompt = '';
    
    switch (recipient) {
      case 'court':
        contextPrompt = `You are helping a ${profile.parent_role || 'parent'} in ${profile.court_state || 'the US'} prepare a ${tone} response for court documents or communications with a judge. The child is ${profile.child_age || 'school-age'} and the parent's goal is ${profile.goal_priority || 'the child\'s best interests'}. Focus on legal appropriateness, factual presentation, and court etiquette.`;
        break;
      case 'lawyer':
        contextPrompt = `You are helping a ${profile.parent_role || 'parent'} in ${profile.court_state || 'the US'} prepare a ${tone} communication with their attorney. The child is ${profile.child_age || 'school-age'} and the parent's goal is ${profile.goal_priority || 'the child\'s best interests'}. Focus on clear communication, providing relevant facts, and asking appropriate legal questions.`;
        break;
      case 'parent':
        contextPrompt = `You are helping a ${profile.parent_role || 'parent'} in ${profile.court_state || 'the US'} prepare a ${tone} message to communicate with the other parent. The child is ${profile.child_age || 'school-age'} and the parent's goal is ${profile.goal_priority || 'the child\'s best interests'}. Focus on de-escalation, child-centered communication, and maintaining a cooperative co-parenting relationship where possible.`;
        break;
      case 'universal':
        contextPrompt = `You are helping a ${profile.parent_role || 'parent'} in ${profile.court_state || 'the US'} prepare a ${tone} response for general use. The child is ${profile.child_age || 'school-age'} and the parent's goal is ${profile.goal_priority || 'the child\'s best interests'}. This message should be appropriate for any recipient - whether it's a mediator, guardian ad litem, social worker, family member, or other professional involved in the custody case. Focus on clarity, professionalism, and child-centered communication.`;
        break;
      default:
        contextPrompt = `You are helping a ${profile.parent_role || 'parent'} in ${profile.court_state || 'the US'} prepare a ${tone} response. The child is ${profile.child_age || 'school-age'} and the parent's goal is ${profile.goal_priority || 'the child\'s best interests'}.`;
    }

    // Add file content context if available
    if (extractedText && extractedText.trim()) {
      contextPrompt += `\n\nDocument Context (from uploaded file):\n${extractedText.slice(0, 8000)}${extractedText.length > 8000 ? '\n\n...[content truncated]' : ''}`;
    }

    // Check if this is a parenting time related query and add relevant context
    if (isParentingTimeQuery(question) && isSubscribed) {
      console.log('🔍 Detected parenting time query, fetching user data...');
      const parentingData = await fetchParentingTimeData(userId);
      const parentingContext = formatParentingTimeContext(parentingData);
      contextPrompt += parentingContext;
    }

    // Generate response using OpenAI (pass fileKey for compatibility, but rely on extractedText)
    const result = await generateResponse(question, tone, fileKey || '', contextPrompt);

    // Update question count for non-subscribers
    if (!isSubscribed) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ questions_used: questionsUsed + 1 })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update question count:', updateError);
      }
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Error in generate-response:', error);
    logError(error as Error, { endpoint: '/api/generate-response' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}