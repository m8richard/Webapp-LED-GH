export interface FontConfig {
  name: string
  displayName: string
  url: string
  format: 'truetype' | 'opentype'
}

export const AVAILABLE_FONTS: FontConfig[] = [
  {
    name: 'HelveticaBoldExtended',
    displayName: 'Helvetica Bold Extended (Default)',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/livedata-overlay/HelveticaNeue-BlackExt.otf',
    format: 'opentype'
  },
  {
    name: 'HelveticaNeue',
    displayName: 'Helvetica Neue',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/livedata-overlay/HelveticaNeueBold.ttf',
    format: 'truetype'
  },
  {
    name: 'TuskerGrotesk',
    displayName: 'Tusker Grotesk',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/livedata-overlay/Tusker-Grotesk.ttf',
    format: 'truetype'
  },
  {
    name: 'FrizQuadrata',
    displayName: 'Friz Quadrata Regular',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Friz%20Quadrata%20Regular.ttf',
    format: 'truetype'
  },
  {
    name: 'HelveticaLTStdExtraComp',
    displayName: 'Helvetica LT Std Extra Compressed',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Helvetica%20LT%20Std%20Extra%20Comp%20(1).otf',
    format: 'opentype'
  },
  {
    name: 'HelveticaNeueBlackCondensed',
    displayName: 'Helvetica Neue Black Condensed',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Helvetica%20Neue%20Black%20Condensed%20(1).otf',
    format: 'opentype'
  },
  {
    name: 'HelveticaNeueBoldExtended',
    displayName: 'Helvetica Neue Bold Extended',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Helvetica%20Neue%20Bold%20Extended.otf',
    format: 'opentype'
  },
  {
    name: 'HelveticaNeueBold',
    displayName: 'Helvetica Neue Bold',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Helvetica%20Neue%20Bold%20Font%20(2).otf',
    format: 'opentype'
  },
  {
    name: 'HelveticaNeueBoldItalic',
    displayName: 'Helvetica Neue Bold Italic',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Helvetica%20Neue%20Bold%20Italic%20(1).otf',
    format: 'opentype'
  },
  {
    name: 'HelveticaNeueLTStdCnO',
    displayName: 'Helvetica Neue LT Std Condensed Oblique',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Helvetica%20Neue%20LT%20Std%20CnO%20(1).otf',
    format: 'opentype'
  },
  {
    name: 'HelveticaNeueLTStdMedium',
    displayName: 'Helvetica Neue LT Std Medium',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Helvetica%20Neue%20LT%20Std%20Medium%20(1).otf',
    format: 'opentype'
  },
  {
    name: 'HelveticaNeueMediumCondensed',
    displayName: 'Helvetica Neue Medium Condensed',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Helvetica%20Neue%20Medium%20Condensed%20(1).otf',
    format: 'opentype'
  },
  {
    name: 'Romanesco',
    displayName: 'Romanesco Regular',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Romanesco%20Regular%20Font%20(1).ttf',
    format: 'truetype'
  },
  {
    name: '10PixelBold',
    displayName: '10Pixel Bold',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Other/10Pixel-Bold.otf',
    format: 'opentype'
  },
  {
    name: 'VCR_OSD_MONO',
    displayName: 'VCR OSD Mono',
    url: 'https://gmrxbbhhyyrtmsftofdp.supabase.co/storage/v1/object/public/gentle-mates-assets/5-%20Fonts/Other/VCR_OSD_MONO_1.001.ttf',
    format: 'truetype'
  }
]

export const loadFont = (fontConfig: FontConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fontFace = new FontFace(
      fontConfig.name,
      `url('${fontConfig.url}')`,
      { display: 'swap' }
    )
    
    fontFace.load()
      .then(() => {
        document.fonts.add(fontFace)
        resolve()
      })
      .catch(reject)
  })
}

export const loadAllFonts = async (): Promise<void> => {
  try {
    await Promise.all(AVAILABLE_FONTS.map(font => loadFont(font)))
    console.log('All fonts loaded successfully')
  } catch (error) {
    console.error('Error loading fonts:', error)
  }
}

export const getFontFamily = (fontName?: string): string => {
  const selectedFont = AVAILABLE_FONTS.find(font => font.name === fontName)
  if (selectedFont) {
    return `'${selectedFont.name}', 'HelveticaBoldExtended', 'HelveticaNeue', Arial, sans-serif`
  }
  return `'HelveticaBoldExtended', 'HelveticaNeue', Arial, sans-serif`
}