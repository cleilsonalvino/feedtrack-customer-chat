import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Company {
  id: string;
  nome: string;
  cnpj: string | null;
  status: string;
  plano: string;
  qtdUsuarios: number;
  qtdFuncionarios: number;
  qtdClientes: number;
  qtdCampanhas: number;
  qtdFormularios: number;
  qtdEnvios: number;
  qtdFeedbacks: number;
  qtdProdutos: number;
  qtdVendas: number;
  qtdPerguntas: number;
}

export const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/empresas');
        setCompanies(response.data);
      } catch (err) {
        setError('Não foi possível carregar os dados das empresas.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empresas Cadastradas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Funcionários</TableHead>
              <TableHead>Clientes</TableHead>
              <TableHead>Campanhas</TableHead>
              <TableHead>Formulários</TableHead>
              <TableHead>Envios</TableHead>
              <TableHead>Feedbacks</TableHead>
              <TableHead>Produtos</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Perguntas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.nome}</TableCell>
                <TableCell>{company.cnpj ?? 'N/A'}</TableCell>
                <TableCell>{company.status}</TableCell>
                <TableCell>{company.qtdUsuarios}</TableCell>
                <TableCell>{company.qtdFuncionarios}</TableCell>
                <TableCell>{company.qtdClientes}</TableCell>
                <TableCell>{company.qtdCampanhas}</TableCell>
                <TableCell>{company.qtdFormularios}</TableCell>
                <TableCell>{company.qtdEnvios}</TableCell>
                <TableCell>{company.qtdFeedbacks}</TableCell>
                <TableCell>{company.qtdProdutos}</TableCell>
                <TableCell>{company.qtdVendas}</TableCell>
                <TableCell>{company.qtdPerguntas}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
