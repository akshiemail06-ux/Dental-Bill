import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '../contexts/ClinicContext';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AlertTriangle, Monitor, ShieldAlert } from 'lucide-react';

export const MissingAssetsAlert: React.FC = () => {
  const { missingAssets, setMissingAssets } = useClinic();
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    setMissingAssets(false);
    navigate('/settings?tab=branding');
  };

  return (
    <Dialog open={missingAssets} onOpenChange={setMissingAssets}>
      <DialogContent className="max-w-[90vw] rounded-2xl p-6 sm:max-w-md">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 sm:mx-0">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-2xl font-bold font-heading">Branding Assets Missing</DialogTitle>
          <DialogDescription className="text-gray-500 leading-relaxed pt-2">
            It looks like you're on a new device or your browser data was cleared. 
            <br /><br />
            <strong>Clinic assets (Logo & Stamp) and Doctor Signatures</strong> are stored locally on your device and need to be re-uploaded to appear on your bills.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 my-2 flex gap-3 items-start">
          <Monitor className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>Tip:</strong> For the best experience, use the same device/browser where you originally set up your branding.
          </p>
        </div>

        <DialogFooter className="pt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button 
            variant="ghost"
            className="font-medium rounded-xl h-11" 
            onClick={() => setMissingAssets(false)}
          >
            Later
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-11 px-6 shadow-lg shadow-blue-100" 
            onClick={handleGoToSettings}
          >
            Go to Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
