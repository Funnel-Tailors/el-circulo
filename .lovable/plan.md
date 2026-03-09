

## Análisis: Copy de Q5 y uso de FLOC

### Estado actual

**Q5 pregunta**: `"¿Cuánto estás dispuesto a invertir en tu agencia?"`
**Motivator**: `"Cris pasó de tirar la toalla a cerrar 3.000€. Felipe tuvo 2 llamadas de venta en 7 días."`

FLOC se usa en:
- **QualifiedResult.tsx**: "FLOC facturó €80K en 4 días. Proyectos de hasta €60K cerrados dentro."
- **MiniFAQSection.tsx**: "FLOC cerró un proyecto de branding de €20.000 con menos de 3 días de anuncios."

No se usa en Q5 actualmente.

### Propuesta

Meter FLOC en el **motivator de Q5** para que justo antes de elegir precio vean el caso más potente. El dato de "€20/día en publicidad" haría el contraste brutal con los €3K/mes de inversión.

**Cambio en QuizSection.tsx línea 92-93**:

```
motivator: {
  icon: "🔥",
  text: "FLOC facturó €80.000 en 4 días con €20/día en anuncios. Este es el sistema."
}
```

También se puede hacer más aspiracional la pregunta misma:

```
question: "¿Cuánto estás dispuesto a invertir en escalar tu agencia?"
```

Un solo archivo, 2 líneas.

