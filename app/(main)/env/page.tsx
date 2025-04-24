import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { env } from "@/env";

const EnvPage = () => {
  const clientEnv = {
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_DB_CHAT_API: env.NEXT_PUBLIC_DB_CHAT_API,
  };

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Client Environment Variables</h1>
      <Table>
        <TableCaption>A list of client-side environment variables</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Env Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(clientEnv).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{key}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EnvPage;
