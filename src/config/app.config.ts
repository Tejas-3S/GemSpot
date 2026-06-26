export const APP_CONFIG = {
  // Add your actual Gmail here
  adminEmails: ["your@gmail.com"],

  // App info
  appName: "GemSpot",
  appTagline: "Real places. Real locals. Real tips.",

  // Gem settings
  verifiedRatingThreshold: 5,
  discovererMilestones: [5, 20, 45, 95],

  // Pagination
  gemsPerPage: 10,
  searchLimit: 100,
};

export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return APP_CONFIG.adminEmails.includes(email);
};