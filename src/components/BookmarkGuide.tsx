import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share, PlusSquare, MoreVertical, Smartphone, Chrome } from 'lucide-react';

interface BookmarkGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookmarkGuide({ open, onOpenChange }: BookmarkGuideProps) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="text-blue-600" />
            Add to Home Screen
          </DialogTitle>
          <DialogDescription>
            Access Instant Dental Bill like a regular app on your phone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {isIOS ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">For iPhone (Safari):</h3>
              <ol className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                  <p>Tap the <span className="inline-flex items-center justify-center p-1 bg-gray-100 rounded mx-1"><Share size={14} className="text-blue-600" /></span> <strong>Share</strong> button in the bottom menu.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
                  <p>Scroll down and tap <span className="inline-flex items-center justify-center p-1 bg-gray-100 rounded mx-1"><PlusSquare size={14} /></span> <strong>Add to Home Screen</strong>.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</div>
                  <p>Tap <strong>Add</strong> in the top right corner.</p>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 font-sans">For Android (Chrome):</h3>
              <ol className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                  <p>Tap the <span className="inline-flex items-center justify-center p-1 bg-gray-100 rounded mx-1"><MoreVertical size={14} /></span> <strong>Menu</strong> (three dots) in the top-right corner.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
                  <p>Tap <span className="inline-flex items-center justify-center p-1 bg-gray-100 rounded mx-1"><Smartphone size={14} /></span> <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</div>
                  <p>Confirm the installation in the prompt.</p>
                </li>
              </ol>
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
            <div className="p-2 bg-white rounded-full shadow-sm self-start">
              <Chrome className="text-blue-600" size={16} />
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              This creates an app icon on your home screen for quick one-tap access without typing the website address.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
