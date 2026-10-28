-- There can only ever be ONE Super Admin account.
create unique index profiles_single_super_admin on public.profiles ((true)) where role = 'super_admin';
