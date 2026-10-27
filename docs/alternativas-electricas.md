# SUDMAR — Predimensionamiento automático de cables y canalizaciones

## Alcance
El módulo `alternativas-instalacion.js` genera hasta tres arreglos de conductores de cobre Cu THHN/THWN-2 para cada tramo: acometida normal→ATS, planta→ATS, ATS→cargas. Usa los datos eléctricos y distancias del levantamiento vigente; cada alternativa indica juegos por fase, neutros, PE, ampacidad corregida, caída estimada, EMT, liquidtight Electri-Flex LA, ducto metálico y charola de malla.

No es ingeniería ejecutiva ni memoria de cálculo. **No autoriza la compra ni instalación.** Se requiere validación por un profesional competente para: motor más exigente, corriente de cortocircuito, coordinación/selectividad, terminales reales, puesta a tierra y neutro, temperatura y agrupamiento, reactividad/caída transitoria, método de instalación y restricciones del fabricante.

## Suposiciones visibles
- Tabla de calibres base 8 AWG a 1000 kcmil. Capacidad Cu a 75/90 °C, con terminal máximo 75 °C. Ampacidad usada por juego = `min(ampacidad 75°C, ampacidad 90°C × ajuste por número de conductores portadores × ajustes introducidos)`.
- **Neutro** se cuenta como portador de corriente para ajuste térmico (conservador). Un conductor de puesta a tierra (PE) por cada conduit, provisionado geométricamente con **el mismo diámetro externo de la fase**, conservador, aunque su calibre real debe calcularse por artículo 250-122 y variaciones aplicables.
- Un circuito completo por tubo; para conductores en paralelo se repite el juego (fases, neutro si existe y PE) en su propio tubo. En esta herramienta **no se admiten paralelos menores que 1/0 AWG**: 310-10(h). Verificar que los conductores paralelos sean del mismo tamaño, material, longitud, aislamiento y terminaciones adecuadas, instalados según la NOM.
- Resistencia AC 75 °C y reactancia son referencias de fabricante Southwire; caída de tensión estimada a `√3 × I × (Rcosφ + Xsinφ) × L` para 3 fases o `2 × I × (...) × L` monofásico, dividiendo R/X por el número de juegos paralelos. La separación entre conductores y otros efectos obligan a verificar.
- EMT: porcentajes máximos 53% un conductor, 31% dos, 40% más de dos; diámetros interiores de referencia NOM, Capítulo 10 Tabla 4.
- Liquidtight: diámetros interiores mínimos de **Electri-Flex LA**, no equivalentes universales para otras marcas. Se calculan nominales según ocupación permitida; revisar longitud, flexibilidad y conectores aplicables.
- Ducto metálico: dimensión geométrica interior teórica, ocupación máxima 20% según art. 376-22. Verificar producto, empalmes, tapas, curvaturas y disipación; las medidas comerciales mostradas no sustituyen dibujo certificado.
- Charola tipo malla: ancho geométrico orientativo para una capa y cable calificado para uso en charola (sólo calibres >=1/0 en referencia Southwire), **no significa validación 392-22 ni 392-80**. No aceptar sin revisión de ingeniería específica de la charola/cable.
- Los arreglos se **ordenan por sección de cobre total aproximada multiplicada por longitud**, no por precio real ni por complejidad total instalada. Un usuario debe incorporar cotizaciones y mano de obra antes de decidir por costo.
- El módulo expone resultados aunque falten distancias y factores para no bloquear la captura parcial, pero muestra advertencias y el resultado NO está validado.

## Fuentes para mantenimiento de tablas
- Secretaría de Economía: https://platiica.economia.gob.mx/normalizacion/nom-001-sede-2012/
- NOM capítulo 10 y reglas de canalizaciones: https://sidof.segob.gob.mx/notas/docFuente/5280607
- NOM reglas conductores, ampacidad y ajuste: https://sidof.segob.gob.mx/notas/docFuente/5280609
- NOM ducto, charola y liquidtight: https://sidof.segob.gob.mx/notas/docFuente/5280611
- Southwire THHN/THWN-2 Cu, tablas de diámetro y propiedades: https://www.southwire.com/wire-cable/building-wire/simpull-sup-sup-thhn-thwn-2-copper/p/SPEC10000
- Electri-Flex LA, diám. mínimos: https://www.electriflex.com/products/type-la/

## Restricciones pendientes para liberación formal
1. Validar versiones vigentes de catálogos específicos de fabricante y las condiciones de aislamiento/terminal reales.
2. Cálculo de neutro, PE, protección contra sobrecorriente, puesta a tierra y corriente de cortocircuito, incluyendo restricciones de selección de protecciones.
3. Altitud, temperatura real, reducción potencia generador, arranque motor y cargas no lineales.
4. Validar caídas de tensión acumuladas normal→ATS→carga y generador→ATS→carga en la peor condición.
5. Ingeniería detallada de charola, ducto, uniones, ventilación, soportes, radio de curvatura y esfuerzo de jalado.
6. Precios y mano de obra para optimización económica.

## Pruebas
`node --test tests/alternativas.test.cjs`, `node --test tests/instalacion.test.cjs`, navegador móvil `tests/instalacion.e2e.cjs` con datos sintéticos, sin escritura en Supabase.
