
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { format } from 'date-fns';
import { Upload, X, FileIcon } from 'lucide-react';

type OfferNews = Database['public']['Tables']['offers_news']['Row'];

const OffersNews = () => {
  const [offersNews, setOffersNews] = useState<OfferNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OfferNews | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    publication_date: format(new Date(), 'yyyy-MM-dd'),
    image_url: ''
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOffersNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offers_news')
        .select('*')
        .order('publication_date', { ascending: false });

      if (error) {
        throw error;
      }

      setOffersNews(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch offers and news",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersNews();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      publication_date: format(new Date(), 'yyyy-MM-dd'),
      image_url: ''
    });
    setEditingItem(null);
    setUploadedImage(null);
    setUploadPreview(null);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
      setUploadPreview(null);
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    setUploadLoading(true);
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `offers_news/${fileName}`;
      
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEdit = (item: OfferNews) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      publication_date: format(new Date(item.publication_date), 'yyyy-MM-dd'),
      image_url: item.image_url || ''
    });
    
    // If there's an existing image, set it as preview
    if (item.image_url) {
      setUploadPreview(item.image_url);
    }
    
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      // Get the item to find the image URL
      const itemToDelete = offersNews.find(item => item.id === id);
      
      // Delete the image from storage if it exists
      if (itemToDelete?.image_url) {
        // Extract the path from the URL
        const urlParts = itemToDelete.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `offers_news/${fileName}`;
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('media')
          .remove([filePath]);
          
        if (storageError) {
          console.error("Error deleting image:", storageError);
        }
      }
      
      // Delete the database record
      const { error } = await supabase
        .from('offers_news')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      
      setOffersNews(offersNews.filter(item => item.id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = formData.image_url;
      
      // If a new image has been uploaded, upload it to Supabase storage
      if (uploadedImage) {
        const uploadedUrl = await uploadFileToStorage(uploadedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      // Always use current date for publication_date
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      
      if (editingItem) {
        const { error } = await supabase
          .from('offers_news')
          .update({
            title: formData.title,
            content: formData.content,
            publication_date: currentDate,
            image_url: imageUrl || null
          })
          .eq('id', editingItem.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('offers_news')
          .insert({
            title: formData.title,
            content: formData.content,
            publication_date: currentDate,
            image_url: imageUrl || null
          });

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Item created successfully",
        });
      }

      setOpen(false);
      resetForm();
      fetchOffersNews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save item",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Offers & News</h1>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>Add New</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={5}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Image Upload</Label>
                <div className="flex flex-col gap-3">
                  {uploadPreview ? (
                    <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={uploadPreview} 
                        alt="Image preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button 
                        type="button"
                        size="icon"
                        variant="destructive" 
                        className="absolute top-2 right-2 rounded-full h-8 w-8"
                        onClick={clearUploadedImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileIcon className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or GIF (max 5MB)</p>
                      </div>
                      <Input 
                        id="image-upload" 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={uploadLoading}>
                {uploadLoading ? (
                  <span className="flex items-center">
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  editingItem ? 'Update' : 'Create'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Offers & News</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : offersNews.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {offersNews.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {item.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Published on {format(new Date(item.publication_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm line-clamp-3">{item.content}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No offers or news found. Click "Add New" to create one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OffersNews;
