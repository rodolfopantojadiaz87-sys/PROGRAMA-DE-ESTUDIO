import type { BibleStudy, Sermon, Series } from "../types/domain";

export interface ContentRepository {
  listSermons(): Promise<Sermon[]>;
  getSermon(id: string): Promise<Sermon | null>;
  saveSermon(sermon: Sermon): Promise<Sermon>;
  deleteSermon(id: string): Promise<void>;
  listStudies(): Promise<BibleStudy[]>;
  getStudy(id: string): Promise<BibleStudy | null>;
  saveStudy(study: BibleStudy): Promise<BibleStudy>;
  deleteStudy(id: string): Promise<void>;
  listSeries(): Promise<Series[]>;
  saveSeries(series: Series): Promise<Series>;
  deleteSeries(id: string): Promise<void>;
}
