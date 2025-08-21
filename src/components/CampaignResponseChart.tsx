import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, {useContext, useState} from "react";
import { BarChart3 } from "lucide-react"; // Importar o ícone
import { useCampaign } from "@/contexts/CampaignContext";



export const CampaignResponseChart = () => {

  const { campaigns } = useCampaign();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Taxa de Resposta por Campanha
        </CardTitle>
      </CardHeader>
      <CardContent className="blur">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={campaigns}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="titulo" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Taxa de Resposta" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};