-- Nusaif's own email, nusaifmuhammed3@gmail.com, goes on his team entry next
-- to his WhatsApp number, so Google, an emailed code and WhatsApp all sign him
-- in as the same super admin. The German Plus mailbox (germanplusgs@gmail.com,
-- added in 0004) stays a separate admin.
update public.team
   set email = 'nusaifmuhammed3@gmail.com'
 where phone = '917510812618'
   and email is null
   and not exists (select 1 from public.team t where t.email = 'nusaifmuhammed3@gmail.com');
