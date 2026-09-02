-- Tabla que sustituye a opciones.json
create table if not exists public.opciones (
    id bigint generated always as identity primary key,
    categoria text not null check (categoria in ('locutor', 'seccion', 'minisección', 'duracion')),
    valor text not null,
    orden integer not null,
    -- Solo se usa para categoria = 'locutor': su usuario de redes sociales,
    -- para autorrellenar el campo Observaciones al elegirlo en una sección
    rrss text
);

-- Activa Row Level Security (solo usuarios autenticados podrán leer)
alter table public.opciones enable row level security;

create policy "Usuarios autenticados pueden leer opciones"
on public.opciones
for select
to authenticated
using (true);

-- Necesario porque "Automatically expose new tables" está desactivado:
-- la política de RLS no basta, el rol también necesita permiso a nivel de tabla
grant select on public.opciones to authenticated;

-- Los datos (locutores, secciones, minisecciones, duraciones) están en
-- seed-data.sql, que no se sube a git por contener datos personales.
