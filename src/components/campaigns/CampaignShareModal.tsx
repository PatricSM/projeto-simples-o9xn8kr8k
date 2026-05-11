import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, QrCode, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CampaignShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
}

export default function CampaignShareModal({ 
  isOpen, 
  onClose, 
  campaignId, 
  campaignName 
}: CampaignShareModalProps) {
  const { toast } = useToast();
  const [surveyUrl, setSurveyUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (isOpen && campaignId) {
      // Gerar URL da pesquisa
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/survey/${campaignId}`;
      setSurveyUrl(url);
      
      // Gerar QR Code usando API pública
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [isOpen, campaignId]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado!',
        description: 'Link copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  const openInNewTab = () => {
    window.open(surveyUrl, '_blank');
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${campaignName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Sucesso!',
        description: 'QR Code baixado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o QR Code.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compartilhar Pesquisa</DialogTitle>
          <DialogDescription>
            Compartilhe sua pesquisa "{campaignName}" usando o link direto ou o QR Code.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Link da Pesquisa */}
          <div className="space-y-2">
            <Label htmlFor="survey-url">Link da Pesquisa</Label>
            <div className="flex gap-2">
              <Input 
                id="survey-url"
                value={surveyUrl} 
                readOnly 
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(surveyUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {qrCodeUrl && (
                <>
                  <div className="flex justify-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code da Pesquisa"
                      className="border rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Escaneie este QR Code para acessar a pesquisa diretamente
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRCode}
                  >
                    Baixar QR Code
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Instruções */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Como usar:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Compartilhe o link por email, WhatsApp ou redes sociais</li>
              <li>• Imprima o QR Code e cole em locais visíveis</li>
              <li>• Pacientes podem escanear o código com a câmera do celular</li>
              <li>• O link funciona em qualquer dispositivo com internet</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}