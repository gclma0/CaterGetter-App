import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'bn';

export interface Translations {
  // Landing
  welcomeTo: string;
  hello: string;
  foodie: string;
  appTagline: string;
  signIn: string;
  signUp: string;
  downloadForAndroid: string;
  scanToDownload: string;
  getBestExperience: string;

  // Login
  yourFavouriteCaterers: string;
  welcomeBack: string;
  signInToContinue: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  orDivider: string;
  noAccount: string;
  createOne: string;
  loginFailed: string;
  emailRequired: string;
  enterValidEmail: string;
  passwordRequired: string;

  // Register
  createAccount: string;
  step1of2: string;
  customer: string;
  caterer: string;
  browseAndBook: string;
  manageAndSell: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  minChars: string;
  passwordsNoMatch: string;
  alreadyHaveAccount: string;
  nextArrow: string;
  atLeast6Chars: string;

  // Register Details
  businessDetails: string;
  yourDetails: string;
  step2of2: string;
  fullName: string;
  fullNamePlaceholder: string;
  phoneNumber: string;
  phonePlaceholder: string;
  businessName: string;
  businessNamePlaceholder: string;
  cuisineTypes: string;
  eventCategories: string;
  fullNameRequired: string;
  phoneRequired: string;
  businessNameRequired: string;
  registrationFailed: string;

  // Customer Home
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  searchPlaceholder: string;
  topRated: string;
  allCaterers: string;
  found: string;
  noCaterersFound: string;
  tryAdjusting: string;
  clearFilters: string;
  filterAndSort: string;
  sortBy: string;
  topRatedSort: string;
  newest: string;
  location: string;
  minimumRating: string;
  any: string;
  reset: string;
  applyFilters: string;

  // Customer Cart/Bookings
  myBookings: string;
  noBookings: string;
  noBookingsSubtext: string;
  browseCaterers: string;
  pending: string;
  confirmed: string;
  cancelled: string;
  completed: string;
  eventDate: string;
  guests: string;
  total: string;
  cancelBooking: string;
  cancelConfirm: string;
  keepBooking: string;

  // Checkout
  checkout: string;
  orderSummary: string;
  eventDetails: string;
  specialRequests: string;
  specialRequestsPlaceholder: string;
  placeOrder: string;
  confirmOrder: string;
  processingOrder: string;

  // Profile (shared)
  profile: string;
  myProfile: string;
  editProfile: string;
  save: string;
  cancel: string;
  signOut: string;
  signOutConfirm: string;
  fullNameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  businessLabel: string;
  descriptionLabel: string;
  locationLabel: string;
  approved: string;
  pendingApproval: string;
  error: string;
  saveFailed: string;

  // Vendor Dashboard
  dashboard: string;
  menu: string;
  bookings: string;
  totalBookings: string;
  pendingBookings: string;
  confirmedBookings: string;
  totalRevenue: string;
  recentBookings: string;
  noRecentBookings: string;
  viewAll: string;

  // Vendor Menu
  addItem: string;
  addPackage: string;
  menuItems: string;
  packages: string;
  itemName: string;
  itemDescription: string;
  price: string;
  guestCount: string;
  category: string;
  image: string;
  deleteItem: string;
  deleteConfirm: string;
  delete: string;

  // Vendor Bookings
  allBookings: string;
  accept: string;
  reject: string;
  noBookingsVendor: string;

  // Tab labels
  tabHome: string;
  tabBookings: string;
  tabProfile: string;
  tabDashboard: string;
  tabMenu: string;
}

