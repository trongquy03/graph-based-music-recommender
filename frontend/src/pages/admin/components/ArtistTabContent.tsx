import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import AddArtistDialog from "./AddArtistDialog";
import ArtistsTable from "./ArtistsTable";

const ArtistTabContent = () => {
  return (
    <Card className="bg-zinc-800/50 border-zinc-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Danh Sách Nghệ Sĩ
            </CardTitle>
            {/* <CardDescription>Manage your artist collection</CardDescription> */}
          </div>
          <AddArtistDialog />
        </div>
      </CardHeader>
      <CardContent>
        <ArtistsTable />
      </CardContent>
    </Card>
  );
};

export default ArtistTabContent;
