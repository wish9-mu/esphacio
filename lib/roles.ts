export const roleLabels = {
  renter: 'Tenant',
  host: 'Landlord',
  admin: 'Admin',
} as const;

export type AppRole = keyof typeof roleLabels;
export type LandlordStatus = 'none' | 'phone_unverified' | 'pending_review' | 'approved' | 'rejected';
