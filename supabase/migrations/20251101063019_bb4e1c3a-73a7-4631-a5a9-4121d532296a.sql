-- Update existing role to admin for harivissa30@gmail.com
UPDATE public.user_roles
SET role = 'admin'::app_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'harivissa30@gmail.com' LIMIT 1);