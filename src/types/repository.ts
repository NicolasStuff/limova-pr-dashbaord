export interface Repository {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  isActive: boolean;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRepositoryInput {
  owner: string;
  name: string;
  defaultBranch?: string;
}
