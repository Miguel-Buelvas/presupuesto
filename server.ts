import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  FunctionCall,
  FunctionDeclaration,
  GoogleGenAI,
  Part,
  Type,
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

// Tipo local para evitar depender de la exportación de 'Content'
type ChatMessage = {
  role: 'user' | 'model' | 'function';
  parts: Part[];
};

// Cascada de modelos activos y compatibles con @google/genai >= 2.29.1
const MODEL_CASCADE = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

const EXPENSE_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Servicios públicos',
  'Ropa y compras personales',
  'Entretenimiento y ocio',
] as const;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const registerExpenseDeclaration: FunctionDeclaration = {
  name: 'registerExpense',
  description:
    'Registra un nuevo gasto en el presupuesto mensual del usuario cuando indique que realizó o pagó un gasto.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.NUMBER,
        description:
          'Valor numérico del gasto en pesos colombianos (COP), mayor a cero y sin separadores ni símbolos.',
      },
      date: {
        type: Type.STRING,
        description:
          'Fecha del gasto en formato estricto YYYY-MM-DD (por ejemplo 2026-11-22).',
      },
      description: {
        type: Type.STRING,
        description:
          'Descripción breve y clara del gasto (por ejemplo: Almuerzo, Café, Taxi, Mercado).',
      },
      category: {
        type: Type.STRING,
        description:
          'Categoría del gasto. Debe ser exactamente una de: "Alimentación", "Transporte", "Servicios públicos", "Ropa y compras personales", "Entretenimiento y ocio".',
        enum: [...EXPENSE_CATEGORIES],
      },
    },
    required: ['amount', 'date', 'description', 'category'],
  },
};

interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

interface AttachmentPayload {
  kind: 'image' | 'audio';
  mimeType: string;
  data: string;
  fileName?: string;
}

interface BudgetContextPayload {
  userName?: string;
  monthLabel?: string;
  monthId?: string;
  currentDate?: string;
  monthlyBudget?: number;
  totalSpent?: number;
  availableBalance?: number;
  totalIncome?: number;
}

interface ExtractedParts {
  text: string;
  functionCalls: FunctionCall[];
}

function extractPartsFromCandidate(parts?: Part[]): ExtractedParts {
  const textChunks: string[] = [];
  const functionCalls: FunctionCall[] = [];

  if (!Array.isArray(parts)) {
    return { text: '', functionCalls: [] };
  }

  for (const part of parts) {
    if (typeof part.text === 'string' && part.text.trim().length > 0) {
      textChunks.push(part.text.trim());
    }
    if (part.functionCall && part.functionCall.name) {
      functionCalls.push(part.functionCall);
    }
  }

  return {
    text: textChunks.join('\n\n'),
    functionCalls,
  };
}

function extractErrorInfo(err: unknown): { status: number; message: string } {
  const errorObj = err as {
    status?: number;
    statusCode?: number;
    code?: number | string;
    message?: string;
    cause?: { status?: number; message?: string };
  };

  const message =
    errorObj?.message ||
    errorObj?.cause?.message ||
    'Error desconocido al comunicarse con Gemini API.';

  const numericCandidates = [
    errorObj?.status,
    errorObj?.statusCode,
    typeof errorObj?.code === 'number' ? errorObj.code : undefined,
    errorObj?.cause?.status,
  ].filter((val): val is number => typeof val === 'number' && val >= 400);

  if (numericCandidates.length > 0) {
    return { status: numericCandidates[0], message };
  }

  const upper = message.toUpperCase();
  if (
    upper.includes('429') ||
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('QUOTA')
  ) {
    return { status: 429, message };
  }
  if (
    upper.includes('503') ||
    upper.includes('UNAVAILABLE') ||
    upper.includes('OVERLOADED') ||
    upper.includes('HIGH DEMAND')
  ) {
    return { status: 503, message };
  }
  if (upper.includes('404') || upper.includes('NOT_FOUND')) {
    return { status: 404, message };
  }
  if (upper.includes('403') || upper.includes('PERMISSION_DENIED')) {
    return { status: 403, message };
  }
  if (upper.includes('401') || upper.includes('UNAUTHENTICATED')) {
    return { status: 401, message };
  }
  if (upper.includes('400') || upper.includes('INVALID_ARGUMENT')) {
    return { status: 400, message };
  }

  return { status: 500, message };
}

