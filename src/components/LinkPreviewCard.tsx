import React, { useState } from 'react';
import { ExternalLink, Play, Link2 } from 'lucide-react';

interface LinkPreviewCardProps {
  url: string;
  className?: string;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, className = '' }) => {
  const [imgError, setImgError] = useState(false);

  if (!url) return null;

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  let domain = '';
  try {
    const parsed = new URL(formattedUrl);
    domain = parsed.hostname.replace('www.', '');
  } catch {
    domain = formattedUrl;
  }

  // Helper: Extract YouTube Video ID
  const getYouTubeId = (urlStr: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = getYouTubeId(formattedUrl);
  const isImage = /\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(formattedUrl);
  const isGoogleDrive = domain.includes('drive.google.com') || domain.includes('docs.google.com');

  // Favicon API from Google
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  // Screenshot / Preview API using thum.io
  const previewThumbnailUrl = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : isImage
    ? formattedUrl
    : `https://image.thum.io/get/width/600/crop/400/noanimate/${formattedUrl}`;

  return (
    <a
      href={formattedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 ${className}`}
    >
      {/* Top Banner / Image Preview */}
      {!imgError && (
        <div className="relative w-full h-36 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
          <img
            src={previewThumbnailUrl}
            alt="Website Preview"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {youtubeId && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/35 transition-colors">
              <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>
          )}
          {/* Badge indicator */}
          <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <img 
              src={faviconUrl} 
              alt="" 
              className="w-3.5 h-3.5 rounded-sm" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
            <span className="capitalize">{youtubeId ? 'YouTube Video' : isGoogleDrive ? 'Google Workspace' : domain}</span>
          </div>
        </div>
      )}

      {/* Bottom Information */}
      <div className="p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Link2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-900 transition-colors">
              {domain}
            </p>
            <p className="text-[10px] font-medium text-slate-400 truncate">
              {formattedUrl}
            </p>
          </div>
        </div>
        <div className="flex items-center text-xs font-bold text-indigo-600 shrink-0 group-hover:translate-x-0.5 transition-transform">
          Buka <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </a>
  );
};
export default LinkPreviewCard;
