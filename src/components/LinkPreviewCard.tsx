import React, { useState, useEffect } from 'react';
import { ExternalLink, Play, Link2, Globe } from 'lucide-react';

interface LinkPreviewCardProps {
  url: string;
  className?: string;
}

interface OGData {
  title?: string;
  description?: string;
  image?: string;
  logo?: string;
  publisher?: string;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, className = '' }) => {
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);
  const [screenshotIndex, setScreenshotIndex] = useState(0);

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

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setImgFailed(false);
    setScreenshotIndex(0);

    if (youtubeId) {
      setOgData({
        title: 'YouTube Video',
        image: `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`,
        publisher: 'YouTube'
      });
      setLoading(false);
      return;
    }

    if (isImage) {
      setOgData({
        title: domain,
        image: formattedUrl
      });
      setLoading(false);
      return;
    }

    // Fast Open Graph Metadata Fetcher (bypassing edge cache with ttl=0&force=true to fetch newly deployed og:image)
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(formattedUrl)}&ttl=0&force=true`)
      .then((res) => res.json())
      .then(async (json) => {
        if (!isMounted) return;
        let foundTitle = json.data?.title;
        let foundDesc = json.data?.description;
        let foundImg = json.data?.image?.url;
        let foundLogo = json.data?.logo?.url;

        // Fallback: If Microlink didn't find og:image or returned generic title, fetch HTML directly to resolve relative image URLs (e.g. /og-image.png)
        if (!foundImg || !foundTitle || foundTitle.includes('Google AI Studio')) {
          try {
            const htmlRes = await fetch(formattedUrl);
            if (htmlRes.ok) {
              const htmlText = await htmlRes.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlText, 'text/html');

              const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                            doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
              const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                              doc.querySelector('title')?.textContent;
              const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                             doc.querySelector('meta[name="description"]')?.getAttribute('content');

              if (ogImg) {
                // Convert relative URL (like /og-image.png) to absolute URL
                try {
                  foundImg = new URL(ogImg, formattedUrl).href;
                } catch {
                  foundImg = ogImg;
                }
              }
              if (ogTitle) foundTitle = ogTitle;
              if (ogDesc) foundDesc = ogDesc;
            }
          } catch (e) {
            console.warn('[LinkPreviewCard] Direct HTML DOM parser fallback:', e);
          }
        }

        if (isMounted) {
          setOgData({
            title: foundTitle || domain,
            description: foundDesc || formattedUrl,
            image: foundImg,
            logo: foundLogo,
            publisher: json.data?.publisher
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch OG metadata:', err);
        if (isMounted) setOgData({ title: domain });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formattedUrl, youtubeId, isImage, domain]);

  const displayImage = (ogData?.image && !imgFailed) ? ogData.image : null;

  return (
    <a
      href={formattedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/15 transition-all duration-300 ${className}`}
    >
      {/* 16:9 Banner Container */}
      <div className="relative w-full aspect-[16/9] bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-100">
        {loading ? (
          /* Sleek Pulse Skeleton */
          <div className="absolute inset-0 bg-slate-800/90 flex flex-col items-center justify-center p-4 text-center animate-pulse">
            <Globe className="w-8 h-8 text-indigo-400/60 mb-2 animate-bounce" />
            <p className="text-xs font-semibold text-slate-300">Memuat pratinjau tautan...</p>
            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">{domain}</p>
          </div>
        ) : displayImage ? (
          <>
            <img
              src={displayImage}
              alt={ogData?.title || 'Web Preview'}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {youtubeId && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-colors z-10">
                <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Rich Brand Banner (16:9 Ratio - Notion/Slack Style) */
          <div className={`w-full h-full bg-gradient-to-br ${getBannerGradient()} p-6 flex items-center justify-between relative overflow-hidden`}>
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-xl">
                <img 
                  src={ogData?.logo || faviconUrl} 
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
                <p className="text-base font-extrabold truncate tracking-tight text-white/95 mt-0.5 max-w-[260px]">
                  {ogData?.title || domain}
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
            src={ogData?.logo || faviconUrl} 
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
              {ogData?.title || domain}
            </p>
            <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
              {ogData?.description || formattedUrl}
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