const en: Translations = {
  // Landing
  welcomeTo: 'Welcome to',
  hello: 'Hello',
  foodie: 'Foodie',
  appTagline: 'Planned an event but wondering about cater? Get the caters of your choice here!',
  signIn: 'Sign In',
  signUp: 'Sign Up',
  downloadForAndroid: 'Download CaterGetter for Android',
  scanToDownload: 'Scan to download on your phone',
  getBestExperience: 'Get the best experience from the app!',

  // Login
  yourFavouriteCaterers: 'Your favourite caterers, one tap away',
  welcomeBack: 'Welcome back',
  signInToContinue: 'Sign in to continue',
  email: 'Email',
  emailPlaceholder: 'you@example.com',
  password: 'Password',
  passwordPlaceholder: 'Your password',
  orDivider: 'or',
  noAccount: "Don't have an account?",
  createOne: 'Create one',
  loginFailed: 'Login Failed',
  emailRequired: 'Email is required',
  enterValidEmail: 'Enter a valid email',
  passwordRequired: 'Password is required',

  // Register
  createAccount: 'Create Account',
  step1of2: 'Step 1 of 2 — Account details',
  customer: 'Customer',
  caterer: 'Caterer',
  browseAndBook: 'Browse & book',
  manageAndSell: 'Manage & sell',
  confirmPassword: 'Confirm Password',
  confirmPasswordPlaceholder: 'Repeat your password',
  minChars: 'Min. 6 characters',
  passwordsNoMatch: 'Passwords do not match',
  alreadyHaveAccount: 'Already have an account?',
  nextArrow: 'Next →',
  atLeast6Chars: 'At least 6 characters',

  // Register Details
  businessDetails: 'Business Details',
  yourDetails: 'Your Details',
  step2of2: 'Step 2 of 2 — Personal info',
  fullName: 'Full Name',
  fullNamePlaceholder: 'John Doe',
  phoneNumber: 'Phone Number',
  phonePlaceholder: '+880 1XXX XXXXXX',
  businessName: 'Business Name',
  businessNamePlaceholder: 'e.g. Spice Garden Catering',
  cuisineTypes: 'Cuisine Types',
  eventCategories: 'Event Categories',
  fullNameRequired: 'Full name is required',
  phoneRequired: 'Phone number is required',
  businessNameRequired: 'Business name is required',
  registrationFailed: 'Registration Failed',

  // Customer Home
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
  searchPlaceholder: 'Search caterers, cuisines, location...',
  topRated: '⭐ Top Rated',
  allCaterers: 'All Caterers',
  found: 'found',
  noCaterersFound: 'No caterers found',
  tryAdjusting: 'Try adjusting your search or filters',
  clearFilters: 'Clear Filters',
  filterAndSort: 'Filter & Sort',
  sortBy: 'Sort By',
  topRatedSort: 'Top Rated',
  newest: 'Newest',
  location: 'Location',
  minimumRating: 'Minimum Rating',
  any: 'Any',
  reset: 'Reset',
  applyFilters: 'Apply Filters',

  // Customer Cart/Bookings
  myBookings: 'My Bookings',
  noBookings: 'No bookings yet',
  noBookingsSubtext: 'Your confirmed catering bookings will appear here',
  browseCaterers: 'Browse Caterers',
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  eventDate: 'Event Date',
  guests: 'Guests',
  total: 'Total',
  cancelBooking: 'Cancel Booking',
  cancelConfirm: 'Are you sure you want to cancel this booking?',
  keepBooking: 'Keep Booking',

  // Checkout
  checkout: 'Checkout',
  orderSummary: 'Order Summary',
  eventDetails: 'Event Details',
  specialRequests: 'Special Requests',
  specialRequestsPlaceholder: 'Any dietary requirements or special notes...',
  placeOrder: 'Place Order',
  confirmOrder: 'Confirm Order',
  processingOrder: 'Processing...',

  // Profile (shared)
  profile: 'Profile',
  myProfile: 'My Profile',
  editProfile: 'Edit Profile',
  save: 'Save',
  cancel: 'Cancel',
  signOut: 'Sign Out',
  signOutConfirm: 'Are you sure you want to sign out?',
  fullNameLabel: 'Full Name',
  phoneLabel: 'Phone',
  emailLabel: 'Email',
  businessLabel: 'Business',
  descriptionLabel: 'Description',
  locationLabel: 'Location',
  approved: 'Approved',
  pendingApproval: 'Pending Approval',
  error: 'Error',
  saveFailed: 'Save Failed',

  // Vendor Dashboard
  dashboard: 'Dashboard',
  menu: 'Menu',
  bookings: 'Bookings',
  totalBookings: 'Total Bookings',
  pendingBookings: 'Pending',
  confirmedBookings: 'Confirmed',
  totalRevenue: 'Total Revenue',
  recentBookings: 'Recent Bookings',
  noRecentBookings: 'No recent bookings',
  viewAll: 'View All',

  // Vendor Menu
  addItem: 'Add Item',
  addPackage: 'Add Package',
  menuItems: 'Menu Items',
  packages: 'Packages',
  itemName: 'Item Name',
  itemDescription: 'Description',
  price: 'Price',
  guestCount: 'Guest Count',
  category: 'Category',
  image: 'Image',
  deleteItem: 'Delete Item',
  deleteConfirm: 'Are you sure you want to delete this item?',
  delete: 'Delete',

  // Vendor Bookings
  allBookings: 'All Bookings',
  accept: 'Accept',
  reject: 'Reject',
  noBookingsVendor: 'No bookings yet',

  // Tab labels
  tabHome: 'Home',
  tabBookings: 'My Bookings',
  tabProfile: 'Profile',
  tabDashboard: 'Dashboard',
  tabMenu: 'Menu',
};

