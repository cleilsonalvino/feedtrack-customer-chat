import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import { useDebounce } from '@/hooks/use-debounce';

interface Feedback {
  _id: string;
  _clienteNome: string;
  _produtoNome: string;
  _respostas: { tipo: "nota" | "texto"; nota?: number; resposta_texto?: string }[];
  _dataCriacao: string;
}

export const FeedbackDataTable = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (!user?.empresaId) return;

    const fetchFeedbacks = async () => {
      try {
        const response = await api.get(`/feedbacks/empresa/${user.empresaId}`);
        setFeedbacks(response.data);
      } catch (err) {
        setError('Não foi possível carregar os feedbacks.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [user?.empresaId]);

  const handleDelete = async () => {
    if (!selectedFeedback) return;
    try {
      await api.delete(`/feedbacks/${selectedFeedback._id}`);
      setIsAlertOpen(false);
      // Refresh feedbacks
      const response = await api.get(`/feedbacks/empresa/${user.empresaId}`);
      setFeedbacks(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback._clienteNome.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    feedback._produtoNome.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentPageData = filteredFeedbacks.slice(offset, offset + itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  if (loading) return <div>Carregando feedbacks...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos os Feedbacks</CardTitle>
        <Input
          placeholder="Pesquisar por cliente ou produto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageData.map(feedback => (
              <TableRow key={feedback._id}>
                <TableCell>{feedback._clienteNome}</TableCell>
                <TableCell>{feedback._produtoNome}</TableCell>
                <TableCell>{new Date(feedback._dataCriacao).toLocaleDateString()}</TableCell>
                <TableCell>
                  <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" onClick={() => setSelectedFeedback(feedback)}>Excluir</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente o feedback.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ReactPaginate
          previousLabel={"Anterior"}
          nextLabel={"Próximo"}
          breakLabel={'...'}
          pageCount={pageCount}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={handlePageClick}
          containerClassName={'flex justify-center mt-4'}
          pageClassName={'mx-1'}
          pageLinkClassName={'px-3 py-1 border rounded'}
          previousClassName={'mx-1'}
          previousLinkClassName={'px-3 py-1 border rounded'}
          nextClassName={'mx-1'}
          nextLinkClassName={'px-3 py-1 border rounded'}
          breakClassName={'mx-1'}
          breakLinkClassName={'px-3 py-1 border rounded'}
          activeClassName={'bg-primary text-primary-foreground'}
        />
      </CardContent>
    </Card>
  );
};
