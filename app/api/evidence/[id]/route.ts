import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';

// GET /api/evidence/[id] - Get specific evidence item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('evidence_with_category')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
      }
      console.error('❌ Failed to fetch evidence item:', error);
      return NextResponse.json({ error: 'Failed to fetch evidence item' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('❌ Evidence fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/evidence/[id] - Update specific evidence item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      opposingParty,
      isArchived
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Verify the evidence item exists and belongs to the user
    const { data: existing, error: checkError } = await supabase
      .from('evidence_items')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }

    // Validate importance level if provided
    if (importanceLevel && (importanceLevel < 1 || importanceLevel > 5)) {
      return NextResponse.json({ 
        error: 'Importance level must be between 1 and 5' 
      }, { status: 400 });
    }

    // Validate incident date if provided
    if (incidentDate && isNaN(Date.parse(incidentDate))) {
      return NextResponse.json({ 
        error: 'Invalid incident date format' 
      }, { status: 400 });
    }

    // Verify category exists if provided
    if (categoryId) {
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
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (incidentDate !== undefined) updateData.incident_date = incidentDate || null;
    if (timeOfDay !== undefined) updateData.time_of_day = timeOfDay || null;
    if (contentText !== undefined) updateData.content_text = contentText?.trim() || null;
    if (tags !== undefined) updateData.tags = tags || [];
    if (peopleInvolved !== undefined) updateData.people_involved = peopleInvolved || [];
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (importanceLevel !== undefined) updateData.importance_level = importanceLevel;
    if (isCourtAdmissible !== undefined) updateData.is_court_admissible = isCourtAdmissible;
    if (caseNumber !== undefined) updateData.case_number = caseNumber?.trim() || null;
    if (opposingParty !== undefined) updateData.opposing_party = opposingParty?.trim() || null;
    if (isArchived !== undefined) updateData.is_archived = isArchived;

    // Update the evidence item
    const { data, error } = await supabase
      .from('evidence_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update evidence item:', error);
      return NextResponse.json({ error: 'Failed to update evidence item' }, { status: 500 });
    }

    console.log('✅ Evidence item updated:', data.id);
    return NextResponse.json({ data });
  } catch (err) {
    console.error('❌ Evidence update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/evidence/[id] - Delete specific evidence item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const hardDelete = searchParams.get('hard') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Verify the evidence item exists and belongs to the user
    const { data: existing, error: checkError } = await supabase
      .from('evidence_items')
      .select('id, is_deleted')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });
    }

    if (hardDelete) {
      // Permanently delete the evidence item
      const { error } = await supabase
        .from('evidence_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Failed to delete evidence item:', error);
        return NextResponse.json({ error: 'Failed to delete evidence item' }, { status: 500 });
      }

      console.log('✅ Evidence item permanently deleted:', id);
      return NextResponse.json({ message: 'Evidence item permanently deleted' });
    } else {
      // Soft delete - mark as deleted
      const { data, error } = await supabase
        .from('evidence_items')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to delete evidence item:', error);
        return NextResponse.json({ error: 'Failed to delete evidence item' }, { status: 500 });
      }

      console.log('✅ Evidence item soft deleted:', id);
      return NextResponse.json({ data });
    }
  } catch (err) {
    console.error('❌ Evidence deletion error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 