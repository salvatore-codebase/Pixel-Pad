export type Mode = 'menu' | 'creative' | 'junior';

export type ToolCreative = 'pen' | 'eraser' | 'blotch' | 'fill' | 'eyedropper' | 'line' | 'hand' | 'airbrush' | 'watercolor';
export type ToolJunior = 'pen' | 'eraser' | 'fill' | 'stamp' | 'star' | 'circle' | 'square' | 'rainbow' | 'hand';

export interface PixelGrid {
  width: number;
  height: number;
  data: string[]; // flat array of hex colors or '' for transparent
}

export interface CustomPalette {
  colors: string[]; // 20 slots
}

export interface Project {
  id: string;
  name: string;
  mode: 'creative' | 'junior';
  grid: PixelGrid;
  palette: CustomPalette;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // base64 data URL
}

export interface HistoryEntry {
  data: string[];
}

export interface StampShape {
  id: string;
  name: string;
  icon: string;
  pixels: Array<{ x: number; y: number; color: string }>;
  width: number;
  height: number;
}

export const CANVAS_WIDTH = 32;
export const CANVAS_HEIGHT = 32;
export const CREATIVE_CANVAS_WIDTH = 320;
export const CREATIVE_CANVAS_HEIGHT = 180;
export const JUNIOR_CANVAS_WIDTH = 128;
export const JUNIOR_CANVAS_HEIGHT = 128;
export const MAX_HISTORY = 10;
export const MAX_PROJECTS = 32;
export const GALLERY_PER_PAGE = 18;
export const CREATIVE_MAX_ZOOM = 16;
export const JUNIOR_MAX_ZOOM = 10;
export const MIN_ZOOM = 1;

export const DEFAULT_CREATIVE_PALETTE: string[] = [
  '#FF0000', '#FF6600', '#FFFF00', '#00FF00', '#00FFFF',
  '#0000FF', '#FF00FF', '#FF69B4', '#8B4513', '#FFA500',
  '#800080', '#008000', '#000080', '#808080', '#C0C0C0',
  '#FFFFFF', '#FFD700', '#FF4500', '#32CD32', '#00CED1',
  '#DC143C', '#FF7F50', '#4169E1', '#228B22', '#EE82EE',
  '#000000', '#A52A2A', '#20B2AA', '#FF6347', '#F5F5DC',
];

export const FULL_SPECTRUM_COLORS = [
  '#000000','#111111','#222222','#333333','#444444','#555555','#666666','#777777',
  '#888888','#999999','#AAAAAA','#BBBBBB','#CCCCCC','#DDDDDD','#EEEEEE','#FFFFFF',
  '#FF0000','#FF1100','#FF2200','#FF3300','#FF4400','#FF5500','#FF6600','#FF7700',
  '#FF8800','#FF9900','#FFAA00','#FFBB00','#FFCC00','#FFDD00','#FFEE00','#FFFF00',
  '#EEFF00','#DDFF00','#CCFF00','#BBFF00','#AAFF00','#99FF00','#88FF00','#77FF00',
  '#66FF00','#55FF00','#44FF00','#33FF00','#22FF00','#11FF00','#00FF00','#00FF11',
  '#00FF22','#00FF33','#00FF44','#00FF55','#00FF66','#00FF77','#00FF88','#00FF99',
  '#00FFAA','#00FFBB','#00FFCC','#00FFDD','#00FFEE','#00FFFF','#00EEFF','#00DDFF',
  '#00CCFF','#00BBFF','#00AAFF','#0099FF','#0088FF','#0077FF','#0066FF','#0055FF',
  '#0044FF','#0033FF','#0022FF','#0011FF','#0000FF','#1100FF','#2200FF','#3300FF',
  '#4400FF','#5500FF','#6600FF','#7700FF','#8800FF','#9900FF','#AA00FF','#BB00FF',
  '#CC00FF','#DD00FF','#EE00FF','#FF00FF','#FF00EE','#FF00DD','#FF00CC','#FF00BB',
  '#FF00AA','#FF0099','#FF0088','#FF0077','#FF0066','#FF0055','#FF0044','#FF0033',
  '#FF0022','#FF0011',
  // Browns, skin tones, pastels
  '#8B4513','#A0522D','#CD853F','#DEB887','#F5DEB3','#FFF8DC',
  '#FFB6C1','#FF69B4','#FF1493','#C71585','#DB7093','#FFC0CB',
  '#E6E6FA','#D8BFD8','#DDA0DD','#EE82EE','#DA70D6','#BA55D3',
  '#9370DB','#8A2BE2','#4B0082','#800080','#9932CC','#9400D3',
  '#20B2AA','#2E8B57','#006400','#228B22','#90EE90','#98FB98',
];

export const JUNIOR_COLORS = [
  '#FF0000','#FF6600','#FF9900','#FFFF00',
  '#00CC00','#00CCFF','#0066FF','#9900FF',
  '#FF00CC','#FF69B4','#8B4513','#FF4500',
  '#00FF88','#00FFFF','#FFD700','#FFFFFF',
  '#000000','#666666','#BBBBBB','#FF1493',
];
