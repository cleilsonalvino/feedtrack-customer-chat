import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import api from '../lib/api';
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  ativo: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
  dataExclusao?: string | null;
}

export type NewProductData = {
  nome: string;
  descricao: string;
  valor: number;
};

interface ProductContextType {
  products: Product[];
  loading: boolean;
  addProduct: (productData: NewProductData) => Promise<Product | void>;
  addMultipleProducts: (productsData: NewProductData[]) => Promise<void>; // Nova função
  updateProduct: (updatedProduct: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/produtos');
        setProducts(response.data);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast({
          title: "Erro de Rede",
          description: "Não foi possível carregar os produtos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [toast]);

  const addProduct = async (productData: NewProductData, showToast = true) => {
    try {
      const response = await api.post('/produto', productData);
      const newProduct = response.data;
      setProducts(current => [...current, newProduct]);
      if (showToast) {
        toast({ title: "Sucesso", description: `Produto "${newProduct.nome}" adicionado!` });
      }
      return newProduct;
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      if (showToast) {
        toast({ title: "Erro", description: `Não foi possível adicionar o produto "${productData.nome}".`, variant: "destructive" });
      }
      throw error; // Lança o erro para que o chamador saiba que falhou
    }
  };

  // Função para adicionar múltiplos produtos a partir de um array
  const addMultipleProducts = async (productsData: NewProductData[]) => {
    let successCount = 0;
    let errorCount = 0;

    toast({
        title: "Iniciando importação...",
        description: `Adicionando ${productsData.length} produtos.`,
    });

    for (const productData of productsData) {
      try {
        // Chama a função de adicionar um produto, sem o toast individual
        await addProduct(productData, false);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Falha ao adicionar o produto em lote: ${productData.nome}`, error);
      }
    }

    // Exibe um toast de resumo no final
    if (errorCount > 0) {
        toast({
            title: "Operação Concluída com Erros",
            description: `${successCount} produtos adicionados. ${errorCount} falharam. Verifique o console.`,
            variant: "destructive"
        });
    } else {
        toast({
            title: "Importação Concluída!",
            description: `Todos os ${successCount} produtos foram adicionados com sucesso.`
        });
    }
  };

  const updateProduct = async (productToUpdate: Product) => {
    try {
      const payload = {
        nome: productToUpdate.nome,
        descricao: productToUpdate.descricao,
        valor: productToUpdate.valor,
        ativo: productToUpdate.ativo,
        dataExclusao: productToUpdate.dataExclusao,
      };
      
      if (productToUpdate.ativo && productToUpdate.dataExclusao === null) {
        await api.patch(`/reativar-produto/${productToUpdate.id}`, payload);
      } else {
        await api.put(`/atualizar-produto/${productToUpdate.id}`, payload);
      }
      
      setProducts(current => 
        current.map(p => (p.id === productToUpdate.id ? productToUpdate : p))
      );
      if (productToUpdate.ativo === products.find(p => p.id === productToUpdate.id)?.ativo) {
         toast({ title: "Sucesso", description: "Produto atualizado com sucesso!" });
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o produto.", variant: "destructive" });
    }
  };
  
  const deleteProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const deactivatedProduct: Product = {
      ...product,
      ativo: false,
      dataExclusao: new Date().toISOString(),
    };
    
    await updateProduct(deactivatedProduct);
    toast({ title: "Produto Desativado", description: `"${product.nome}" foi movido para os inativos.` });
  };

  return (
    <ProductContext.Provider value={{ products, loading, addProduct, addMultipleProducts, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProduct must be used within a ProductProvider");
  return context;
};
