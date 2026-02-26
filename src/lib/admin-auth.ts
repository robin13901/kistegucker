import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

function getConfiguredAdminEmails() {
  const values = [
    process.env.SUPABASE_ADMIN_EMAILS,
    process.env.SUPABASE_ADMIN_EMAIL,
    process.env.ADMIN_EMAILS,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_SUPABASE_ADMIN_EMAIL
  ].filter(Boolean);

  return values
    .flatMap((value) => String(value).split(','))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const configuredAdminEmails = getConfiguredAdminEmails();
  const isAdminByRole = user && (user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin');
  const isAdminByEmail = Boolean(user?.email && configuredAdminEmails.includes(user.email.toLowerCase()));
  const isAdmin = isAdminByRole || isAdminByEmail;

  if (!isAdmin) {
    return null;
  }

  return { supabase, user };
}
