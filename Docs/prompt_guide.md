# Guía de Prompts para Inteligencia Artificial (PARITY)

Este documento explica cómo utilizar de manera óptima los **Skills** y cómo estructurar tus prompts al trabajar con herramientas de IA (como Claude, Gemini o ChatGPT) en el desarrollo de PARITY.

---

## ¿Los Skills se usan de manera automática?

**Sí y No (según la herramienta):**
- **Claude Code / Cursor / Copilot (Automático en contexto):** Si la herramienta tiene visibilidad de todo el repositorio, leerá automáticamente la estructura de la carpeta `.claude/` y archivos como `CLAUDE.md`. 
- **Herramientas de Chat Convencionales:** Requieren que les indiques explícitamente qué Skill leer antes de realizar una tarea para asegurar que sigan las directrices técnicas del proyecto.

> [!TIP]
> **Mejor Práctica:** Cuando inicies una tarea con la IA, menciónale qué Skill debe usar.
> *Ejemplo:* `"Lee el skill en .claude/skills/testing_skill.md y escribe una prueba unitaria para..."`

---

## Plantillas de Prompts por Caso de Uso

### 1. Crear Nuevas Características (Features)
Para crear una nueva funcionalidad, debes indicarle a la IA dónde reside el estado global, el diseño visual esperado y las traducciones requeridas.

```text
Necesito crear una nueva característica en PARITY: [Descripción de la característica, ej: un widget para estimar metas de ahorro express].

Sigue estas directrices:
1. Lee las reglas de estado global en '.claude/skills/component_extension_skill.md'. El estado debe estar en AppContent en App.tsx.
2. Sigue las reglas de consistencia de diseño detalladas en '.claude/skills/design_consistency_skill.md' (usa variables CSS y temas de themes.json).
3. Asegura que los textos añadidos se traduzcan en los 3 idiomas usando '.claude/skills/translation_skill.md'.
4. Modifica 'packages/core/src/types.ts' si necesitas nuevos tipos de datos y almacénalos de forma cifrada siguiendo '.claude/skills/cryptography_compliance_skill.md'.
```

---

### 2. Corregir Errores (Debugging & Bug Fixing)
Cuando encuentres un error, especialmente en operaciones locales o financieras, guía a la IA para evitar errores comunes de redondeo y sincronización.

```text
Tengo el siguiente bug en PARITY: [Describe el error o pega el stack trace].

Para resolverlo:
1. Lee '.claude/skills/currency_handling_skill.md' para verificar que no estemos cometiendo imprecisiones con flotantes en las conversiones.
2. Lee '.claude/skills/local_first_sync_skill.md' si el problema está relacionado con la persistencia en IndexedDB o la cola de mutaciones offline.
3. Asegúrate de añadir una prueba unitaria con Jest que valide la corrección basándote en '.claude/skills/testing_skill.md'.
```

---

### 3. Mejorar Características Existentes (Refactor / Optimization)
Si quieres hacer el código más limpio o mejorar el rendimiento del lado del cliente.

```text
Quiero optimizar y refactorizar el rendimiento del siguiente componente: [Componente o Ruta del Archivo].

Sigue estas reglas:
1. Lee '.claude/skills/performance_pwa_skill.md' para evitar re-renders innecesarios y aplicar React.memo o useMemo/useCallback si corresponde.
2. Aplica buenas prácticas de Clean Code basándote en '.claude/skills/code_review_lint_skill.md' (mantener funciones puras, modularizar si pasa de 400 líneas).
3. Asegura la consistencia del diseño extendiendo props en lugar de duplicar componentes, según '.claude/skills/component_extension_skill.md'.
```

---

### 4. Actualizaciones de Seguridad o Base de Datos
Al cambiar campos sensibles de usuario.

```text
Quiero agregar un campo nuevo llamado [nombre_campo] a la configuración de los perfiles.

Por favor:
1. Lee '.claude/skills/multiprofile_sandbox_skill.md' para asegurar el aislamiento de datos por perfil.
2. Lee '.claude/skills/cryptography_compliance_skill.md' para asegurar que el dato se cifre antes de ser guardado en la base de datos local y nunca quede expuesto en texto plano.
```
