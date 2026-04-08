import { getConfluenceCredentials } from '$lib/server/confluence-connection';
import { uploadDiagramToConfluence, type ImageFormat } from '$lib/server/confluence';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const credentials = await getConfluenceCredentials();
  if (!credentials) {
    return json(
      { success: false, message: 'Confluence credentials are not configured. Go to Settings.' },
      { status: 401 }
    );
  }

  const body = (await request.json()) as {
    dataUrl?: string;
    format?: string;
    pageId?: string;
    fileName?: string;
  };

  const { dataUrl, format, pageId, fileName } = body;

  if (!dataUrl || !format || !pageId) {
    return json(
      { success: false, message: 'dataUrl, format, and pageId are required.' },
      { status: 400 }
    );
  }

  const validFormats: ImageFormat[] = ['svg', 'png', 'jpg'];
  if (!validFormats.includes(format as ImageFormat)) {
    return json({ success: false, message: `Invalid format: ${format}` }, { status: 400 });
  }

  // Convert base64 data URL to Buffer
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  try {
    const result = await uploadDiagramToConfluence({
      baseUrl: credentials.baseUrl,
      email: credentials.email,
      apiToken: credentials.apiToken,
      pageId,
      imageBuffer,
      format: format as ImageFormat,
      ...(fileName?.trim() ? { filename: fileName.trim() } : {})
    });

    return json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Confluence export failed:', error);
    return json({ success: false, message }, { status: 502 });
  }
};
