import React, { useState } from 'react';
import { ExternalLink, Play, Link2 } from 'lucide-react';

interface LinkPreviewCardProps {
  url: string;
  className?: string;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, className = '' }) => {
  const [imgIndex, setImgIndex] = useState(0);

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

  const isGoogleDrive = domain.includes('drive.google.com') || domain.includes('docs.google.com');
  const isGoogleForms = domain.includes('forms.gle') || pathName.includes('/forms/');
  const isQuizizz = domain.includes('quizizz.com');
  const isKahoot = domain.includes('kahoot');
  const isCanva = domain.includes('canva.com');
  const isPdf = formattedUrl.toLowerCase().endsWith('.pdf') || pathName.toLowerCase().endsWith('.pdf');

  // Favicon API from Google (High-res 128px)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  // Multiple 16:9 High-Resolution Desktop Screenshot Sources (1280x720) with Wait Time for JS Hydration
  const imageSources: string[] = [];
  if (youtubeId) {
    imageSources.push(`https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`);
    imageSources.push(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);
  } else if (isImage) {
    imageSources.push(formattedUrl);
  } else {
    // 1. WordPress mShots 1280x720 16:9 Desktop Engine (Wait 6 seconds for SPA hydration & loading screen)
    imageSources.push(`https://s0.wp.com/mshots/v1/${encodeURIComponent(formattedUrl)}?w=1280&h=720&vtype=desktop&wait=6`);
    // 2. Microlink Screenshot API with 5s delay
    imageSources.push(`https://api.microlink.io/?url=${encodeURIComponent(formattedUrl)}&screenshot=true&embed=screenshot.url&waitForTimeout=5000`);
    // 3. Thum.io 1280x720 with 6s wait
    imageSources.push(`https://image.thum.io/get/width/1280/crop/720/wait/6/noanimate/${formattedUrl}`);
  }

  const currentImgUrl = imageSources[imgIndex] || null;
  const isMaxFallback = imgIndex >= imageSources.length;

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

  const handleImageError = () => {
    setImgIndex((prev) => prev + 1);
  };

  return (
    <a
      href={formattedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/15 transition-all duration-300 ${className}`}
    >
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full aspect-[16/9] min-h-[160px] max-h-[280px] bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-100">
        {!isMaxFallback && currentImgUrl ? (
          <>
            <img
              src={currentImgUrl}
              alt="16:9 Web Preview"
              onError={handleImageError}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {youtubeId && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Vibrant Brand Banner Fallback (16:9 Ratio) */
          <div className={`w-full h-full bg-gradient-to-br ${getBannerGradient()} p-6 flex items-center justify-between relative overflow-hidden`}>
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-xl">
                <img 
                  src={faviconUrl} 
                  alt="" 
                  className="w-8 h-8 object-contain rounded-md"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 text-white">
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-200 block opacity-90">
                  {siteBadge}
                </span>
                <p className="text-base font-extrabold truncate tracking-tight text-white/95 mt-0.5">
                  {domain}
                </p>
              </div>
            </div>

            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-lg">
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Floating Domain Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md border border-white/15 z-20">
          <img 
            src={faviconUrl} 
            alt="" 
            className="w-4 h-4 rounded-sm shrink-0" 
            onError={(e) => ((e.currentTarget as HTMLElement).style.display = 'none')} 
          />
          <span className="capitalize">{siteBadge}</span>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-4 flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Link2 className="w-4.5 h-4.5" />
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
          Buka Tautan <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </a>
  );
};

export default LinkPreviewCard;
