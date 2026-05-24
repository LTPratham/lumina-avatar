/**
 * LuminaAvatar Loader Snippet
 * Copy and paste this snippet into the HTML body or header to load the avatar widget.
 */
export const getLoaderSnippet = (projectId: string, cdnUrl: string = 'https://cdn.jsdelivr.net/npm/lumina-avatar@latest/dist/lumina-avatar.js'): string => {
  return `
<script>
  (function(w,d,s,o,f,js,fjs){
    w['LuminaAvatarObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)},w[o].l=1*new Date();
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','LuminaAvatar','${cdnUrl}'));

  LuminaAvatar('init', {
    projectId: '${projectId}'
  });
</script>
  `.trim();
};

/**
 * Programmatic loader helper for SPA applications (React, Vue, Preact, etc.).
 */
export const loadLuminaAvatar = (projectId: string, options: any = {}, cdnUrl: string = 'https://cdn.jsdelivr.net/npm/lumina-avatar@latest/dist/lumina-avatar.js') => {
  if (typeof window === 'undefined') return;

  const globalName = 'LuminaAvatar';
  (window as any).LuminaAvatarObject = globalName;
  (window as any)[globalName] = (window as any)[globalName] || function() {
    ((window as any)[globalName].q = (window as any)[globalName].q || []).push(arguments);
  };
  (window as any)[globalName].l = 1 * (new Date() as any);

  // Check if script is already added
  if (document.getElementById(globalName)) {
    (window as any)[globalName]('init', { projectId, ...options });
    return;
  }

  const js = document.createElement('script');
  js.id = globalName;
  js.src = cdnUrl;
  js.async = true;
  const fjs = document.getElementsByTagName('script')[0];
  if (fjs && fjs.parentNode) {
    fjs.parentNode.insertBefore(js, fjs);
  } else {
    document.head.appendChild(js);
  }

  (window as any)[globalName]('init', { projectId, ...options });
};
