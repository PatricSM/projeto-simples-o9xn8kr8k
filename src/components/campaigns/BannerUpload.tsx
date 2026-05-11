import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Upload, X, Eye, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BannerConfig {
  banner_url?: string;
  banner_position: 'first_section' | 'top_first_section' | 'top_all_sections' | 'none';
  banner_height?: number;
}

interface BannerUploadProps {
  config: BannerConfig;
  onUpdate: (config: BannerConfig) => void;
}

export default function BannerUpload({ config, onUpdate }: BannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(config.banner_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione apenas arquivos de imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('campaign-banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-banners')
        .getPublicUrl(data.path);

      setPreviewUrl(publicUrl);
      onUpdate({
        ...config,
        banner_url: publicUrl,
      });

      toast({
        title: 'Sucesso!',
        description: 'Banner carregado com sucesso.',
      });

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível fazer o upload do banner. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeBanner = () => {
    setPreviewUrl(null);
    onUpdate({
      ...config,
      banner_url: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getBannerPositionLabel = (position: string) => {
    const positions = {
      none: 'Sem banner',
      first_section: 'Primeira seção (banner como seção)',
      top_first_section: 'No topo da primeira seção',
      top_all_sections: 'No topo de todas as seções',
    };
    return positions[position as keyof typeof positions] || position;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banner da Pesquisa</CardTitle>
        <CardDescription>
          Adicione um banner visual para tornar sua pesquisa mais atrativa e personalizada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="space-y-4">
          <Label>Imagem do Banner</Label>
          
          {!previewUrl ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Clique para fazer upload do banner</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP até 5MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recomendado: 1200x300px para melhor qualidade
                  </p>
                </div>
                
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Selecionar Imagem'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={previewUrl}
                  alt="Banner preview"
                  className="w-full h-auto max-h-48 object-contain"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={removeBanner}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar Banner
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Posição do Banner</Label>
            <Select
              value={config.banner_position}
              onValueChange={(value) =>
                onUpdate({
                  ...config,
                  banner_position: value as any,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem banner</SelectItem>
                <SelectItem value="first_section">
                  Primeira seção (banner como seção)
                </SelectItem>
                <SelectItem value="top_first_section">
                  No topo da primeira seção
                </SelectItem>
                <SelectItem value="top_all_sections">
                  No topo de todas as seções
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Altura do Banner (px)</Label>
            <Input
              type="number"
              placeholder="300"
              value={config.banner_height || ''}
              onChange={(e) =>
                onUpdate({
                  ...config,
                  banner_height: parseInt(e.target.value) || undefined,
                })
              }
              disabled={config.banner_position === 'none'}
            />
          </div>
        </div>

        {/* Position Description */}
        {config.banner_position !== 'none' && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{getBannerPositionLabel(config.banner_position)}:</strong>
              <br />
              {config.banner_position === 'first_section' && 
                'O banner será exibido como a primeira seção da pesquisa, antes de qualquer pergunta.'
              }
              {config.banner_position === 'top_first_section' && 
                'O banner será exibido no topo da primeira seção, acima das perguntas desta seção.'
              }
              {config.banner_position === 'top_all_sections' && 
                'O banner será exibido no topo de cada seção da pesquisa.'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}