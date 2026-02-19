export type ManagedPerson = {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  legacyId: number | null;
  name: string;
  email: string;
  title: string;
  role: string;
  department: string;
  mobile: string;
  notes: string;
  activationToken?: string | null;
  activationExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PeopleListResponse = {
  items: ManagedPerson[];
  total: number;
  page: number;
  pageSize: number;
};
