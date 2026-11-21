import { z } from 'zod';
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid record.');
const email = z.email('Enter a valid email address.').max(254).transform(value => value.toLowerCase());
export const registrationSchema = z.strictObject({
  name: z.string().trim().min(2).max(80), email,
  password: z.string().min(12).max(128),
});
export const loginSchema = z.strictObject({ email, password: z.string().min(1).max(128) });
const requestFields = {
  title: z.string().trim().min(5, 'Enter 5 to 120 characters.').max(120),
  description: z.string().trim().min(20, 'Enter 20 to 2000 characters.').max(2000),
  location: z.string().trim().max(120), categoryId: objectId,
};
export const requestSchema = z.strictObject({ ...requestFields, location: requestFields.location.default('') });
export const requestPatchSchema = z.strictObject(requestFields).partial().refine(value => Object.keys(value).length > 0, 'Choose a field to update.');
export const categorySchema = z.strictObject({ name: z.string().trim().min(2).max(60) });
export const categoryPatchSchema = z.strictObject({ name: categorySchema.shape.name.optional(), active: z.boolean().optional() }).refine(value => Object.keys(value).length > 0, 'Choose a field to update.');
export const statusSchema = z.strictObject({
  status: z.enum(['in_progress', 'resolved']), resolutionNote: z.string().trim().max(1000).default(''),
}).refine(value => value.status !== 'resolved' || value.resolutionNote.length >= 5, { path: ['resolutionNote'], message: 'Explain the resolution in 5 to 1000 characters.' });
export const listSchema = z.strictObject({
  q: z.string().trim().max(100).default(''),
  status: z.enum(['open', 'in_progress', 'resolved']).optional(), categoryId: objectId.optional(),
  sort: z.enum(['newest', 'oldest', 'title_asc', 'title_desc']).default('newest'),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
