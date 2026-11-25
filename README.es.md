# ATENA — El conocimiento es poder

Plataforma gratuita y de código abierto para estudiar para el examen ENEM de Brasil. ATENA reúne seguimiento de temas, herramientas de estudio, planificación de ensayos, materiales de práctica y seguimiento local del progreso en una aplicación de arquitectura principalmente estática.

**Hecha en Brasil, para todos.**

- Sitio web: https://atena.dev.br/
- Academia de estudio: https://atena.dev.br/estudos.html
- Estudio de redacción: https://atena.dev.br/redacao.html
- Guía de argumentos y referencias: https://atena.dev.br/guia-estrategico.html
- Notas y catálogo de universidades: https://atena.dev.br/minha-nota.html
- Radar de temas: https://atena.dev.br/radar.html
- Aplicación offline de un solo archivo: https://atena.dev.br/estudar-offline.html

## Versión actual

El repositorio documenta ATENA 5.3. La plataforma incluye:

- Academia con 40 lecciones originales en cinco áreas.
- Estudio de redacción con 17 temas de práctica, rutas argumentativas, planificación, listas de revisión e historial local de borradores.
- Radar de temas que organiza prioridades relativas de estudio a partir de fuentes públicas. No predice preguntas ni probabilidades del examen.
- Catálogo de universidades y cursos basado en los datos oficiales de SiSU 2026, con comparación de notas ponderadas y advertencias explícitas sobre las modalidades.
- Preguntas de práctica, simulacros cronometrados, tarjetas de repaso, cuaderno de errores, temporizador Pomodoro y biblioteca de referencias.
- Caché de Progressive Web App y versión HTML independiente para uso sin conexión.
- Progreso del estudiante almacenado localmente, copia de seguridad completa y restauración, sin cuenta obligatoria.
- Recolector Python que obtiene actualizaciones de fuentes públicas sin una API de IA de pago.

El contenido sirve para estudiar y practicar. No ofrece corrección oficial de ensayos, estimaciones TRI, predicciones de admisión ni decisiones de elegibilidad para modalidades de acción afirmativa.

## Arquitectura

ATENA utiliza Next.js, React, TypeScript y Tailwind para exportar una interfaz estática. Python se utiliza para la recopilación y validación programada de datos. GitHub Actions construye y publica el sitio estático en GitHub Pages con dominio personalizado.

El navegador almacena localmente el progreso personal. Abrir la plataforma no activa procesamiento remoto de ensayos ni llamadas a una IA de pago. La arquitectura busca reducir la complejidad operativa y el cómputo por visitante; no implica capacidad de alojamiento ilimitada.

## Desarrollo

Requisitos: Node.js 22.13+, Python 3.10+ y pnpm 11.25.0.

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Compilar y previsualizar el sitio estático:

```sh
pnpm build:pages
pnpm preview:pages
```

Comandos útiles de validación:

```sh
pnpm typecheck
pnpm check:atena
pnpm check:scores
pnpm check:backup
pnpm check:editorial
pnpm check:radar
pnpm check:hub
python3 -m unittest backend.test_radar_collect
```

Consulta [DEPLOYMENT.md](./DEPLOYMENT.md), [RELIABILITY.md](./RELIABILITY.md) y [ATENA.md](./ATENA.md) para conocer la publicación, la confiabilidad, la estrategia del producto y las limitaciones actuales.

## Datos y criterios editoriales

Los conjuntos de datos y referencias externas conservan su procedencia y atribución originales. Las interpretaciones editoriales se distinguen de los hechos presentes en las fuentes. Los datos oficiales de admisión deben verificarse en la convocatoria vigente de cada institución y modalidad; los cortes históricos no garantizan la admisión.

El proyecto no está afiliado al Ministerio de Educación de Brasil ni a las instituciones incluidas en el catálogo.

## Licencia

El código original se distribuye bajo la licencia MIT. El contenido externo, los conjuntos de datos, las imágenes y los PDF enlazados pueden tener condiciones independientes. Consulta [LICENSE](./LICENSE) y los avisos de las fuentes correspondientes.

---

[Português](./README.md) · [English](./README.en.md)
