-- El vencimiento pasa a ser opcional: solo se rellena si el admin indica una fecha concreta.
ALTER TABLE public.invoices ALTER COLUMN due_date DROP NOT NULL;
