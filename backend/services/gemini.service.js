/**
 * Servicio de integración con Google Gemini API (generativelanguage.googleapis.com).
 * - Extracción estructurada de pólizas desde PDF/Imagen (multimodal).
 * - Extracción asistida de folio/código de verificación de certificados de defunción.
 * - Asistente de orientación acotado exclusivamente al uso de Baúl Eterno.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELOS_PREFERIDOS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

function tieneGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
}

async function llamarGemini({ contents, systemInstruction, responseMimeType }) {
  if (!tieneGeminiKey()) {
    throw new Error('GEMINI_NO_CONFIGURADO');
  }

  const key = process.env.GEMINI_API_KEY.trim();
  const modelosUnicos = [...new Set(MODELOS_PREFERIDOS)];
  let ultimoError = null;

  for (const modelo of modelosUnicos) {
    const url = `${GEMINI_BASE}/${modelo}:generateContent?key=${encodeURIComponent(key)}`;
    const body = { contents };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    if (responseMimeType) {
      body.generationConfig = { responseMimeType, temperature: 0.2 };
    } else {
      body.generationConfig = { temperature: 0.4, maxOutputTokens: 450 };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      ultimoError = new Error(`Gemini (${modelo}) error de red/timeout: ${fetchErr.message}`);
      continue;
    }
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const texto = json?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim();
      if (!texto) throw new Error('Respuesta vacía de Gemini.');
      return { texto, modelo };
    }

    const errText = await res.text().catch(() => '');
    ultimoError = new Error(`Gemini (${modelo}) HTTP ${res.status}: ${errText.slice(0, 180)}`);
    // Reintenta con siguiente modelo si es 404 (no disponible), 503 (alta demanda) o 429 (límite temporal)
    if (![404, 429, 503].includes(res.status)) break;
  }

  throw ultimoError || new Error('No se pudo conectar con Google Gemini.');
}

function limpiarJson(texto) {
  const sinBloques = texto.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const inicio = sinBloques.indexOf('{');
  const fin = sinBloques.lastIndexOf('}');
  if (inicio !== -1 && fin !== -1) {
    return JSON.parse(sinBloques.slice(inicio, fin + 1));
  }
  return JSON.parse(sinBloques);
}

/**
 * Extrae campos de una póliza de seguro (PDF o imagen) para pre-llenar el formulario.
 */
exports.extraerDatosPoliza = async ({ buffer, mimetype }) => {
  const base64 = buffer.toString('base64');
  const prompt = `Analiza este documento (póliza de seguro, certificado de cobertura o estado bancario de seguro en Chile) y extrae ÚNICAMENTE un objeto JSON válido con estas claves exactas:
{
  "tipo_seguro": "una de estas opciones exactas: Seguro de Vida Individual | Seguro Desgravamen | Seguro Complementario de Salud | Seguro Automotriz | Seguro de Incendio y Sismo",
  "aseguradora": "nombre de la compañía aseguradora o banco (texto corto, o cadena vacía si no aparece)",
  "numero_poliza": "número o código de póliza (texto corto, o cadena vacía si no aparece)",
  "monto_referencial": 0,
  "moneda_detectada": "CLP o UF o USD o DESCONOCIDA",
  "observaciones": "resumen breve de 1 línea sobre lo encontrado en el documento"
}
Reglas:
- monto_referencial debe ser un número entero positivo en CLP aproximado o el valor numérico detectado (si no aparece, usa 0).
- No inventes números de póliza que no estén en el documento.
- Responde SOLO con JSON puro.`;

  const { texto, modelo } = await llamarGemini({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimetype, data: base64 } },
        ],
      },
    ],
    responseMimeType: 'application/json',
  });

  const datos = limpiarJson(texto);
  const tiposValidos = [
    'Seguro de Vida Individual',
    'Seguro Desgravamen',
    'Seguro Complementario de Salud',
    'Seguro Automotriz',
    'Seguro de Incendio y Sismo',
  ];

  const tipoFinal = tiposValidos.includes(datos.tipo_seguro)
    ? datos.tipo_seguro
    : 'Seguro de Vida Individual';

  return {
    tipo_seguro: tipoFinal,
    aseguradora: String(datos.aseguradora || '').trim().slice(0, 100),
    numero_poliza: String(datos.numero_poliza || '').trim().slice(0, 100),
    monto_referencial: Math.max(0, Number(datos.monto_referencial) || 0),
    moneda_detectada: String(datos.moneda_detectada || 'CLP').toUpperCase(),
    observaciones: String(datos.observaciones || 'Datos extraídos automáticamente desde tu documento.').slice(0, 220),
    modelo,
  };
};

/**
 * Extrae folio / código de verificación de un certificado de defunción (opcional y no bloqueante).
 */
exports.analizarCertificadoDefuncion = async ({ buffer, mimetype }) => {
  try {
    const base64 = buffer.toString('base64');
    const prompt = `Revisa este documento (certificado de defunción de Chile) y devuelve SOLO JSON con:
{
  "folio": "número de folio o código de verificación si aparece, o null",
  "es_certificado_defuncion": true o false
}`;

    const { texto } = await llamarGemini({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimetype, data: base64 } },
          ],
        },
      ],
      responseMimeType: 'application/json',
    });

    const parsed = limpiarJson(texto);
    return {
      folio: parsed.folio ? String(parsed.folio).trim().slice(0, 100) : null,
      es_certificado_defuncion: Boolean(parsed.es_certificado_defuncion),
    };
  } catch {
    return null;
  }
};

