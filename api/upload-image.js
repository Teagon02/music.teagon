const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !dataset || !token) {
    return response.status(500).json({ error: 'Máy chủ chưa được cấu hình kết nối Sanity.' });
  }

  const contentType = (request.headers['content-type'] || '').split(';')[0];
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return response.status(415).json({ error: 'Định dạng ảnh không được hỗ trợ.' });
  }

  const contentLength = Number(request.headers['content-length'] || 0);
  if (contentLength > MAX_IMAGE_SIZE) {
    return response.status(413).json({ error: 'Ảnh không được lớn hơn 4 MB.' });
  }

  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > MAX_IMAGE_SIZE) {
        return response.status(413).json({ error: 'Ảnh không được lớn hơn 4 MB.' });
      }
      chunks.push(chunk);
    }
    if (size === 0) {
      return response.status(400).json({ error: 'Không tìm thấy dữ liệu ảnh.' });
    }

    let fileName = 'song-image';
    try {
      fileName = decodeURIComponent(request.headers['x-file-name'] || fileName)
        .replace(/[\r\n"]/g, '').slice(0, 150);
    } catch (_) {}

    const params = new URLSearchParams({ filename: fileName });
    const sanityUrl = `https://${projectId}.api.sanity.io/v2023-05-03/assets/images/${dataset}?${params}`;
    const sanityResponse = await fetch(sanityUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType },
      body: Buffer.concat(chunks)
    });
    const result = await sanityResponse.json();
    if (!sanityResponse.ok) {
      console.error('Sanity upload failed:', result);
      return response.status(502).json({ error: 'Sanity từ chối tệp ảnh.' });
    }

    return response.status(201).json({ url: result.document.url, assetId: result.document._id });
  } catch (error) {
    console.error('Image upload failed:', error);
    return response.status(500).json({ error: 'Không thể tải ảnh lên Sanity.' });
  }
};

module.exports.config = { api: { bodyParser: false } };
