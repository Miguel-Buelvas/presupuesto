import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileAudio,
  ImagePlus,
  Mic,
  Pencil,
  Send,
  Sparkles,
  Square,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { formatCOP } from '../data/budgetData';

export interface AssistantBudgetContext {
  userName: string;
  monthLabel: string;
  monthId: string;
  currentDate: string;
  monthlyBudget: number;
  totalSpent: number;
  availableBalance: number;
  totalIncome: number;
}

export interface RegisterExpenseArgs {
  amount: number;
  date: string;
  description: string;
  category: string;
}

export interface RegisteredExpenseReceipt {
  title: string;
  amount: number;
  category: string;
  dateLabel: string;
}

interface PendingAttachment {
  kind: 'image' | 'audio';
  mimeType: string;
  data: string; // data URL or base64
  previewUrl: string;
  fileName: string;
}

interface MessageAttachmentPreview {
  kind: 'image' | 'audio';
  previewUrl: string;
  fileName: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  attachments?: MessageAttachmentPreview[];
  transcription?: string | null;
  registeredExpenses?: RegisteredExpenseReceipt[];
}

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onChangeUserName: (name: string) => void;
  budgetContext: Omit<AssistantBudgetContext, 'userName' | 'currentDate'>;
  onRegisterExpense: (
    args: RegisterExpenseArgs
  ) => RegisteredExpenseReceipt | null;
}

interface ServerFunctionCall {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
}

