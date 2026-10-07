-- germanplusgs@gmail.com is Nusaif's address. It moves onto his team entry,
-- next to his WhatsApp number, so Google, an emailed code and WhatsApp all
-- sign him in as the same super admin. The separate "German Plus" entry added
-- in 0004 is removed.
delete from public.team
 where email = 'germanplusgs@gmail.com'
   and phone is null
   and role = 'admin';

update public.team
   set email = 'germanplusgs@gmail.com'
 where phone = '917510812618'
   and email is null
   and not exists (select 1 from public.team t where t.email = 'germanplusgs@gmail.com');

