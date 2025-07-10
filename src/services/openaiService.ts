import OpenAI from 'openai';
import { logError, createAppError, ErrorCode } from '@/src/utils/errorHandler';
import { extractTextFromFile } from '@/src/utils/extractTextFromFile';
import { supabase } from '@/src/lib/server-only/supabase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MAX_CONTEXT_CHARS = 10000;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
];

export async function generateResponse(
  question: string,
  tone: string,
  fileUrl: string,
  contextPrompt: string
): Promise<string> {
  try {
    // Moderation check
    const moderationRes = await openai.moderations.create({ input: question });
    if (moderationRes.results[0]?.flagged) {
      console.warn('🚫 Moderation flagged input:', moderationRes.results[0]);
      throw createAppError(
        'Your question may violate safety guidelines. Please rephrase and try again.',
        ErrorCode.OPENAI_ERROR,
        400
      );
    }

    let context = '';
    
    // Process file if provided
    if (fileUrl) {
      try {
        const parts = fileUrl.split('/object/public/');
        if (parts.length >= 2) {
          const [bucketName, ...pathParts] = parts[1].split('/');
          const filePath = pathParts.join('/');

          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from(bucketName)
            .createSignedUrl(filePath, 60);

          if (signedUrlError || !signedUrlData?.signedUrl) {
            console.warn('Could not generate signed file URL:', signedUrlError);
          } else {
            const fileRes = await fetch(signedUrlData.signedUrl);
            const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
            const mimeType = fileRes.headers.get('content-type') || 'application/octet-stream';

            if (ALLOWED_MIME_TYPES.includes(mimeType)) {
              context = await extractTextFromFile(fileBuffer, mimeType);
              if (context.length > MAX_CONTEXT_CHARS) {
                context = context.slice(0, MAX_CONTEXT_CHARS) + '\n\n...[truncated]';
              }
            }
          }
        }
      } catch (fileError) {
        console.warn('Error processing file:', fileError);
        // Continue without file context
      }
    }

    // Build the AI prompt
    const aiPrompt = `
${contextPrompt}

Question: "${question}"

${context ? `Relevant document context:\n${context}` : ''}

Please provide a helpful, ${tone} response that assists with tone, clarity, and preparing professional communication. Always align your answer with family law best practices and avoid giving direct legal advice.
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a calm, empathetic assistant helping parents understand custody paperwork and communications. Never provide legal advice - instead focus on communication strategies, tone, and clarity.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim();
    
    if (!result) {
      throw createAppError(
        'No response generated from OpenAI',
        ErrorCode.OPENAI_ERROR,
        500
      );
    }

    return result;

  } catch (error) {
    console.error('Error in generateResponse:', error);
    logError(error as Error, { question, tone, fileUrl });
    
    if (error instanceof Error && error.message.includes('safety guidelines')) {
      throw error;
    }
    
    throw createAppError(
      'Failed to generate response. Please try again.',
      ErrorCode.OPENAI_ERROR,
      500
    );
  }
} 