interface ServerChatResponse {
  text?: string;
  functionCalls?: ServerFunctionCall[];
  transcription?: string | null;
  status?: number;
  error?: string;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const QUICK_PROMPTS = [
  'Gasté 25.000 en almuerzo hoy',
  '¿Puedo comprar unos audífonos de 180.000?',
  '¿Cuánto saldo disponible tengo?',
];

function getLocalIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo leer el archivo.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsDataURL(blob);
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function AssistantDrawer({
  isOpen,
  onClose,
  userName,
  onChangeUserName,
  budgetContext,
  onRegisterExpense,
}: AssistantDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: `¡Hola, ${userName}! Dime qué pagaste, sube la foto de un recibo o graba una nota de voz. También puedes consultarme si una compra cabe en tu presupuesto.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(userName);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setDraftName(userName);
  }, [userName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isEditingName) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingName, onClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (!isEditingName) {
          inputRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages, isLoading, pendingAttachment, isEditingName]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current !== null) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const mapServerErrorToMessage = (
    statusCode: number,
    serverError?: string
  ): string => {
    const normalized = (serverError || '').toUpperCase();
    if (
      statusCode === 503 ||
      normalized.includes('503') ||
      normalized.includes('UNAVAILABLE') ||
      normalized.includes('OVERLOADED') ||
      normalized.includes('HIGH DEMAND')
    ) {
      return 'El asistente está muy solicitado en este momento. Por favor, intenta de nuevo en un minuto.';
    }
    if (
      statusCode === 429 ||
      normalized.includes('429') ||
      normalized.includes('RESOURCE_EXHAUSTED') ||
      normalized.includes('QUOTA')
    ) {
      return 'He alcanzado mi límite de mensajes por ahora. Intenta de nuevo más tarde.';
    }
    return (
      serverError ||
      `Error técnico del servidor (${statusCode || 500}) al procesar tu solicitud.`
    );
  };

  const handleSaveUserName = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = draftName.trim();
    if (cleaned) {
      onChangeUserName(cleaned);
    } else {
      setDraftName(userName);
    }
    setIsEditingName(false);
  };

  const handleFileSelected = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: 'image' | 'audio'
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setAttachmentError(null);

    if (file.size > MAX_FILE_BYTES) {
      setAttachmentError(
        'El archivo supera el límite de 10 MB. Selecciona un archivo más liviano.'
      );
      return;
    }

    try {
      const dataUrl = await readBlobAsDataUrl(file);
      const fallbackMime = kind === 'image' ? 'image/jpeg' : 'audio/mp3';
      setPendingAttachment({
        kind,
        mimeType: file.type || fallbackMime,
        data: dataUrl,
        previewUrl: dataUrl,
        fileName: file.name,
      });
    } catch {
      setAttachmentError('No se pudo cargar el archivo seleccionado.');
    }
  };

  const stopRecordingCleanup = () => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleStartRecording = async () => {
    if (isLoading || isRecording) return;
    setAttachmentError(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setAttachmentError(
        'Tu navegador no admite grabación de audio. Puedes subir un archivo de audio usando el botón de audio.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const supportedMime = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      recordedChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) {
          recordedChunksRef.current.push(evt.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        stopRecordingCleanup();

        if (blob.size === 0) {
          setAttachmentError('La grabación está vacía. Intenta de nuevo.');
          return;
        }
        if (blob.size > MAX_FILE_BYTES) {
          setAttachmentError('La nota de voz supera el límite de 10 MB.');
          return;
        }

        try {
          const dataUrl = await readBlobAsDataUrl(blob);
          setPendingAttachment({
            kind: 'audio',
            mimeType,
            data: dataUrl,
            previewUrl: dataUrl,
            fileName: `Nota de voz (${formatDuration(recordingSeconds)})`,
          });
        } catch {
          setAttachmentError('No se pudo procesar la nota de voz grabada.');
        }
      };

      setRecordingSeconds(0);
      setIsRecording(true);
      recorder.start();

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      stopRecordingCleanup();
      const errName = err instanceof Error ? err.name : '';
      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError'
      ) {
        setAttachmentError(
          'Permiso de micrófono denegado. Habilita el micrófono en tu navegador o sube un archivo de audio.'
        );
      } else if (errName === 'NotFoundError') {
        setAttachmentError(
          'No se detectó un micrófono disponible. Puedes subir un archivo de audio.'
        );
      } else {
        setAttachmentError(
          'No se pudo iniciar la grabación de audio. Intenta de nuevo.'
        );
      }
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    } else {
      stopRecordingCleanup();
    }
  };

  const sendMessage = async (
    rawText: string,
    attachmentToSend?: PendingAttachment | null
  ) => {
    const trimmed = rawText.trim();
    const activeAttachment =
      attachmentToSend !== undefined ? attachmentToSend : pendingAttachment;

    if ((!trimmed && !activeAttachment) || isLoading || isRecording) return;

    setAttachmentError(null);

    const displayText =
      trimmed ||
      (activeAttachment?.kind === 'image'
        ? 'Imagen adjunta para analizar'
        : 'Nota de voz adjunta');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: displayText,
      attachments: activeAttachment
        ? [
            {
              kind: activeAttachment.kind,
              previewUrl: activeAttachment.previewUrl,
              fileName: activeAttachment.fileName,
            },
          ]
        : undefined,
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome-msg' && m.role !== 'error')
      .map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        text: m.transcription
          ? `${m.text}\n[Transcripción]: ${m.transcription}`
          : m.text,
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setPendingAttachment(null);
    setIsLoading(true);

    const dynamicContext: AssistantBudgetContext = {
      ...budgetContext,
      userName,
      currentDate: getLocalIsoDate(),
    };

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          budgetContext: dynamicContext,
          attachments: activeAttachment
            ? [
                {
                  kind: activeAttachment.kind,
                  mimeType: activeAttachment.mimeType,
                  data: activeAttachment.data,
                  fileName: activeAttachment.fileName,
                },
              ]
            : undefined,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data: ServerChatResponse = contentType.includes('application/json')
        ? ((await response.json()) as ServerChatResponse)
        : {
            status: response.status,
            error: await response.text(),
          };

      if (!response.ok) {
        const errorText = mapServerErrorToMessage(
          data.status ?? response.status,
          data.error
        );
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'error',
            text: errorText,
          },
        ]);
        return;
      }

      const registeredExpenses: RegisteredExpenseReceipt[] = [];
      if (Array.isArray(data.functionCalls)) {
        for (const fnCall of data.functionCalls) {
          if (fnCall.name === 'registerExpense' && fnCall.args) {
            const rawArgs = fnCall.args;
            const parsedAmount = Number(rawArgs.amount);
            const description =
              typeof rawArgs.description === 'string' &&
              rawArgs.description.trim()
                ? rawArgs.description.trim()
                : 'Gasto registrado';
            const category =
              typeof rawArgs.category === 'string' && rawArgs.category.trim()
                ? rawArgs.category.trim()
                : 'Alimentación';
            const date =
              typeof rawArgs.date === 'string' && rawArgs.date.trim()
                ? rawArgs.date.trim()
                : dynamicContext.currentDate;

            if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
              const receipt = onRegisterExpense({
                amount: parsedAmount,
                date,
                description,
                category,
              });
              if (receipt) {
                registeredExpenses.push(receipt);
              }
            }
          }
        }
      }

      const replyText =
        typeof data.text === 'string' && data.text.trim().length > 0
          ? data.text.trim()
          : registeredExpenses.length > 0
            ? `¡Listo, ${userName}! He guardado tu gasto y actualizado tu presupuesto.`
            : 'No recibí contenido de respuesta. Intenta reformular tu solicitud.';

      setMessages((prev) => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: replyText,
          transcription: data.transcription ?? null,
          registeredExpenses:
            registeredExpenses.length > 0 ? registeredExpenses : undefined,
        },
      ]);
    } catch (err) {
      const technicalMessage =
        err instanceof Error
          ? err.message
          : 'Error de conexión con el servidor.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'error',
          text: technicalMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(inputValue);
  };

  const handleClearChat = () => {
    if (isLoading || isRecording) return;
    setPendingAttachment(null);
    setAttachmentError(null);
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        text: `¡Hola, ${userName}! Dime qué pagaste, sube la foto de un recibo o graba una nota de voz. También puedes consultarme si una compra cabe en tu presupuesto.`,
      },
    ]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-drawer-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-violet-400/25 bg-[#0e0d1d] shadow-[-16px_0_48px_rgba(0,0,0,0.65)]"
          >
            {/* Header */}
            <div className="border-b border-violet-400/15 bg-[#121126] px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b6dff] to-[#5B3DF5] text-white shadow-[0_0_20px_rgba(91,61,245,0.45)]"
                  >
                    <Sparkles className="h-5 w-5" strokeWidth={2.1} />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="assistant-drawer-title"
                      className="truncate font-display text-base font-bold text-white"
                    >
                      Asistente de Presupuesto
                    </h2>
                    <p className="truncate text-xs text-slate-400 tabular-nums">
                      {budgetContext.monthLabel} &middot; Disponible:{' '}
                      <span
                        className={
                          budgetContext.availableBalance >= 0
                            ? 'text-[#10f5a0] font-semibold'
                            : 'text-rose-400 font-semibold'
                        }
                      >
                        {formatCOP(budgetContext.availableBalance)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {messages.length > 1 && (
                    <button
                      type="button"
                      onClick={handleClearChat}
                      disabled={isLoading || isRecording}
                      aria-label="Limpiar conversación"
                      title="Limpiar conversación"
                      className="rounded-xl border border-violet-400/15 bg-[#181632] p-2 text-slate-400 hover:text-white hover:border-violet-400/35 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar asistente"
                    className="rounded-xl border border-violet-400/15 bg-[#181632] p-2 text-slate-300 hover:text-white hover:border-violet-400/35 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* User Name Row (used in dynamic context & personalized confirmation) */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-violet-400/15 bg-[#0b0a18] px-3 py-1.5 text-xs">
                {isEditingName ? (
                  <form
                    onSubmit={handleSaveUserName}
                    className="flex w-full items-center gap-2"
                  >
                    <User
                      className="h-3.5 w-3.5 shrink-0 text-violet-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      autoFocus
                      maxLength={32}
                      placeholder="Tu nombre"
                      aria-label="Nombre del usuario"
                      className="min-w-0 flex-1 bg-transparent text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Guardar nombre"
                      className="rounded-lg bg-[#10f5a0] p-1 text-[#090915] hover:brightness-110"
                    >
                      <Check className="h-3 w-3" strokeWidth={2.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftName(userName);
                        setIsEditingName(false);
                      }}
                      aria-label="Cancelar edición de nombre"
                      className="rounded-lg p-1 text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0 text-slate-300">
                      <User
                        className="h-3.5 w-3.5 shrink-0 text-violet-400"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        Usuario:{' '}
                        <strong className="text-white font-semibold">
                          {userName}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-300 hover:text-[#10f5a0] transition-colors shrink-0"
                    >
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      <span>Cambiar</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] space-y-2 rounded-2xl rounded-br-sm bg-gradient-to-r from-[#5B3DF5] to-[#7c5dfa] px-4 py-2.5 text-sm text-white shadow-[0_4px_16px_rgba(91,61,245,0.3)]">
                        {msg.attachments?.map((att, idx) => (
                          <div key={`${msg.id}-att-${idx}`}>
                            {att.kind === 'image' ? (
                              <img
                                src={att.previewUrl}
                                alt={att.fileName}
                                className="max-h-48 w-full rounded-xl object-cover border border-white/20"
                              />
                            ) : (
                              <div className="rounded-xl bg-black/25 p-2 space-y-1">
                                <p className="text-[11px] text-violet-100 truncate">
                                  {att.fileName}
                                </p>
                                <audio
                                  controls
                                  src={att.previewUrl}
                                  className="h-8 w-56 max-w-full"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                      </div>
                    </div>
                  );
                }

                if (msg.role === 'error') {
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div
                        role="alert"
                        className="max-w-[90%] rounded-2xl rounded-bl-sm border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertCircle
                            className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                            aria-hidden="true"
                          />
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[90%] space-y-2.5">
                      <div className="rounded-2xl rounded-bl-sm border border-violet-400/20 bg-[#15142b] px-4 py-3 text-sm leading-relaxed text-slate-100 space-y-2">
                        {msg.transcription && (
                          <p className="rounded-lg border border-violet-400/15 bg-[#0e0d1d] px-2.5 py-1.5 text-xs text-slate-300 italic">
                            Audio transcrito: &ldquo;{msg.transcription}&rdquo;
                          </p>
                        )}
                        <p>{msg.text}</p>
                      </div>

                      {msg.registeredExpenses &&
                        msg.registeredExpenses.map((receipt, idx) => (
                          <div
                            key={`${msg.id}-receipt-${idx}`}
                            className="rounded-xl border border-[#10f5a0]/35 bg-emerald-500/10 px-3.5 py-2.5"
                          >
                            <div className="flex items-start gap-2.5">
                              <CheckCircle2
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#10f5a0]"
                                strokeWidth={2.4}
                                aria-hidden="true"
                              />
                              <div className="min-w-0 flex-1 text-xs">
                                <p className="font-semibold text-[#10f5a0]">
                                  Gasto registrado en el Dashboard
                                </p>
                                <p className="mt-1 text-slate-100 font-medium truncate">
                                  {receipt.title} &middot;{' '}
                                  <span className="tabular-nums font-bold text-white">
                                    {formatCOP(receipt.amount)}
                                  </span>
                                </p>
                                <p className="mt-0.5 text-slate-300/90">
                                  {receipt.category} &middot; {receipt.dateLabel}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}

              {/* Animated "escribiendo..." Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start" aria-live="polite">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-violet-400/20 bg-[#15142b] px-4 py-2.5 text-xs text-slate-300">
                    <span>escribiendo</span>
                    <span className="inline-flex items-center gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10f5a0] animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10f5a0] animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10f5a0] animate-bounce" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips (only when conversation is fresh and no pending attachment) */}
            {messages.length <= 2 &&
              !isLoading &&
              !pendingAttachment &&
              !isRecording && (
                <div className="border-t border-violet-400/10 bg-[#100f22] px-4 py-2.5">
                  <p className="mb-2 text-[11px] font-medium text-slate-400">
                    Prueba diciendo o adjuntando un recibo / nota de voz:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => void sendMessage(promptText, null)}
                        className="rounded-lg border border-violet-400/20 bg-[#171530] px-2.5 py-1.5 text-left text-xs text-slate-200 hover:border-violet-400/45 hover:bg-[#1e1c3f] transition-colors"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Attachment / Mic Error Alert */}
            {attachmentError && (
              <div
                role="alert"
                className="border-t border-rose-500/30 bg-rose-500/10 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-rose-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{attachmentError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentError(null)}
                  aria-label="Cerrar error de adjunto"
                  className="text-rose-300 hover:text-white shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Pending Attachment Preview */}
            {pendingAttachment && (
              <div className="border-t border-violet-400/15 bg-[#121126] px-4 pt-3">
                <div className="flex items-center gap-3 rounded-xl border border-violet-400/25 bg-[#0b0a18] p-2.5">
                  {pendingAttachment.kind === 'image' ? (
                    <img
                      src={pendingAttachment.previewUrl}
                      alt={pendingAttachment.fileName}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover border border-violet-400/20"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                      <FileAudio className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">
                      {pendingAttachment.fileName}
                    </p>
                    {pendingAttachment.kind === 'audio' ? (
                      <audio
                        controls
                        src={pendingAttachment.previewUrl}
                        className="mt-1 h-7 w-full"
                      />
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Imagen lista para analizar
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPendingAttachment(null)}
                    aria-label="Quitar archivo adjunto"
                    className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-violet-500/15"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Recording Bar */}
            {isRecording && (
              <div className="border-t border-rose-500/30 bg-rose-500/10 px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-rose-200">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"
                    aria-hidden="true"
                  />
                  <span>
                    Grabando nota de voz...{' '}
                    <strong className="tabular-nums font-semibold text-white">
                      {formatDuration(recordingSeconds)}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-400 transition-colors"
                >
                  <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                  <span>Detener</span>
                </button>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleFileSelected(e, 'image')}
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => void handleFileSelected(e, 'audio')}
            />

            {/* Input Form + Multimodal Toolbar */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-violet-400/15 bg-[#121126] p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading || isRecording}
                  title="Subir foto o recibo"
                  aria-label="Subir foto o recibo"
                  className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-[#090915] text-slate-300 hover:border-violet-400/50 hover:text-white transition-colors disabled:opacity-40"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isLoading || isRecording}
                  title="Cargar archivo de audio"
                  aria-label="Cargar archivo de audio"
                  className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-[#090915] text-slate-300 hover:border-violet-400/50 hover:text-white transition-colors disabled:opacity-40"
                >
                  <FileAudio className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={
                    isRecording ? handleStopRecording : handleStartRecording
                  }
                  disabled={isLoading}
                  title={
                    isRecording
                      ? 'Detener grabación'
                      : 'Grabar nota de voz con micrófono'
                  }
                  aria-label={
                    isRecording
                      ? 'Detener grabación'
                      : 'Grabar nota de voz con micrófono'
                  }
                  className={`inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-40 ${
                    isRecording
                      ? 'border-rose-400 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                      : 'border-violet-400/25 bg-[#090915] text-slate-300 hover:border-[#10f5a0]/60 hover:text-[#10f5a0]'
                  }`}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                  ) : (
                    <Mic className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading || isRecording}
                  placeholder={
                    pendingAttachment
                      ? 'Añade una nota opcional o envía...'
                      : 'Escribe, sube recibo o graba audio...'
                  }
                  aria-label="Escribe un gasto o pregunta sobre tu presupuesto"
                  className="min-w-0 flex-1 rounded-xl border border-violet-400/25 bg-[#090915] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#10f5a0] focus:outline-none disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    isRecording ||
                    (!inputValue.trim() && !pendingAttachment)
                  }
                  aria-label="Enviar mensaje"
                  className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#5B3DF5] to-[#7c5dfa] text-white shadow-[0_0_16px_rgba(91,61,245,0.4)] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10f5a0]"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
