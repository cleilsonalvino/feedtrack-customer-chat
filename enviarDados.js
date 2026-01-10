const url = "http://localhost:3006/api/v1/produto";
const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhhYTg0OTY0LWFlYjAtNGM1ZS05YzY5LWRjZjZhZTU3NTE2YyIsIm5vbWVVc3VhcmlvIjoiYWRtaW5fY2xlaWxzb250ZWNoIiwidGlwbyI6IkFETUlOIiwiaWF0IjoxNzU2MjY2MTQyLCJleHAiOjE3NTYyNjk3NDJ9.SPMUNeR1lrzsTN6trp6RSQ_MXaUhI_y7hzYXu_TfK0Y";

const produtos = [
  { nome: "calça jeans", descricao: "Calça jeans azul clara", valor: 120 },
  { nome: "camisa social", descricao: "Camisa social branca", valor: 80 },
  { nome: "bermuda", descricao: "Bermuda tactel preta", valor: 60 },
  { nome: "jaqueta", descricao: "Jaqueta de couro marrom", valor: 350 },
  { nome: "tênis esportivo", descricao: "Tênis de corrida confortável", valor: 200 },
  { nome: "moletom", descricao: "Moletom cinza com capuz", valor: 150 },
  { nome: "boné", descricao: "Boné aba reta preto", valor: 50 },
  { nome: "meia esportiva", descricao: "Par de meias brancas", valor: 20 },
  { nome: "camiseta polo", descricao: "Camiseta polo azul marinho", valor: 90 },
  { nome: "jaqueta jeans", descricao: "Jaqueta jeans feminina", valor: 180 },
  { nome: "saia longa", descricao: "Saia longa estampada", valor: 100 },
  { nome: "vestido casual", descricao: "Vestido casual floral", valor: 130 },
  { nome: "sandália", descricao: "Sandália rasteira feminina", valor: 70 },
  { nome: "sapato social", descricao: "Sapato social masculino preto", valor: 220 },
  { nome: "camiseta básica", descricao: "Camiseta branca algodão", valor: 40 },
  { nome: "blusa de frio", descricao: "Blusa de frio listrada", valor: 110 },
  { nome: "calça social", descricao: "Calça social masculina preta", valor: 140 },
  { nome: "jaqueta impermeável", descricao: "Jaqueta impermeável esportiva", valor: 250 },
  { nome: "bolsa feminina", descricao: "Bolsa tiracolo preta", valor: 180 },
  { nome: "relógio esportivo", descricao: "Relógio digital à prova d'água", valor: 300 }
];


(async () => {
  for (const p of produtos) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({
          ...p,
          empresaId: "e6f99c59-94a1-409d-b095-8f709563cf1f",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro ao criar produto:", p.nome, "-", errorText);
        continue;
      }

      const data = await res.json();
      console.log("Criado:", data);
    } catch (err) {
      console.error("Erro de rede ao criar produto:", p.nome, "-", err.message);
    }
  }
})();
