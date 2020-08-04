/////////////////////////////////////////
// Custom monaco editor fonts manager  //
/////////////////////////////////////////

const loadedFonts = new Set<string>();

/**
 * Default system monospace font
 */
export const DEFAULT_FONT = 'default';

export const fallbackFonts = [
    'Menlo',
    'Monaco',
    'Consolas',
    `"Lucida Console"`,
    `"Roboto Mono"`,
    `"Courier New"`,
    'monospace'
].join(',');

interface FontDeclaration {
    label: string;
    family: string;
    fonts: {
        src: {url: string, format?: 'opentype' | 'embedded-opentype' | 'woff' | 'truetype' | 'svg' }[],
        weight?: 'normal' | 'bold' | 'light' | number,
        style?: 'normal' | 'italic'
    }[];
}

/**
 * List of available fonts
 */
const fontsList: {[label: string]: FontDeclaration} = {
    'CascadiaCode': {
        label: 'Cascadia Code',
        family: 'CascadiaCode',
        fonts: [
            {
                src: [{url: '/fonts/CascadiaCode.ttf', format: 'truetype'}]
            }
        ]
    },
    'CascadiaCode-PL': {
        label: 'Cascadia Code (with Powerline)',
        family: 'CascadiaCode-PL',
        fonts: [
            {
                src: [{url: '/fonts/CascadiaCodePL.ttf', format: 'truetype'}]
            }
        ]
    },
    'CascadiaMono': {
        label: 'Cascadia Mono',
        family: 'CascadiaMono',
        fonts: [
            {
                src: [{url: '/fonts/CascadiaMono.ttf', format: 'truetype'}]
            }
        ]
    },
    'CascadiaMono-PL': {
        label: 'Cascadia Mono (with Powerline)',
        family: 'CascadiaMono',
        fonts: [
            {
                src: [{url: '/fonts/CascadiaMonoPL.ttf', format: 'truetype'}]
            }
        ]
    },
    'JetBrains-Mono': {
        label: 'JetBrains Mono',
        family: 'JetBrains-Mono',
        fonts: [
            {
                src: [{url: '/fonts/JetBrainsMono-Regular.ttf', format: 'truetype'}],
                weight: 'normal',
            },
            {
                src: [{url: '/fonts/JetBrainsMono-Medium.ttf', format: 'truetype'}],
                weight: 500,
            },
            {
                src: [{url: '/fonts/JetBrainsMono-Bold.ttf', format: 'truetype'}],
                weight: 'bold',
            }
        ]
    },
}

/**
 * Returns default monospace font style
 */
export const getDefaultFontFamily = () => fallbackFonts;

/**
 * Loads additional font on page
 * @param fontName font name
 */
export function loadFont(fontName: string) {
    let font = fontsList[fontName];
    if (!font || loadedFonts.has(fontName)) return;
    console.log('Loading font "%s"...', font.label);
    let elem = document.createElement('style');
    elem.id = `font-${fontName}`;
    elem.innerText = fontToStyle(font);
    document.head.appendChild(elem);
    loadedFonts.add(fontName);
}

/**
 * Loads font and returns font-family value for font in CSS
 *
 * If font is not known, default system monospace font returned.
 * @param fontName font name
 */
export function getFontFamily(fontName: string): string {
    if (fontName === DEFAULT_FONT) return fallbackFonts;
    let font = fontsList[fontName];
    if (!font) {
        console.warn('getFontFamily: unknown font "%s", fallback monospace font used', fontName);
        return fallbackFonts;
    }

    loadFont(fontName);
    return `${font.family},${fallbackFonts}`;
}

/**
 * Returns list of available additional fonts
 */
export const getAvailableFonts = () => Object.keys(fontsList).map(family => ({
    family, label: fontsList[family].label
}))

function fontToStyle(decl: FontDeclaration): string {
    const { family, fonts } = decl;
    return fonts.map(f => `@font-face {
        font-family: "${family}";
        src: ${f.src.map(src => fontSourceToCSS(src.url, src.format)).join(', ')};
        ${fontStyleToCSS(f.weight, f.style)}
    }`).join('\n');
}

const fontStyleToCSS = (weight?: string|number, style?: string) => {
    if (!weight && !style) return;
    let out: string[] = [];
    if (weight) out.push(`font-weight: ${weight}`);
    if (style) out.push(`font-style: ${style}`);
    return out.join('; ');
};

const fontSourceToCSS = (url: string, format?: string) =>
    format?.length ? `url("${url}") format("${format}")` : `url("${url}")`;