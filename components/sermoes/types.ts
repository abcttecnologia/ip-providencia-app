export interface SermonVideo {
  id: string;
  snippet: {
    title: string;
    publishedAt?: string;
    thumbnails?: {
      maxres?: { url: string };
      high?: { url: string };
      medium?: { url: string };
    };
    resourceId?: { videoId?: string };
  };
  contentDetails?: {
    duration?: string;
  };
}

export interface SermonSeries {
  id: string;
  titulo: string;
  videos: SermonVideo[];
}