function formatCOPServer(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${rounded < 0 ? '-' : ''}$${formatted} COP`;
}

function normalizeMimeType(rawMime: string, kind: 'image' | 'audio'): string {
  const base = rawMime.split(';')[0].trim().toLowerCase();
  if (kind === 'image') {
    if (base === 'image/jpg') return 'image/jpeg';
    return base.startsWith('image/') ? base : 'image/jpeg';
  }
  if (base === 'audio/x-m4a' || base === 'audio/m4a') return 'audio/mp4';
  if (base === 'audio/x-wav') return 'audio/wav';
  return base.startsWith('audio/') ? base : 'audio/webm';
}

function stripBase64Prefix(rawData: string): string {
  const commaIdx = rawData.indexOf(',');
  if (rawData.startsWith('data:') && commaIdx !== -1) {
    return rawData.slice(commaIdx + 1).trim();
  }
  return rawData.trim();
}

function buildSystemInstruction(context: BudgetContextPayload): string {
  const userName = (context.userName || 'Usuario').trim() || 'Usuario';
  const monthLabel = context.monthLabel || 'Mes actual';
  const currentDate = context.currentDate || '2026-11-22';
  const monthlyBudget = Number(context.monthlyBudget ?? 0);
  const totalIncome = Number(context.totalIncome ?? 0);
  const totalSpent = Number(context.totalSpent ?? 0);
  const availableBalance = Number(context.availableBalance ?? 0);

  return [
    'Eres un asistente experto en finanzas personales integrado en la app "Mi Presupuesto Mensual" (moneda: pesos colombianos COP).',
    'Responde siempre en español, de forma breve, amable, clara y práctica.',
    `Contexto financiero dinámico del usuario (utilízalo en cada mensaje):`,
    `- Nombre del usuario: ${userName}`,
    `- Mes consultado: ${monthLabel}`,
    `- Fecha actual de referencia (hoy): ${currentDate}`,
    `- Presupuesto total del mes: ${formatCOPServer(monthlyBudget)} (incluye ingresos adicionales de ${formatCOPServer(totalIncome)})`,
    `- Total gastado en el mes: ${formatCOPServer(totalSpent)}`,
    `- Saldo disponible: ${formatCOPServer(availableBalance)}`,
    `Categorías válidas para registrar gastos: ${EXPENSE_CATEGORIES.join(', ')}.`,
    'Reglas de comportamiento:',
    '1. Cuando el usuario mencione que realizó o pagó un gasto (ej. "Gasté 500 en comida hoy", "Pagué 18.000 de taxi ayer"), llama inmediatamente a la función registerExpense con los 4 campos requeridos.',
    `2. Convierte fechas relativas como "hoy" (${currentDate}) o "ayer" al formato estricto YYYY-MM-DD usando la fecha actual de referencia.`,
    '3. Si el usuario pregunta por su presupuesto, gastos o saldo disponible, responde con las cifras exactas del contexto en formato COP.',
    '4. Siempre confirma de manera breve y cordial los datos del gasto al usar registerExpense. Si el monto no está claro o falta, pídelo amablemente antes de registrar.',
    '5. Imagen (ticket, recibo, captura de compra o apunte de gasto): extrae monto, fecha y descripción (y deduce la categoría). Si la imagen es borrosa, algún dato no se ve, está dudoso o falta (por ejemplo falta el monto, la fecha o la descripción), PREGUNTA al usuario antes de guardar; NO inventes datos ni información.',
    '6. Audio / Nota de voz: analiza la transcripción o el audio y extrae monto, fecha y descripción. Si falta algún dato o hay ambigüedad, PREGUNTA al usuario antes de guardar; NO inventes datos.',
    '7. Validación de archivos: si la imagen o el audio NO tiene que ver con gastos o finanzas de Mi Presupuesto, indica claramente que no puedes procesarlo ni registrarlo.',
    `8. Reglas de registro: usa siempre la herramienta registerExpense para guardar datos confirmados. Al finalizar un registro, dirígete al usuario por su nombre (ej: "¡Listo, ${userName}! He guardado tu gasto...").`,
    '9. Consultas de compras: cuando el usuario pregunte si puede comprar algo o consulte por una compra futura, compara el gasto solicitado con el saldo disponible actual en el contexto e indícale cuánto le quedaría o si excede su presupuesto.',
  ].join('\n');
}

async function transcribeAudioWithGemini(
  mimeType: string,
  base64Data: string
): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: 'Transcribe fielmente este audio en español. Devuelve únicamente la transcripción exacta de lo que dice la persona. Si no hay voz comprensible, describe brevemente lo que se escucha.',
          },
        ],
      },
    });

    const extracted = extractPartsFromCandidate(
      response.candidates?.[0]?.content?.parts
    );
    return extracted.text || null;
  } catch (err) {
    console.warn(
      '[Assistant] Transcripción previa con gemini-3.5-transcribe no disponible, usando audio directo en cascada:',
      extractErrorInfo(err).message
    );
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.post('/api/assistant/chat', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          status: 500,
          error:
            'GEMINI_API_KEY no está configurada en el servidor. Configúrala en Settings > Secrets.',
        });
        return;
      }

      const { message, history, budgetContext, attachments } = req.body as {
        message?: string;
        history?: ChatHistoryItem[];
        budgetContext?: BudgetContextPayload;
        attachments?: AttachmentPayload[];
      };

      const validAttachments = Array.isArray(attachments)
        ? attachments.filter(
            (att) =>
              att &&
              (att.kind === 'image' || att.kind === 'audio') &&
              typeof att.data === 'string' &&
              att.data.trim().length > 0 &&
              typeof att.mimeType === 'string'
          )
        : [];

      const trimmedMessage = typeof message === 'string' ? message.trim() : '';

      if (!trimmedMessage && validAttachments.length === 0) {
        res.status(400).json({
          status: 400,
          error: 'Envía un mensaje, una imagen o una nota de voz.',
        });
        return;
      }

      const sanitizedHistory: ChatMessage[] = Array.isArray(history)
        ? history
            .filter(
              (item) =>
                item &&
                (item.role === 'user' || item.role === 'model') &&
                typeof item.text === 'string' &&
                item.text.trim().length > 0
            )
            .slice(-12)
            .map((item) => ({
              role: item.role,
              parts: [{ text: item.text.trim() }],
            }))
        : [];

      const currentUserParts: Part[] = [];
      let audioTranscription: string | null = null;

      for (const att of validAttachments) {
        const cleanMime = normalizeMimeType(att.mimeType, att.kind);
        const cleanData = stripBase64Prefix(att.data);

        if (att.kind === 'audio') {
          const transcript = await transcribeAudioWithGemini(
            cleanMime,
            cleanData
          );
          if (transcript) {
            audioTranscription = transcript;
            currentUserParts.push({
              text: `[Nota de voz transcrita]: "${transcript}"`,
            });
          } else {
            currentUserParts.push({
              inlineData: {
                mimeType: cleanMime,
                data: cleanData,
              },
            });
          }
        } else {
          currentUserParts.push({
            inlineData: {
              mimeType: cleanMime,
              data: cleanData,
            },
          });
        }
      }

      if (trimmedMessage) {
        currentUserParts.push({ text: trimmedMessage });
      } else if (validAttachments.some((a) => a.kind === 'image')) {
        currentUserParts.push({
          text: 'Analiza esta imagen. Si es un recibo, ticket, captura de compra o apunte de gasto, extrae monto, fecha y descripción. Si falta algún dato o está borroso, pregúntame antes de guardar. Si no es sobre gastos o finanzas, indícame que no puedes procesarlo.',
        });
      } else if (!audioTranscription) {
        currentUserParts.push({
          text: 'Transcribe esta nota de voz y extrae monto, fecha y descripción si se trata de un gasto. Si falta información o no trata de gastos, indícamelo sin inventar datos.',
        });
      }

      const contents: ChatMessage[] = [
        ...sanitizedHistory,
        {
          role: 'user',
          parts: currentUserParts,
        },
      ];

      const userName =
        (budgetContext?.userName || 'Usuario').trim() || 'Usuario';
      const systemInstruction = buildSystemInstruction(budgetContext ?? {});

      let lastErrorStatus = 500;
      let lastErrorMessage = 'No se pudo obtener respuesta del modelo.';
      const attemptedModels: string[] = [];

      for (const modelName of MODEL_CASCADE) {
        attemptedModels.push(modelName);
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              tools: [{ functionDeclarations: [registerExpenseDeclaration] }],
            },
          });

          const previousContent = response.candidates?.[0]?.content;
          const extracted = extractPartsFromCandidate(previousContent?.parts);

          let finalText = extracted.text;

          // Si el modelo llamó registerExpense sin texto de confirmación, ejecutar Turn 2 para confirmar usando el nombre del usuario
          if (
            extracted.functionCalls.length > 0 &&
            !finalText &&
            previousContent
          ) {
            const expenseCalls = extracted.functionCalls.filter(
              (fc) => fc.name === 'registerExpense'
            );
            if (expenseCalls.length > 0) {
              try {
                const totalNewAmount = expenseCalls.reduce(
                  (sum, fc) => sum + (Number(fc.args?.amount) || 0),
                  0
                );
                const projectedBalance =
                  Number(budgetContext?.availableBalance ?? 0) - totalNewAmount;

                const followUp = await ai.models.generateContent({
                  model: modelName,
                  contents: [
                    ...contents,
                    previousContent,
                    {
                      role: 'user',
                      parts: expenseCalls.map((fc) => ({
                        functionResponse: {
                          id: fc.id,
                          name: 'registerExpense',
                          response: {
                            status: 'registered',
                            userName,
                            registeredExpense: fc.args ?? {},
                            updatedAvailableBalance:
                              formatCOPServer(projectedBalance),
                          },
                        },
                      })),
                    } as ChatMessage,
                  ],
                  config: {
                    systemInstruction,
                    tools: [
                      { functionDeclarations: [registerExpenseDeclaration] },
                    ],
                  },
                });
                const followUpExtracted = extractPartsFromCandidate(
                  followUp.candidates?.[0]?.content?.parts
                );
                if (followUpExtracted.text) {
                  finalText = followUpExtracted.text;
                }
              } catch (followUpErr) {
                console.warn(
                  '[Assistant] Follow-up confirmation falló, usando confirmación personalizada:',
                  extractErrorInfo(followUpErr).message
                );
              }
            }
          }

          if (extracted.functionCalls.length > 0 && !finalText) {
            const firstArgs = extracted.functionCalls[0]?.args as
              | Record<string, unknown>
              | undefined;
            const amt = Number(firstArgs?.amount || 0);
            const desc =
              typeof firstArgs?.description === 'string'
                ? firstArgs.description
                : 'tu gasto';
            finalText = `¡Listo, ${userName}! He guardado tu gasto de ${formatCOPServer(amt)} (${desc}) y actualicé tu presupuesto.`;
          }

          res.json({
            text: finalText,
            functionCalls: extracted.functionCalls.map((fc) => ({
              id: fc.id,
              name: fc.name,
              args: fc.args ?? {},
            })),
            transcription: audioTranscription,
            modelUsed: modelName,
          });
          return;
        } catch (err) {
          const { status, message: errMsg } = extractErrorInfo(err);
          lastErrorStatus = status;
          lastErrorMessage = errMsg;

          const isCascadeRetryable =
            status === 429 || status === 503 || status === 404;

          console.warn(
            `[Assistant] Modelo "${modelName}" falló (status=${status}): ${errMsg}`
          );

          if (!isCascadeRetryable) {
            break;
          }
        }
      }

      res.status(lastErrorStatus).json({
        status: lastErrorStatus,
        error: lastErrorMessage,
        attemptedModels,
      });
    } catch (err) {
      const { status, message } = extractErrorInfo(err);
      res.status(status).json({
        status,
        error: message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
