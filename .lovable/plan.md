

## Cambios en Above The Fold para Nuevo ICP

### Contexto del Cambio

El ICP evoluciona de **freelancer individual** a **dueño de agencia/estudio/productora con equipo**. Esto requiere ajustar el messaging del above the fold para que resuene con alguien que:

- Ya tiene estructura (aunque pequeña)
- Factura pero mal (clientes que pagan poco, vienen por recomendación de otros que pagaron poco)
- Vive con incertidumbre mes a mes
- Ha tenido "meses buenos" que resultaron ser suerte

---

### Cambios en `CircleHero.tsx`

**1. Badge Cualificador (líneas 229-232)**

```text
ANTES:
"Solo para emprendedores creativos que ya estén facturando 
y quieran cerrar proyectos de 3.000€ cada semana sin depender del algoritmo"

DESPUÉS:
"Solo para dueños de agencia, estudio o productora con equipo 
que quieren dejar de depender de la suerte para saber cuánto van a facturar el mes que viene"
```

**2. Headline Principal (líneas 236-239)**

```text
ANTES:
"El problema no es que no tengas clientes,
es que tienes clientes de mierda"

DESPUÉS (del guión):
"Si dices que tienes una agencia pero en realidad solo sois tú y tu equipo 
con el cortisol por las nubes lidiando con clientes que te pagan 
una cuarta parte de lo que te mereces"
```

Alternativa más directa que mantiene el estilo actual:
```text
"El problema no es tu agencia,
es que cobras lo que quieren pagarte y no lo que te mereces"
```

**3. Subheadline (línea 240)**

```text
ANTES:
"Descubre en 5 minutos el secreto para llenar tu agenda 
cada semana de clientes que pagan sin cuestionarte y por adelantado"

DESPUÉS (del guión):
"Aprende a vender cada día sin depender de la suerte, antiguos clientes ratilla 
o esperar a que los astros se alineen para tener un mes bueno"
```

**4. Subheadline Inferior (líneas 297-299)**

```text
ANTES:
"Consigue tu próximo cliente que no regatea en menos de 30 días 
(o en 7 si aguantas el ritmo)"

DESPUÉS:
"Un sistema para saber exactamente cuánto vas a generar el mes que viene
(ejecutable en 3 días, optimizado en 7)"
```

---

### Cambios Opcionales en `ClientBubble.tsx`

El contenido actual está muy orientado a freelancers individuales con Instagram. Con el nuevo ICP (agencias con equipo) podríamos considerar ajustar los ejemplos, pero esto es secundario al above the fold.

**Ejemplos actuales que resuenan con freelancers:**
- "Open for commissions"
- "Abro agenda" 
- "3 trucos para..."

**Posibles ajustes futuros** (no prioritarios ahora):
- Referencias a propuestas que se eternizan
- Clientes que vienen "por recomendación de otros que pagaron poco"
- El ciclo de meses buenos → estampazos

---

### Cambios en Quiz (`QuizSection.tsx`)

**Q2 - Profesión (línea 58)**

```text
ANTES:
["Diseñador Gráfico / Web", "Fotógrafo/Filmmaker", "Automatizador", "Otro servicio creativo"]

DESPUÉS:
["Agencia de diseño / branding", "Productora / Estudio audiovisual", "Estudio de desarrollo / automatización", "Otro tipo de agencia creativa"]
```

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/roadmap/CircleHero.tsx` | Badge cualificador, headline, 2 subheadlines |
| `src/components/quiz/QuizSection.tsx` | Opciones de Q2 para reflejar "agencia" en lugar de profesión individual |

---

### Copy Propuesto (Versión Final)

**Badge Cualificador:**
> Solo para dueños de **agencia, estudio o productora** con equipo que quieren dejar de depender de la suerte para saber **cuánto van a facturar el mes que viene**

**Headline:**
> El problema no es que **no tengas clientes**, es que tienes clientes **de mierda**

*(Este headline sigue funcionando porque el guión lo refuerza: "clientes que no te pagan ni una cuarta parte de lo que te mereces")*

**Subheadline:**
> Descubre cómo vender cada día sin depender de la suerte, clientes ratilla o que los astros se alineen para tener un mes bueno

**Subheadline Inferior (bajo EL CÍRCULO):**
> Un sistema para saber exactamente cuánto vas a generar el mes que viene — ejecutable en 3 días, optimizado en 7

---

### Notas Importantes

1. **El headline actual puede mantenerse** porque el guión lo refuerza con "clientes que no te pagan ni una cuarta parte de lo que te mereces"

2. **La palabra clave es "agencia/estudio/productora"** en lugar de "emprendedores creativos" o "freelancers"

3. **El dolor principal cambia** de "no tengo clientes" a "no sé cuánto voy a facturar el mes que viene" (incertidumbre)

4. **El sistema sigue siendo el mismo** (3 días ejecutar, 7 optimizar) pero ahora incluye contexto de equipo

