import { FeedbackDataTable } from "@/components/FeedbackDataTable";

const FeedbacksPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mt-10">Feedbacks</h1>
      <p className="text-muted-foreground">
        Gerencie todos os feedbacks da sua empresa.
      </p>
      <FeedbackDataTable />
    </div>
  );
};

export default FeedbacksPage;
