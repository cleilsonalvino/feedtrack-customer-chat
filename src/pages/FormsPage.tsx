import React, { useState, useEffect } from "react";
import { useForm, Pergunta, Formulario } from "@/contexts/FormContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Componente de Modal Refatorado para Criar e Editar Perguntas
const QuestionModal = ({
  isOpen,
  onOpenChange,
  questionToEdit,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  questionToEdit?: Pergunta | null;
  onSave: (
    data: { texto: string; tipo: "nota" | "texto" | "multipla_escolha" },
    questionId?: string
  ) => void;
}) => {
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<"nota" | "texto" | "multipla_escolha">("nota");
  const isEditMode = !!questionToEdit;

  // Popula o formulário com dados existentes se estiver em modo de edição
  useEffect(() => {
    if (isEditMode && isOpen) {
      setTexto(questionToEdit.texto);
      setTipo(questionToEdit.tipo);
    } else {
      // Reseta para o modo de criação
      setTexto("");
      setTipo("nota");
    }
  }, [questionToEdit, isOpen]);

  const handleSaveClick = () => {
    if (!texto) return;
    onSave({ texto, tipo }, questionToEdit?.id);
    onOpenChange(false); // Fecha o modal após salvar
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Pergunta" : "Criar Nova Pergunta"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="question-text">Texto da Pergunta</Label>
            <Input
              id="question-text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="question-type">Tipo de Pergunta</Label>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nota">Nota (1-5)</SelectItem>
                <SelectItem value="texto">Texto Aberto</SelectItem>
                <SelectItem value="multipla_escolha" disabled>
                  Múltipla Escolha (em breve)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveClick}>
            {isEditMode ? "Salvar Alterações" : "Criar Pergunta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Componente para o Modal de Edição de Formulário
const EditFormModal = ({
  form,
  isOpen,
  onOpenChange,
}: {
  form: Formulario | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  // Certifique-se de que `updateQuestion` e `addQuestion` estão disponíveis no seu hook
  const { perguntas, updateForm, addQuestion, updateQuestion } = useForm();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Estado para controlar o modal de pergunta
  const [questionModalState, setQuestionModalState] = useState<{
    isOpen: boolean;
    questionToEdit: Pergunta | null;
  }>({ isOpen: false, questionToEdit: null });

  useEffect(() => {
    if (form) {
      setTitulo(form.titulo);
      setDescricao(form.descricao);
      setSelectedQuestionIds(form.perguntas.map((p) => p.id));
    }
  }, [form]);

  const handleUpdate = async () => {
    if (!form) return;
    await updateForm(form.id, {
      titulo,
      descricao,
      idsPerguntas: selectedQuestionIds,
    });
    onOpenChange(false);
  };

  // Abre o modal para editar uma pergunta existente
  const handleEditQuestion = (questionId: string) => {
    const question = perguntas.find((p) => p.id === questionId);
    if (question) {
      setQuestionModalState({ isOpen: true, questionToEdit: question });
    }
  };

  // Abre o modal para criar uma nova pergunta
  const handleCreateQuestion = () => {
    setQuestionModalState({ isOpen: true, questionToEdit: null });
  };

  // Salva a pergunta (cria ou atualiza)
  const handleSaveQuestion = async (
    data: { texto: string; tipo: "nota" | "texto" | "multipla_escolha" },
    questionId?: string
  ) => {
    if (questionId && updateQuestion) {
      // Modo de edição
      await updateQuestion(questionId, data);
    } else {
      // Modo de criação
      const newQuestion = await addQuestion(data);
      if (newQuestion) {
        setSelectedQuestionIds((prev) => [...prev, newQuestion.id]);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Formulário</DialogTitle>
            <DialogDescription>
              Altere o título, descrição e as perguntas do seu formulário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-8 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Detalhes do Formulário</h3>
              <div>
                <Label htmlFor="edit-form-title">Título</Label>
                <Input
                  id="edit-form-title"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-form-desc">Descrição</Label>
                <Input
                  id="edit-form-desc"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Perguntas Disponíveis</h3>
                <Button variant="outline" size="sm" onClick={handleCreateQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Nova Pergunta
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                {perguntas.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between space-x-2"
                  >
                    <div className="flex items-center space-x-2 flex-grow">
                      <Checkbox
                        className="justify-self-start"
                        id={`q-edit-${p.id}`}
                        checked={selectedQuestionIds.includes(p.id)}
                        onCheckedChange={(checked) => {
                          setSelectedQuestionIds((prev) =>
                            checked
                              ? [...prev, p.id]
                              : prev.filter((id) => id !== p.id)
                          );
                        }}
                      />
                      <label htmlFor={`q-edit-${p.id}`} className="text-sm flex-grow">
                        {p.texto || "Pergunta sem texto"}
                      </label>
                    </div>
                    <Edit
                      className="cursor-pointer w-4 h-4 text-muted-foreground hover:text-primary"
                      onClick={() => handleEditQuestion(p.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleUpdate}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* O modal de pergunta é renderizado aqui, controlado pelo estado */}
      <QuestionModal
        isOpen={questionModalState.isOpen}
        onOpenChange={(open) =>
          setQuestionModalState({ ...questionModalState, isOpen: open })
        }
        questionToEdit={questionModalState.questionToEdit}
        onSave={handleSaveQuestion}
      />
    </>
  );
};

// Página Principal de Formulários
export const FormsPage = () => {
  const {
    formularios,
    perguntas,
    addForm,
    deleteForm,
    deleteQuestion,
    getFormById,
    addQuestion,
    updateQuestion, // Garanta que está disponível
    loading,
  } = useForm();
  const { toast } = useToast();

  // Estados para o modal de criação de formulário
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Estados para o modal de edição de formulário
  const [formToEdit, setFormToEdit] = useState<Formulario | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado para o modal de pergunta DENTRO do modal de criação de formulário
  const [createFormQuestionModal, setCreateFormQuestionModal] = useState<{
    isOpen: boolean;
    questionToEdit: Pergunta | null;
  }>({ isOpen: false, questionToEdit: null });

  const handleCreateForm = async () => {
    if (!titulo || selectedQuestionIds.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Título e ao menos uma pergunta são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    const newForm = await addForm({
      titulo,
      descricao,
      idsPerguntas: selectedQuestionIds,
    });
    if (newForm) {
      setTitulo("");
      setDescricao("");
      setSelectedQuestionIds([]);
      setIsCreateModalOpen(false);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion(questionId);
    toast({
      title: "Pergunta removida",
      description: "A pergunta foi removida com sucesso.",
    });
  };

  const handleEditClick = async (formId: string) => {
    setEditingId(formId);
    try {
      const formData = await getFormById(formId);
      if (formData) {
        setFormToEdit(formData);
      }
    } finally {
      setEditingId(null);
    }
  };

  // Handler para salvar perguntas no contexto do modal de CRIAÇÃO de formulário
  const handleSaveQuestionForCreateForm = async (
    data: { texto: string; tipo: "nota" | "texto" | "multipla_escolha" },
    questionId?: string
  ) => {
    // Neste contexto, sempre criaremos uma nova pergunta
    const newQuestion = await addQuestion(data);
    if (newQuestion) {
      setSelectedQuestionIds((prev) => [...prev, newQuestion.id]);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Formulários</h1>
          <p className="text-muted-foreground">
            Crie e gerencie seus formulários de feedback.
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Formulário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Formulário</DialogTitle>
              <DialogDescription>
                Defina um título e selecione as perguntas que farão parte deste
                formulário.
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-8 py-4">
              <div className="space-y-4">
                <h3 className="font-semibold">Detalhes do Formulário</h3>
                <div>
                  <Label htmlFor="form-title">Título</Label>
                  <Input
                    id="form-title"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="form-desc">Descrição</Label>
                  <Input
                    id="form-desc"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Perguntas Disponíveis</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCreateFormQuestionModal({ isOpen: true, questionToEdit: null })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Nova Pergunta
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                  {perguntas.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between space-x-2"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          className="justify-self-start"
                          id={`q-create-${p.id}`}
                          checked={selectedQuestionIds.includes(p.id)}
                          onCheckedChange={(checked) => {
                            setSelectedQuestionIds((prev) =>
                              checked
                                ? [...prev, p.id]
                                : prev.filter((id) => id !== p.id)
                            );
                          }}
                        />
                        <label htmlFor={`q-create-${p.id}`} className="text-sm">
                          {p.texto || "Pergunta sem texto"}
                        </label>
                      </div>
                      <Trash2
                        className="cursor-pointer w-4 h-4 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteQuestion(p.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateForm}>Criar Formulário</Button>
            </DialogFooter>
             <QuestionModal
                isOpen={createFormQuestionModal.isOpen}
                onOpenChange={(open) =>
                  setCreateFormQuestionModal({ ...createFormQuestionModal, isOpen: open })
                }
                questionToEdit={createFormQuestionModal.questionToEdit}
                onSave={handleSaveQuestionForCreateForm}
              />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulários Criados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="animate-spin w-6 h-6 text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {formularios.map((form) => (
                <Card key={form.id}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>{form.titulo}</CardTitle>
                      <CardDescription>{form.descricao}</CardDescription>
                    </div>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            {editingId === form.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => handleEditClick(form.id)}
                            disabled={!!editingId}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-red-600 focus:text-red-600"
                              disabled={!!editingId}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá
                            permanentemente o formulário "{form.titulo}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteForm(form.id)}
                          >
                            Sim, excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-semibold mb-2">
                      Perguntas ({(form.perguntas || []).length}):
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {(form.perguntas || []).map((p) => (
                        <li key={p.id}>{p.texto || "Pergunta sem texto"}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditFormModal
        isOpen={!!formToEdit}
        onOpenChange={(open) => !open && setFormToEdit(null)}
        form={formToEdit}
      />
    </div>
  );
};
