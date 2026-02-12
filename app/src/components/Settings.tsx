import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";


export default function Settings({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Nastavení</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 pb-4">
          TODO
        </div>
      </DialogContent>
    </Dialog>
  );
}