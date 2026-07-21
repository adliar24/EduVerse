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
  let pathName = '';
  try {
    const parsed = new URL(formattedUrl);
    domain = parsed.hostname.replace('www.', '');
    pathName = parsed.pathname;
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
  
  // Specific domain checks for tailored rich cards
  const isGoogleDrive = domain.includes('drive.google.com') || domain.includes('docs.google.com');
  const isGoogleForms = domain.includes('forms.gle') || pathName.includes('/forms/');
  const isQuizizz = domain.includes('quizizz.com');
  const isKahoot = domain.includes('kahoot');
  const isCanva = domain.includes('canva.com');
  const isPdf = formattedUrl.toLowerCase().endsWith('.pdf') || pathName.toLowerCase().endsWith('.pdf');

  // Favicon API from Google (High-res 128px)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  // Select optimal thumbnail source
  let previewThumbnailUrl = '';
  if (youtubeId) {
    previewThumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  } else if (isImage) {
    previewThumbnailUrl = formattedUrl;
  } else if (!isGoogleDrive && !isGoogleForms && !isPdf) {
    // Screenshot service using microlink API
    previewThumbnailUrl = `https://api.microlink.io/?url=${encodeURIComponent(formattedUrl)}&embed=screenshot.url`;
  }

  // Determine site badge title
  const siteBadge = youtubeId
    ? 'YouTube Video'
    : isGoogleForms
    ? 'Google Form'
    : isGoogleDrive
    ? 'Google Workspace'
    : isQuizizz
    ? 'Quizizz Kuis'
    : isKahoot
    ? 'Kahoot Game'
    : isCanva
    ? 'Canva Desain'
    : isPdf
    ? 'Dokumen PDF'
    : domain;

  // Custom Gradient Colors for Known Platforms
  const getBannerGradient = () => {
    if (youtubeId) return 'from-red-600 via-red-700 to-rose-900';
    if (isGoogleForms) return 'from-purple-700 via-indigo-800 to-slate-900';
    if (isGoogleDrive) return 'from-blue-600 via-indigo-700 to-slate-900';
    if (isQuizizz) return 'from-purple-600 via-violet-700 to-indigo-900';
    if (isKahoot) return 'from-violet-700 via-indigo-900 to-slate-950';
    if (isCanva) return 'from-cyan-600 via-teal-700 to-slate-900';
    if (isPdf) return 'from-rose-600 via-red-700 to-slate-900';
    return 'from-indigo-900 via-slate-900 to-slate-950';
  };

  const showBanner = imgError || (!previewThumbnailUrl && (isGoogleDrive || isGoogleForms || isPdf));

  return (
    <a
      href={formattedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 ${className}`}
    >
      {/* Top Media / Preview Container */}
      <div className="relative w-full h-36 bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-100">
        {!showBanner && previewThumbnailUrl ? (
          <>
            <img
              src={previewThumbnailUrl}
              alt="Preview"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {youtubeId && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Vibrant Custom Rich Brand Banner (Fallback / Google Workspace / PDFs) */
          <div className={`w-full h-full bg-gradient-to-br ${getBannerGradient()} p-4 flex items-center justify-between relative overflow-hidden`}>
            {/* Background Accent Shapes */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
                <img 
                  src={faviconUrl} 
                  alt="" 
                  className="w-7 h-7 object-contain rounded-md"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block opacity-90">
                  {siteBadge}
                </span>
                <p className="text-sm font-bold truncate tracking-tight text-white/95 mt-0.5">
                  {domain}
                </p>
              </div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Floating Domain Badge Overlay */}
        <div className="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md border border-white/10">
          <img 
            src={faviconUrl} 
            alt="" 
            className="w-3.5 h-3.5 rounded-sm shrink-0" 
            onError={(e) => ((e.currentTarget as HTMLElement).style.display = 'none')} 
          />
          <span className="capitalize">{siteBadge}</span>
        </div>
      </div>

      {/* Bottom Information */}
      <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
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
