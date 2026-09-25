import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { EmptyState } from "../components/ui";

export default function NotFound({ title = "Page not found", message = "The page you're looking for doesn't exist or has moved." }) {
  return (
    <div className="container page center-page">
      <EmptyState icon={PawPrint} title={title} action={<Link className="btn btn-primary" to="/">Go home</Link>}>
        {message}
      </EmptyState>
    </div>
  );
}
