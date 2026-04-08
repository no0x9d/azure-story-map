import { buildAuthHeader } from './confluence-connection';

export type ImageFormat = 'svg' | 'png' | 'jpg';

const MIME_TYPES: Record<ImageFormat, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg'
};

const FILE_EXTENSIONS: Record<ImageFormat, string> = {
  svg: 'svg',
  png: 'png',
  jpg: 'jpg'
};

export interface UploadResult {
  attachmentId: string;
  title: string;
  url: string;
}

/**
 * Uploads an image to a Confluence page as an attachment.
 * Uses PUT which creates or updates (new version) if the filename already exists.
 */
export async function uploadDiagramToConfluence({
  baseUrl,
  email,
  apiToken,
  pageId,
  imageBuffer,
  format,
  filename = 'storymap-export'
}: {
  baseUrl: string;
  email: string;
  apiToken: string;
  pageId: string;
  imageBuffer: Buffer;
  format: ImageFormat;
  filename?: string;
}): Promise<UploadResult> {
  const authHeader = buildAuthHeader(email, apiToken);
  const mimeType = MIME_TYPES[format];
  const extension = FILE_EXTENSIONS[format];
  const fullFilename = `${filename}.${extension}`;

  const formData = new FormData();
  const arrayBuffer = imageBuffer.buffer.slice(
    imageBuffer.byteOffset,
    imageBuffer.byteOffset + imageBuffer.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: mimeType });
  formData.append('file', blob, fullFilename);
  formData.append('minorEdit', 'true');
  formData.append('comment', `Exported from Azure Story Map on ${new Date().toISOString()}`);

  const url = `${baseUrl.replace(/\/$/, '')}/wiki/rest/api/content/${pageId}/child/attachment`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: authHeader,
      'X-Atlassian-Token': 'nocheck',
      Accept: 'application/json'
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Confluence API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    results?: Array<{ id: string; title: string; _links?: { download?: string } }>;
  };

  const attachment = data.results?.[0];
  if (!attachment) {
    throw new Error('Confluence returned no attachment data');
  }

  return {
    attachmentId: attachment.id,
    title: attachment.title,
    url: `${baseUrl.replace(/\/$/, '')}/wiki${attachment._links?.download ?? ''}`
  };
}
