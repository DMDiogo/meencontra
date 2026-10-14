// Imagens e padrões visuais do Me Encontra.
// Tudo aqui é SVG gerado em código: não depende de internet nem de ficheiros externos.

const toUri = (svg: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
  
  // Padrão geométrico de losangos (inspirado nos padrões têxteis angolanos).
  // Usa-se como textura sobre fundos verdes (Footer, Preloader, hero).
  export const PATTERN_LIGHT = toUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <g fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="2">
      <path d="M32 4 60 32 32 60 4 32Z"/>
      <path d="M32 18 46 32 32 46 18 32Z"/>
    </g>
    <circle cx="32" cy="32" r="3" fill="#fff" fill-opacity=".16"/>
  </svg>`);
  
  // Imagem de reserva quando a empresa não tem foto (ou a foto falha a carregar).
  export const PLACEHOLDER_PHOTO = toUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#00a859"/>
        <stop offset="1" stop-color="#007f3b"/>
      </linearGradient>
      <pattern id="p" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M32 4 60 32 32 60 4 32Z" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="2"/>
      </pattern>
    </defs>
    <rect width="800" height="520" fill="url(#g)"/>
    <rect width="800" height="520" fill="url(#p)"/>
    <g transform="translate(330 170)" fill="none" stroke="#fff" stroke-opacity=".9"
       stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 70 34 12h92l24 58"/>
      <path d="M10 70h140v96H10z"/>
      <path d="M62 166v-52h36v52"/>
    </g>
  </svg>`);
  
  // Usar em <img onError={onImgError} />
  export function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = PLACEHOLDER_PHOTO;
  }