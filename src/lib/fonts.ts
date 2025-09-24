// YOL: src/lib/fonts.ts

import {
  Inter,
  Bebas_Neue,
  Roboto_Slab,
  Source_Code_Pro,
  Playfair_Display,
  Bungee,
  Exo_2,
  Permanent_Marker
} from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas-neue'
});

export const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  variable: '--font-roboto-slab'
});

export const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro'
});

export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display'
});

export const bungee = Bungee({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bungee'
});

export const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2'
});

export const permanentMarker = Permanent_Marker({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-permanent-marker'
});

export const availableFonts = [
    { id: 'inter', name: 'Inter (Varsayılan)', variable: inter.variable },
    { id: 'bebas_neue', name: 'Bebas Neue (Başlık)', variable: bebasNeue.variable },
    { id: 'roboto_slab', name: 'Roboto Slab (Serifli)', variable: robotoSlab.variable },
    { id: 'source_code_pro', name: 'Source Code Pro (Kod)', variable: sourceCodePro.variable },
    { id: 'playfair_display', name: 'Playfair Display (Şık)', variable: playfairDisplay.variable },
    { id: 'bungee', name: 'Bungee (Display)', variable: bungee.variable },
    { id: 'exo2', name: 'Exo 2 (Modern)', variable: exo2.variable },
    { id: 'permanent_marker', name: 'Permanent Marker (El Yazısı)', variable: permanentMarker.variable },
];