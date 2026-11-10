import slugify from 'slugify';

/**
 * Converts any title or text into a clean URL-safe slug
 * E.g.: "Lớp 10A1 - Advanced English" -> "lop-10a1-advanced-english"
 */
export const createSlug = (text) => {
  if (!text) return '';
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'vi',
    trim: true,
  });
};

export const MODULE_SLUGS = {
  dashboard: 'dashboard',
  courses: 'courses-classes',
  curriculum: 'curriculum-levels',
  schedules: 'zoom-schedules',
  attendance: 'class-attendance-evaluation',
  contracts: 'contracts-payroll',
  tuition: 'tuition-fees',
  users: 'user-management',
  profile: 'my-profile',
};

export const getSlugFromModule = (key) => MODULE_SLUGS[key] || 'dashboard';
export const getModuleFromSlug = (slug) => {
  const rootSlug = String(slug || '').split('/')[0];
  const entry = Object.entries(MODULE_SLUGS).find(([_, value]) => value === rootSlug || value === slug);
  return entry ? entry[0] : 'dashboard';
};
