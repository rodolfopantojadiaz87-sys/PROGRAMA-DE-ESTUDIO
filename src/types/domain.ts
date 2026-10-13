export type ContentStatus = "draft" | "prepared" | "preached" | "archived";
export type ContentVisibility = "projectable" | "private";
export type UserRole = "owner" | "editor" | "viewer";
export type SeriesStatus = "preparation" | "active" | "finished";

export interface OwnedEntity {
  id: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser extends OwnedEntity {
  email: string;
  displayName: string;
  role: UserRole;
}

export interface ContentBlock {
  id: string;
  title: string;
  bibleReference: string;
  explanation: string;
  observation: string;
  illustration: string;
  application: string;
  additionalReferences: string[];
  privateNote: string;
  visibility: ContentVisibility;
  order: number;
}

export interface Sermon extends OwnedEntity {
  title: string;
  mainBibleReference: string;
  topic: string;
  seriesId: string | null;
  seriesIds?: string[];
  date: string | null;
  author: string;
  status: ContentStatus;
  centralIdea: string;
  preachingObjective: string;
  introduction: string;
  historicalContext: string;
  literaryContext: string;
  biblicalContext: string;
  passageStructure: string;
  development: string;
  conclusion: string;
  finalChallenge: string;
  sections: ContentBlock[];
  privateFields: string[];
  tagIds: string[];
}

export interface StudyQuestion {
  id: string;
  question: string;
  answer: string;
  application: string;
  order: number;
  visibility: ContentVisibility;
}

export interface BibleStudy extends OwnedEntity {
  title: string;
  mainBibleReference: string;
  objective: string;
  introduction: string;
  context: string;
  observation: string;
  interpretation: string;
  explanation: string;
  questions: StudyQuestion[];
  applications: string;
  discussion: string;
  conclusion: string;
  personalReflection: string;
  weeklyAssignment: string;
  status: ContentStatus;
  seriesId: string | null;
  privateFields: string[];
  tagIds: string[];
}

export interface Series extends OwnedEntity {
  name: string;
  description: string;
  topic: string;
  mainBibleReference: string;
  status: SeriesStatus;
  imagePath: string | null;
  startsOn: string | null;
  endsOn: string | null;
  items: SeriesItem[];
}

export interface SeriesItem extends OwnedEntity {
  seriesId: string;
  contentId: string;
  contentType: "sermon" | "study";
  order: number;
}

export interface Tag extends OwnedEntity {
  name: string;
}

export interface BibleReference extends OwnedEntity {
  reference: string;
  notes: string;
  tagIds: string[];
}

export interface LibraryItem extends OwnedEntity {
  type: "sermon" | "study" | "series" | "illustration" | "application" | "note";
  contentId: string | null;
  title: string;
  body: string;
  tagIds: string[];
}

export interface PresentationSettings extends OwnedEntity {
  background: "dark" | "light" | "custom";
  fontFamily: string;
  fontSize: number;
  customBackground: string | null;
}
