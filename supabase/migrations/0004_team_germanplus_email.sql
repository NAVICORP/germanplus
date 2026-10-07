-- The German Plus shared mailbox joins the admin team as an admin.
-- It signs in with Google or an emailed code. Run once; does nothing if the
-- address is already on the team.
insert into public.team (name, email, role, added_by)
values ('German Plus', 'germanplusgs@gmail.com', 'admin', 'Ishaque')
on conflict (email) do nothing;
