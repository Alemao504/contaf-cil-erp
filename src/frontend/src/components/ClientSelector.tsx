import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "../context/AppContext";

export default function ClientSelector() {
  const { clients, selectedClientId, setSelectedClientId } = useAppContext();

  if (clients.length === 0) return null;

  return (
    <Select value={selectedClientId ?? ""} onValueChange={setSelectedClientId}>
      <SelectTrigger
        data-ocid="header.client.select"
        className="w-52 h-8 text-xs"
      >
        <SelectValue placeholder="Selecionar cliente" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id} className="text-xs">
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
