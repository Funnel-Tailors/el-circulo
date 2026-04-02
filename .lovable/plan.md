

## Plan: Hero above-the-fold optimizado

### Cambios en `src/components/roadmap/CircleHero.tsx`

Reestructurar el hero con esta jerarquía:

```text
[5 estrellas]
[Pre-cualificación ICP — "Solo para dueños de agencia, estudio o productora de 1 a 5 personas"]
[HEADLINE — "Cierra proyectos de 5–10.000€ en menos de 30 días"]
[Subheadline — "El sistema que te dice exactamente qué hacer cada día para dejar de depender de la suerte"]
[VSL video]
[CTA — "Quiero entrar"]
```

**Cambios concretos:**
1. Acortar pre-cualificación ICP a una línea
2. Nuevo headline result-driven
3. Nueva subheadline (mecanismo)
4. Un solo CTA debajo del video
5. Sin micro social proof
6. Eliminar bloque duplicado "EL CÍRCULO" + subheadline inferior

### Archivo modificado (1)
`src/components/roadmap/CircleHero.tsx`

