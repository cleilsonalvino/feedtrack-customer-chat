import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

// Tipos de API (sem alteração)
export type FeedbackApiResponse = {
    id: string;
    formularioId: string;
    envioId: string;
    respostas: { perguntaId: string; resposta: any }[];
    dataCriacao: string;
    dataExclusao?: string | null;
};

export type FeedbackApiRequest = {
    formularioId: string;
    envioId: string;
    respostas: { perguntaId: string; resposta: any }[];
};

// NOVO TIPO: Define a estrutura do JSON de entrada manual
export type ManualFeedbackRequest = {
    formularioId: string;
    envioId: string;
    respostas: {
        perguntaId: string;
        tipo: 'texto' | 'nota' | string; // 'string' para outros tipos futuros
        resposta_texto?: string;
        nota?: number;
    }[];
};

type FeedBackContextType = {
    feedbacks: FeedbackApiResponse[];
    fetchFeedbacks: () => Promise<void>;
    getFeedbackByEnvioId: (envioId: string) => Promise<FeedbackApiResponse | null>;
    createFeedback: (data: FeedbackApiRequest) => Promise<FeedbackApiResponse | null>;
    createManualFeedback: (data: ManualFeedbackRequest) => Promise<FeedbackApiResponse | null>; // Nova função
    deleteFeedback: (id: string) => Promise<boolean>;
    loading: boolean;
    error: string | null;
};

const FeedBackContext = createContext<FeedBackContextType | undefined>(undefined);

export const useFeedBack = () => {
    const ctx = useContext(FeedBackContext);
    if (!ctx) throw new Error("useFeedBack must be used within FeedBackProvider");
    return ctx;
};

export const FeedBackProvider = ({ children }: { children: ReactNode }) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackApiResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFeedbacks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/feedbacks");
            if (!res.ok) throw new Error("Erro ao buscar feedbacks");
            const data = await res.json();
            setFeedbacks(data);
        } catch (err: any) {
            setError(err.message || "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    const getFeedbackByEnvioId = useCallback(async (envioId: string) => {
        // ...código existente
        return null;
    }, []);

    const createFeedback = useCallback(async (data: FeedbackApiRequest) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.status === 400) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Dados inválidos");
            }
            if (!res.ok) throw new Error("Erro ao criar feedback");
            const created = await res.json();
            setFeedbacks((prev) => [created, ...prev]);
            return created as FeedbackApiResponse;
        } catch (err: any) {
            setError(err.message || "Erro desconhecido");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Função que converte e envia o feedback manual
    const createManualFeedback = useCallback(async (manualData: ManualFeedbackRequest) => {
        const convertedRespostas = manualData.respostas.map(r => {
            let valorResposta: any;
            if (r.tipo === 'texto') {
                valorResposta = r.resposta_texto;
            } else if (r.tipo === 'nota') {
                valorResposta = r.nota;
            } else {
                // Tenta encontrar um valor em qualquer campo, para flexibilidade
                valorResposta = (r as any).resposta || r.resposta_texto || r.nota || null;
            }
            return {
                perguntaId: r.perguntaId,
                resposta: valorResposta,
            };
        });

        const apiRequestData: FeedbackApiRequest = {
            formularioId: manualData.formularioId,
            envioId: manualData.envioId,
            respostas: convertedRespostas,
        };

        // Reutiliza a lógica de criação de feedback existente
        return createFeedback(apiRequestData);

    }, [createFeedback]);

    const deleteFeedback = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/feedback/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao excluir feedback");
            setFeedbacks((prev) => prev.filter((f) => f.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message || "Erro desconhecido");
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <FeedBackContext.Provider
            value={{
                feedbacks,
                fetchFeedbacks,
                getFeedbackByEnvioId,
                createFeedback,
                createManualFeedback, // Exporta a nova função
                deleteFeedback,
                loading,
                error,
            }}
        >
            {children}
        </FeedBackContext.Provider>
    );
};
