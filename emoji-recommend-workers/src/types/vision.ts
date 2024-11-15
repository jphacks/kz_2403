interface VisionRequestImage {
  content: string;
}

interface VisionFeature {
  type: 'LABEL_DETECTION' | 'SAFE_SEARCH_DETECTION' | 'IMAGE_PROPERTIES';
  maxResults?: number;
}

interface VisionRequest {
  image: VisionRequestImage;
  features: VisionFeature[];
}

interface VisionAnnotation {
  description: string;
  score: number;
  topicality?: number;
}

interface VisionResponse {
  labelAnnotations?: VisionAnnotation[];
  safeSearchAnnotation?: {
    adult: string;
    violence: string;
    spoof: string;
    medical: string;
    racy: string;
  };
  textAnnotations?: VisionAnnotation[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  fullTextAnnotation: { pages: any[], text: string };
}
