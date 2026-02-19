export type ManagedPerson = {
  id: string;
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
