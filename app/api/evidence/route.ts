import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';

// GET /api/evidence - List evidence items for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const importance = searchParams.get('importance');
    const isArchived = searchParams.get('archived') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    let query = supabase
      .from('evidence_with_category')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', isArchived)
      .order('incident_date', { ascending: false });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category_name', category);
    }

    if (importance && importance !== '0') {
      query = query.gte('importance_level', parseInt(importance));
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Failed to fetch evidence items:', error);
      return NextResponse.json({ error: 'Failed to fetch evidence items' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('❌ Evidence API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/evidence - Create new evidence item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      categoryId,
      title,
      description,
      incidentDate,
      timeOfDay,
      contentText,
      tags,
      peopleInvolved,
      location,
      importanceLevel,
      isCourtAdmissible,
      caseNumber,
      opposingParty
    } = body;

    // Validate required fields
    if (!userId || !categoryId || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, categoryId, title' 
      }, { status: 400 });
    }

    // Validate importance level
    if (importanceLevel && (importanceLevel < 1 || importanceLevel > 5)) {
      return NextResponse.json({ 
        error: 'Importance level must be between 1 and 5' 
      }, { status: 400 });
    }

    // Validate incident date
    if (incidentDate && isNaN(Date.parse(incidentDate))) {
      return NextResponse.json({ 
        error: 'Invalid incident date format' 
      }, { status: 400 });
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('evidence_categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ 
        error: 'Invalid category ID' 
      }, { status: 400 });
    }

    // Insert evidence item
    const { data, error } = await supabase
      .from('evidence_items')
      .insert({
        user_id: userId,
        category_id: categoryId,
        title: title.trim(),
        description: description?.trim() || null,
        incident_date: incidentDate || null,
        time_of_day: timeOfDay || null,
        content_text: contentText?.trim() || null,
        tags: tags || [],
        people_involved: peopleInvolved || [],
        location: location?.trim() || null,
        importance_level: importanceLevel || 3,
        is_court_admissible: isCourtAdmissible || false,
        case_number: caseNumber?.trim() || null,
        opposing_party: opposingParty?.trim() || null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create evidence item:', error);
      return NextResponse.json({ error: 'Failed to create evidence item' }, { status: 500 });
    }

    console.log('✅ Evidence item created:', data.id);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('❌ Evidence creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 