
import { CompanyList } from "@/components/CompanyList";
import { CompanyPlanChart } from "@/components/CompanyPlanChart";
import { ProductsChart } from "@/components/ProductsChart";
import { CustomersChart } from "@/components/CustomersChart";
import { UsersChart } from "@/components/UsersChart";
import { FormsChart } from "@/components/FormsChart";
import { FeedbacksChart } from "@/components/FeedbacksChart";
import { SalesChart } from "@/components/SalesChart";
import { CampaignsChart } from "@/components/Campaignchart";

const AdminPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mt-10">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie todas as empresas cadastradas no sistema.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <CompanyPlanChart />
        <ProductsChart />
        <CustomersChart />
        <UsersChart />
        <FormsChart />
        <FeedbacksChart />
        <SalesChart />
        <CampaignsChart/>
      </div>
      <CompanyList />
    </div>
  );
};

export default AdminPage;