const bn: Translations = {
  // Landing
  welcomeTo: 'স্বাগতম',
  hello: 'হ্যালো',
  foodie: 'বন্ধু',
  appTagline: 'ইভেন্ট পরিকল্পনা করেছেন কিন্তু ক্যাটারিং নিয়ে চিন্তিত? এখানে আপনার পছন্দের ক্যাটারার খুঁজুন!',
  signIn: 'সাইন ইন',
  signUp: 'সাইন আপ',
  downloadForAndroid: 'অ্যান্ড্রয়েডে CaterGetter ডাউনলোড করুন',
  scanToDownload: 'ফোনে ডাউনলোড করতে স্ক্যান করুন',
  getBestExperience: 'অ্যাপ থেকে সেরা অভিজ্ঞতা নিন!',

  // Login
  yourFavouriteCaterers: 'আপনার প্রিয় ক্যাটারার, মাত্র এক ট্যাপেই',
  welcomeBack: 'আবার স্বাগতম',
  signInToContinue: 'চালিয়ে যেতে সাইন ইন করুন',
  email: 'ইমেইল',
  emailPlaceholder: 'আপনার@ইমেইল.কম',
  password: 'পাসওয়ার্ড',
  passwordPlaceholder: 'আপনার পাসওয়ার্ড',
  orDivider: 'অথবা',
  noAccount: 'অ্যাকাউন্ট নেই?',
  createOne: 'তৈরি করুন',
  loginFailed: 'লগইন ব্যর্থ হয়েছে',
  emailRequired: 'ইমেইল প্রয়োজন',
  enterValidEmail: 'সঠিক ইমেইল দিন',
  passwordRequired: 'পাসওয়ার্ড প্রয়োজন',

  // Register
  createAccount: 'অ্যাকাউন্ট তৈরি করুন',
  step1of2: 'ধাপ ১ এর ২ — অ্যাকাউন্ট তথ্য',
  customer: 'গ্রাহক',
  caterer: 'ক্যাটারার',
  browseAndBook: 'খুঁজুন ও বুক করুন',
  manageAndSell: 'পরিচালনা ও বিক্রি করুন',
  confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
  confirmPasswordPlaceholder: 'পাসওয়ার্ড আবার দিন',
  minChars: 'কমপক্ষে ৬ অক্ষর',
  passwordsNoMatch: 'পাসওয়ার্ড মিলছে না',
  alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
  nextArrow: 'পরবর্তী →',
  atLeast6Chars: 'কমপক্ষে ৬ অক্ষর হতে হবে',

  // Register Details
  businessDetails: 'ব্যবসার তথ্য',
  yourDetails: 'আপনার তথ্য',
  step2of2: 'ধাপ ২ এর ২ — ব্যক্তিগত তথ্য',
  fullName: 'পুরো নাম',
  fullNamePlaceholder: 'যেমন: করিম হোসেন',
  phoneNumber: 'ফোন নম্বর',
  phonePlaceholder: '+৮৮০ ১XXX XXXXXX',
  businessName: 'ব্যবসার নাম',
  businessNamePlaceholder: 'যেমন: স্পাইস গার্ডেন ক্যাটারিং',
  cuisineTypes: 'খাবারের ধরন',
  eventCategories: 'ইভেন্টের ধরন',
  fullNameRequired: 'পুরো নাম প্রয়োজন',
  phoneRequired: 'ফোন নম্বর প্রয়োজন',
  businessNameRequired: 'ব্যবসার নাম প্রয়োজন',
  registrationFailed: 'নিবন্ধন ব্যর্থ হয়েছে',

  // Customer Home
  goodMorning: 'শুভ সকাল',
  goodAfternoon: 'শুভ দুপুর',
  goodEvening: 'শুভ সন্ধ্যা',
  searchPlaceholder: 'ক্যাটারার, খাবার, এলাকা খুঁজুন...',
  topRated: '⭐ শীর্ষ রেটেড',
  allCaterers: 'সকল ক্যাটারার',
  found: 'পাওয়া গেছে',
  noCaterersFound: 'কোনো ক্যাটারার পাওয়া যায়নি',
  tryAdjusting: 'অনুসন্ধান বা ফিল্টার পরিবর্তন করে দেখুন',
  clearFilters: 'ফিল্টার মুছুন',
  filterAndSort: 'ফিল্টার ও সাজান',
  sortBy: 'সাজানোর ধরন',
  topRatedSort: 'শীর্ষ রেটেড',
  newest: 'নতুন',
  location: 'অবস্থান',
  minimumRating: 'ন্যূনতম রেটিং',
  any: 'যেকোনো',
  reset: 'পুনরায় সেট করুন',
  applyFilters: 'ফিল্টার প্রয়োগ করুন',

  // Customer Cart/Bookings
  myBookings: 'আমার বুকিং',
  noBookings: 'এখনো কোনো বুকিং নেই',
  noBookingsSubtext: 'আপনার নিশ্চিত ক্যাটারিং বুকিং এখানে দেখাবে',
  browseCaterers: 'ক্যাটারার দেখুন',
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  cancelled: 'বাতিল',
  completed: 'সম্পন্ন',
  eventDate: 'ইভেন্টের তারিখ',
  guests: 'অতিথি',
  total: 'মোট',
  cancelBooking: 'বুকিং বাতিল করুন',
  cancelConfirm: 'আপনি কি এই বুকিং বাতিল করতে চান?',
  keepBooking: 'বুকিং রাখুন',

  // Checkout
  checkout: 'চেকআউট',
  orderSummary: 'অর্ডারের সারসংক্ষেপ',
  eventDetails: 'ইভেন্টের বিবরণ',
  specialRequests: 'বিশেষ অনুরোধ',
  specialRequestsPlaceholder: 'খাদ্যতালিকা সংক্রান্ত প্রয়োজনীয়তা বা বিশেষ নোট...',
  placeOrder: 'অর্ডার দিন',
  confirmOrder: 'অর্ডার নিশ্চিত করুন',
  processingOrder: 'প্রক্রিয়াকরণ হচ্ছে...',

  // Profile (shared)
  profile: 'প্রোফাইল',
  myProfile: 'আমার প্রোফাইল',
  editProfile: 'প্রোফাইল সম্পাদনা',
  save: 'সংরক্ষণ করুন',
  cancel: 'বাতিল',
  signOut: 'সাইন আউট',
  signOutConfirm: 'আপনি কি সাইন আউট করতে চান?',
  fullNameLabel: 'পুরো নাম',
  phoneLabel: 'ফোন',
  emailLabel: 'ইমেইল',
  businessLabel: 'ব্যবসা',
  descriptionLabel: 'বিবরণ',
  locationLabel: 'অবস্থান',
  approved: 'অনুমোদিত',
  pendingApproval: 'অনুমোদন বাকি',
  error: 'ত্রুটি',
  saveFailed: 'সংরক্ষণ ব্যর্থ হয়েছে',

  // Vendor Dashboard
  dashboard: 'ড্যাশবোর্ড',
  menu: 'মেনু',
  bookings: 'বুকিং',
  totalBookings: 'মোট বুকিং',
  pendingBookings: 'অপেক্ষমাণ',
  confirmedBookings: 'নিশ্চিত',
  totalRevenue: 'মোট আয়',
  recentBookings: 'সাম্প্রতিক বুকিং',
  noRecentBookings: 'কোনো সাম্প্রতিক বুকিং নেই',
  viewAll: 'সব দেখুন',

  // Vendor Menu
  addItem: 'আইটেম যোগ করুন',
  addPackage: 'প্যাকেজ যোগ করুন',
  menuItems: 'মেনু আইটেম',
  packages: 'প্যাকেজ',
  itemName: 'আইটেমের নাম',
  itemDescription: 'বিবরণ',
  price: 'মূল্য',
  guestCount: 'অতিথি সংখ্যা',
  category: 'বিভাগ',
  image: 'ছবি',
  deleteItem: 'আইটেম মুছুন',
  deleteConfirm: 'আপনি কি এই আইটেম মুছে ফেলতে চান?',
  delete: 'মুছুন',

  // Vendor Bookings
  allBookings: 'সকল বুকিং',
  accept: 'গ্রহণ করুন',
  reject: 'প্রত্যাখ্যান করুন',
  noBookingsVendor: 'এখনো কোনো বুকিং নেই',

  // Tab labels
  tabHome: 'হোম',
  tabBookings: 'আমার বুকিং',
  tabProfile: 'প্রোফাইল',
  tabDashboard: 'ড্যাশবোর্ড',
  tabMenu: 'মেনু',
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const t = language === 'en' ? en : bn;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