/**
 * Respuesta local de respaldo si la API externa no estuviera disponible.
 */
function respuestaLocalRespaldo(pregunta) {
  const q = pregunta.toLowerCase();
  if (q.includes('check') || q.includes('180') || q.includes('vigencia')) {
    return 'El Check-in confirma que sigues activo y renueva tu bóveda según el plazo que configuraste (30, 90, 180 o 365 días). Además, si hubiera una solicitud de apertura en curso, hacer Check-in la anula al instante.\n\n¿Te gustaría saber cómo configurar correos alternativos o tu persona de confianza?';
  }
  if (q.includes('albacea') || q.includes('invit')) {
    return 'Puedes designar hasta 5 albaceas desde la sección "Albaceas". Incluso si aún no tienen cuenta en Baúl Eterno, quedarán como invitados y se vincularán automáticamente cuando se registren con su RUT.\n\n¿Quieres que te explique qué información ven los albaceas cuando se libera una bóveda?';
  }
  if (q.includes('mensaje') || q.includes('cifra') || q.includes('segur')) {
    return 'Tus mensajes póstumos se resguardan con cifrado de alto estándar de seguridad antes de guardarse. Puedes dirigirlos a tus albaceas o a cualquier persona externa por su correo electrónico (sin que tenga cuenta).\n\n¿Te ayudo con cómo redactar una carta póstuma o cómo gestionar tus pólizas?';
  }
  if (q.includes('apertura') || q.includes('gracia') || q.includes('72') || q.includes('plazo')) {
    return 'Cuando un albacea o familiar solicita la apertura, se activa un plazo de gracia (7 días por defecto, configurable en Ajustes) con alertas por correo y en tu panel principal para que puedas anularla con un clic si sigues activo.\n\n¿Quieres saber cómo funciona el aviso a tu persona de confianza 48 horas antes?';
  }
  if (q.includes('poliza') || q.includes('seguro') || q.includes('pdf') || q.includes('uf')) {
    return 'En "Pólizas y Seguros" puedes registrar tus seguros manualmente o subir un PDF/foto para que la IA complete los datos, y ver tu cobertura total valorizada al instante en pesos y UF.\n\n¿Te gustaría consultar sobre tu inventario digital o sobre cómo contactar a soporte?';
  }
  return 'Baúl Eterno te ayuda a resguardar tus pólizas de seguro, inventario digital, mensajes póstumos cifrados y hasta 3 albaceas de confianza. Si alguien te designa como albacea, verás un selector en la parte superior del menú lateral para alternar a "Albacea".\n\n¿Sobre cuál de estas secciones te gustaría profundizar ahora?';
}

/**
 * Asistente de orientación de Baúl Eterno (solo orientativo, sin ejecutar acciones).
 */
exports.responderConsultaPlataforma = async (pregunta) => {
  const systemInstruction = `Eres el asistente de orientación cercano y amable de "Baúl Eterno", una plataforma chilena de legado personal.
Tu ÚNICO propósito es explicar de forma clara, humana y en español cómo funciona la plataforma:
- Cuenta dual unificada: todo usuario tiene su propia bóveda (Mi Baúl) y, si otro usuario lo designa por RUT, aparece un selector en la cabecera del menú lateral para alternar a "Albacea".
- Pólizas y Seguros: registro manual o autocompletado subiendo PDF/foto con IA, con valorización total en vivo en pesos chilenos y UF.
- Inventario Digital: registro de cuentas, suscripciones y bienes con instrucciones póstumas.
- Albaceas: hasta 5 personas de confianza; se puede invitar a personas no registradas que se vinculan automáticamente al crear cuenta con su RUT.
- Mensajes Póstumos: cartas protegidas con cifrado de alto estándar de seguridad dirigidas a albaceas o a personas externas por correo electrónico (sin necesidad de cuenta), entregadas solo tras la apertura autorizada.
- Check-in y correos de respaldo: frecuencia configurable en Ajustes (30, 90, 180 o 365 días), correo alternativo y persona de confianza (avisada 48h antes de una liberación).
- Apertura por contingencia: inicia un plazo de gracia (7 días por defecto, configurable) con alertas al titular; si el titular hace Check-in o anula, se detiene. Si se aprueba, la bóveda se libera globalmente para todos sus albaceas validados.
- Soporte: en Ajustes y Clave (o desde el panel principal si hay un inconveniente) el usuario puede escribir directamente al equipo de soporte.
Reglas estrictas:
1. Usa un lenguaje cercano, claro y evita siglas técnicas innecesarias como SHA-256, AES-256-CBC o JWT.
2. Responde en máximo 4 líneas directas y CIERRA SIEMPRE invitando amablemente a seguir consultando o sugiriendo un tema relacionado concreto.
3. Nunca inventes funciones que no existen ni afirmes que ejecutaste acciones en la base de datos.
4. Si preguntan por temas ajenos a Baúl Eterno o asesoría legal específica, indícales amablemente que solo orientas sobre el uso de la plataforma y sugiere una pregunta útil.`;

  try {
    const { texto, modelo } = await llamarGemini({
      contents: [{ role: 'user', parts: [{ text: pregunta }] }],
      systemInstruction,
    });
    return { respuesta: texto, fuente: 'gemini', modelo };
  } catch (error) {
    console.warn('[ASISTENTE FALLBACK]:', error.message);
    return {
      respuesta: respuestaLocalRespaldo(pregunta),
      fuente: 'guia-local',
      modelo: null,
    };
  }
};

exports.tieneGeminiKey = tieneGeminiKey;
