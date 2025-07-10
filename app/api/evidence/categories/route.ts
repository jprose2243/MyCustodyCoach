import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/server-only/supabase-admin';

// GET /api/evidence/categories - Get all evidence categories
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('evidence_categories')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('❌ Failed to fetch evidence categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('❌ Categories API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 